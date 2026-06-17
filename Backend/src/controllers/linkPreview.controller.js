import { fetchLinkPreview } from '../utils/linkPreview.util.js';

export async function getLinkPreview(req, res) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'url is required' });
  }

  try {
    const preview = await fetchLinkPreview(url);
    if (!preview) return res.status(502).json({ message: 'Could not fetch preview' });
    return res.json(preview);
  } catch {
    return res.status(400).json({ message: 'URL not allowed' });
  }
}
