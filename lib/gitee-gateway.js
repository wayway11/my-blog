const GITEE_API_BASE = 'https://gitee.com/api/v5';
const OWNER = 'wayway11';
const REPO = 'my-blog';
const DEFAULT_BRANCH = 'master';

export function getToken(request) {
  const auth = request.headers.get('Authorization') || '';
  return auth.replace('Bearer ', '');
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function verifyToken(token) {
  const res = await fetch(`${GITEE_API_BASE}/user?access_token=${token}`);
  return res.ok;
}

export function giteeHeaders() {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'DecapCMS-Blog/1.0',
  };
}

export async function listEntries(token, path, branch = DEFAULT_BRANCH) {
  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?access_token=${token}&ref=${branch}`;
  const res = await fetch(url, { headers: giteeHeaders() });

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

export async function getEntry(token, path, branch = DEFAULT_BRANCH) {
  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?access_token=${token}&ref=${branch}`;
  const res = await fetch(url, { headers: giteeHeaders() });

  if (!res.ok) {
    if (res.status === 404) return null;
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  const file = await res.json();
  const raw = Buffer.from(file.content, 'base64').toString('utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let frontmatter = {};
  let body = raw;

  if (match) {
    const [, fmStr, bodyStr] = match;
    fmStr.split('\n').forEach(line => {
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m) frontmatter[m[1]] = m[2].trim();
    });
    body = bodyStr.trim();
  }

  return { name: file.name, path: file.path, sha: file.sha, raw, body, frontmatter };
}

export function buildFileContent(data) {
  const lines = ['---'];
  lines.push(`title: ${data.title}`);
  if (data.date) lines.push(`date: ${data.date}`);
  if (Array.isArray(data.tags) && data.tags.length > 0) {
    lines.push('tags:');
    data.tags.forEach(t => lines.push(`  - ${t}`));
  }
  if (data.summary) lines.push(`summary: ${data.summary}`);
  if (data.draft) lines.push('draft: true');
  lines.push('---');
  lines.push('');
  lines.push(data.body || '');
  return lines.join('\n');
}

export async function saveEntry(token, path, content, sha, message, branch = DEFAULT_BRANCH) {
  const body = {
    access_token: token,
    content: Buffer.from(content).toString('base64'),
    message: message,
    branch: branch,
  };
  if (sha) body.sha = sha;

  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: giteeHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  return res.json();
}

export async function deleteEntry(token, path, sha, message, branch = DEFAULT_BRANCH) {
  if (!sha) throw new Error('sha is required for delete');

  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?access_token=${token}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: giteeHeaders(),
    body: JSON.stringify({
      access_token: token,
      message: message,
      sha: sha,
      branch: branch,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  return res.json();
}

export async function uploadMedia(token, filename, contentBase64, branch = DEFAULT_BRANCH) {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `public/images/${cleanName}`;

  let sha = null;
  try {
    const checkUrl = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?access_token=${token}&ref=${branch}`;
    const checkRes = await fetch(checkUrl, { headers: giteeHeaders() });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }
  } catch (_) { /* file doesn't exist yet, normal creation */ }

  const body = {
    access_token: token,
    content: contentBase64,
    message: `Upload media: ${cleanName}`,
    branch: branch,
  };
  if (sha) body.sha = sha;

  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: giteeHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  const result = await res.json();
  return {
    url: `/images/${cleanName}`,
    path: path,
    sha: result.content?.sha || result.sha,
  };
}
