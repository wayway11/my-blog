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

    return new Response(JSON.stringify({ message: 'API gateway ready' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
