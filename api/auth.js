export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');

  if (code) {
    try {
      const tokenRes = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.OAUTH_CLIENT_ID,
            client_secret: process.env.OAUTH_CLIENT_SECRET,
            code,
          }),
        }
      );
      const data = await tokenRes.json();

      if (data.error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        return res.end(`<p>OAuth error: ${data.error_description || data.error}</p>`);
      }

      const content = JSON.stringify({
        token: data.access_token,
        provider: 'github',
      });

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html><body>
<script>
  window.opener.postMessage(
    'authorization:github:success:${content.replace(/'/g, "\\'")}',
    '*'
  );
  window.opener.postMessage(${content}, '*');
</script>
</body></html>
      `);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('OAuth exchange failed: ' + err.message);
    }
    return;
  }

  const redirectUri = `https://${req.headers.host}/api/auth`;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const authUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=repo,user` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.writeHead(302, { Location: authUrl });
  res.end();
}
