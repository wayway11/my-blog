const REDIRECT_URI = 'https://my-blog-steel-ten.vercel.app/api/auth';
const SITE_ORIGIN = 'https://my-blog-steel-ten.vercel.app';

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');

  if (code) {
    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });
      const data = await tokenRes.json();

      if (data.error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        return res.end(`<html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h2>登录失败</h2><p>${data.error_description || data.error}</p></body></html>`);
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>登录成功</title></head>
<body style="font-family:sans-serif;padding:40px;text-align:center">
  <p>登录成功</p>
  <p id="status">正在跳转...</p>
  <script>
    var token = '${data.access_token}';
    var origin = '${SITE_ORIGIN}';
    var sent = false;

    // Try postMessage
    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage('authorization:github:success:' + token, origin);
        sent = true;
      }
    } catch(e) {
      document.getElementById('status').textContent = '弹窗通信失败: ' + e.message;
    }

    // Backup: save to localStorage then close
    try {
      localStorage.setItem('decap-cms-github-token', token);
    } catch(e) {}

    setTimeout(function() {
      if (sent) {
        try { window.close(); } catch(e) {}
      }
      // If not in a popup, redirect to admin
      if (!window.opener || window.opener === window) {
        window.location.href = '/admin/';
      }
    }, 1500);
  </script>
</body></html>`);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('OAuth exchange failed: ' + err.message);
    }
    return;
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    res.writeHead(500);
    return res.end('OAUTH_CLIENT_ID not set');
  }

  const authUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=repo,user` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.writeHead(302, { Location: authUrl });
  res.end();
}
