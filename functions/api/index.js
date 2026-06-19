const GITEE_API_BASE = 'https://gitee.com/api/v5';
const OWNER = 'wayway11';
const REPO = 'my-blog';
const DEFAULT_BRANCH = 'master';

export function getToken(request) {
  const auth = request.headers.get('Authorization') || '';
  return auth.replace('Bearer ', '');
}

export function unauthorized() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized — 请提供 Gitee Personal Access Token' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function verifyToken(token) {
  const res = await fetch(`${GITEE_API_BASE}/user?access_token=${token}`);
  return res.ok;
}

export function giteeHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'DecapCMS-Blog/1.0',
  };
}

export async function listEntries(token, path, branch = DEFAULT_BRANCH) {
  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?access_token=${token}&ref=${branch}`;
  const res = await fetch(url, { headers: giteeHeaders(token) });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  const data = await res.json();
  return (Array.isArray(data) ? data : [data])
    .filter(f => f.type === 'file' && f.name.endsWith('.md'))
    .map(f => ({
      name: f.name,
      path: f.path,
      slug: f.name.replace('.md', ''),
    }));
}

export default {
  async fetch(request) {
    const token = getToken(request);
    if (!token) return unauthorized();

    const isValid = await verifyToken(token);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid token — Gitee 令牌无效或已过期' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const method = request.method;
    const path = url.searchParams.get('path') || '';
    const branch = url.searchParams.get('branch') || DEFAULT_BRANCH;

    // GET /api/entries
    if (method === 'GET' && url.pathname.endsWith('/entries')) {
      try {
        const entries = await listEntries(token, path, branch);
        return new Response(JSON.stringify(entries), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ message: 'API gateway ready' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
