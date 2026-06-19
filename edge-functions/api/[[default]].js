import {
  getToken,
  verifyToken,
  jsonResponse,
  listEntries,
  getEntry,
  buildFileContent,
  saveEntry,
  deleteEntry,
  uploadMedia,
} from '../../lib/gitee-gateway.js';

const DEFAULT_BRANCH = 'master';

export default async function onRequest(context) {
  const { request } = context;
  const token = getToken(request);

  if (!token) {
    return jsonResponse({ error: 'Unauthorized — 请提供 Gitee Personal Access Token' }, 401);
  }

  const isValid = await verifyToken(token);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid token — Gitee 令牌无效或已过期' }, 401);
  }

  const url = new URL(request.url);
  const method = request.method;
  const path = url.searchParams.get('path') || '';
  const branch = url.searchParams.get('branch') || DEFAULT_BRANCH;

  try {
    // GET /api/entries
    if (method === 'GET' && url.pathname.endsWith('/entries')) {
      const entries = await listEntries(token, path, branch);
      return jsonResponse(entries);
    }

    // GET /api/entry
    if (method === 'GET' && url.pathname.endsWith('/entry')) {
      if (!path) return jsonResponse({ error: 'path is required' }, 400);
      const entry = await getEntry(token, path, branch);
      if (!entry) return jsonResponse({ error: 'Not found' }, 404);
      return jsonResponse(entry);
    }

    // POST /api/entries
    if (method === 'POST' && url.pathname.endsWith('/entries')) {
      const body = await request.json();
      const fileContent = buildFileContent(body);
      const message = body.sha
        ? `Update post: ${body.slug || body.path}`
        : `Create post: ${body.slug || body.path}`;
      const result = await saveEntry(token, body.path, fileContent, body.sha, message, branch);
      return jsonResponse(result);
    }

    // DELETE /api/entries
    if (method === 'DELETE' && url.pathname.endsWith('/entries')) {
      const body = await request.json();
      if (!body.sha) return jsonResponse({ error: 'sha is required' }, 400);
      const result = await deleteEntry(token, body.path, body.sha, `Delete post: ${body.path}`, branch);
      return jsonResponse(result);
    }

    // POST /api/media
    if (method === 'POST' && url.pathname.endsWith('/media')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) return jsonResponse({ error: 'file is required' }, 400);
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const result = await uploadMedia(token, file.name, base64, branch);
      return jsonResponse(result);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
