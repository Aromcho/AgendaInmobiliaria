import dns from 'node:dns/promises';
import net from 'node:net';

const URL_RE = /(https?:\/\/[^\s<>"']+)/i;
const FETCH_TIMEOUT_MS = 4000;
const MAX_BYTES = 500_000;

export function extractFirstUrl(text) {
  if (!text) return null;
  const match = String(text).match(URL_RE);
  return match ? match[0] : null;
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fe80:')) return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('::ffff:')) return isPrivateIp(lower.slice(7));
  return false;
}

async function assertPublicHost(hostname) {
  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error('Blocked host');
  }
  const records = await dns.lookup(hostname, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error('Blocked host');
  }
}

function pickMeta(html, re1, re2) {
  const m1 = html.match(re1);
  if (m1) return m1[1];
  if (re2) {
    const m2 = html.match(re2);
    if (m2) return m2[1];
  }
  return '';
}

export async function fetchLinkPreview(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;

  await assertPublicHost(parsed.hostname);

  const response = await fetch(parsed.toString(), {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AgendaInmobiliariaBot/1.0)' },
  });
  if (!response.ok || !response.body) return null;

  const finalUrl = new URL(response.url || parsed.toString());
  if (!['http:', 'https:'].includes(finalUrl.protocol)) return null;
  await assertPublicHost(finalUrl.hostname);

  let html = '';
  let received = 0;
  for await (const chunk of response.body) {
    received += chunk.length;
    html += Buffer.from(chunk).toString('utf8');
    if (received > MAX_BYTES) break;
  }

  const image = pickMeta(
    html,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
  );
  const title = pickMeta(
    html,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<title>([^<]*)<\/title>/i
  );
  const description = pickMeta(
    html,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
  );

  let resolvedImage = '';
  if (image) {
    try {
      resolvedImage = new URL(image, finalUrl).toString();
    } catch {
      resolvedImage = '';
    }
  }

  return {
    url: finalUrl.toString(),
    title: title.trim(),
    description: description.trim(),
    image: resolvedImage,
  };
}
