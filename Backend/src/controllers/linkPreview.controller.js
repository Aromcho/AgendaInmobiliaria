import { fetchLinkPreview, resolvePropertyUrl } from '../utils/linkPreview.util.js';

export async function getLinkPreview(req, res) {
  const { url, ref } = req.query;
  const target = url && typeof url === 'string' ? url : resolvePropertyUrl(ref);
  if (!target) {
    return res.status(400).json({ message: 'url is required' });
  }

  try {
    const preview = await fetchLinkPreview(target);
    if (!preview) return res.status(502).json({ message: 'Could not fetch preview' });
    return res.json(preview);
  } catch {
    return res.status(400).json({ message: 'URL not allowed' });
  }
}
