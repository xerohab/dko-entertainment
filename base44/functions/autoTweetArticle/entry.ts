import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function oauth1aSign(method, url, params, consumerKey, consumerSecret, accessToken, accessSecret) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  const allParams = { ...oauthParams, ...params };
  const paramStr = Object.keys(allParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&');

  const sigBase = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramStr)}`;
  const sigKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessSecret)}`;

  const keyBytes = new TextEncoder().encode(sigKey);
  const msgBytes = new TextEncoder().encode(sigBase);

  return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    .then(key => crypto.subtle.sign('HMAC', key, msgBytes))
    .then(sig => {
      const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
      oauthParams.oauth_signature = sigB64;

      const header = 'OAuth ' + Object.keys(oauthParams)
        .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
        .join(', ');
      return header;
    });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { articleId, force } = body;
    if (!articleId) {
      return Response.json({ error: 'articleId is required' }, { status: 400 });
    }

    // Get article
    const articles = await base44.asServiceRole.entities.Article.filter({ id: articleId });
    if (!articles.length) {
      return Response.json({ error: 'Article not found' }, { status: 404 });
    }
    const article = articles[0];

    // Skip if already tweeted (unless force flag is set)
    if (article.tweeted && !force) {
      return Response.json({ message: 'Already tweeted' });
    }

    // Get Twitter credentials from SiteSettings
    const settings = await base44.asServiceRole.entities.SiteSettings.list();
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    const apiKey = settingsMap['twitter_api_key'];
    const apiSecret = settingsMap['twitter_api_secret'];
    const accessToken = settingsMap['twitter_access_token'];
    const accessSecret = settingsMap['twitter_access_secret'];

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      return Response.json({ error: 'Twitter OAuth 1.0a credentials not fully configured in Site Settings.' }, { status: 400 });
    }

    // Build tweet text
    const siteUrl = (Deno.env.get('SITE_URL') || 'https://dko-wrestling.base44.app').replace(/\/+$/, '');
    const articleUrl = `${siteUrl}/article/${article.slug || article.id}`;
    const tweetText = `${article.title}\n\n${articleUrl}`;

    const tweetUrl = 'https://api.twitter.com/2/tweets';
    const payload = { text: tweetText };

    // Upload and attach featured image if exists
    if (article.featured_image) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const imgRes = await fetch(article.featured_image, { signal: controller.signal });
        const bytes = await imgRes.arrayBuffer();
        clearTimeout(timeout);

        const uint8 = new Uint8Array(bytes.slice(0, 5242880));
        let b64 = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8.length; i += chunkSize) {
          b64 += String.fromCharCode(...uint8.slice(i, i + chunkSize));
        }
        b64 = btoa(b64);

        const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
        const uploadAuth = await oauth1aSign('POST', uploadUrl, { media_data: b64 }, apiKey, apiSecret, accessToken, accessSecret);
        
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 15000);
        
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 
            'Authorization': uploadAuth,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({ media_data: b64 }),
          signal: controller2.signal,
        });
        clearTimeout(timeout2);

        const media = await uploadRes.json();
        if (media.media_id_string) {
          payload.media = { media_ids: [media.media_id_string] };
        }
      } catch (imgErr) {
        console.warn('Image upload failed (tweet will still post without image):', imgErr.message);
      }
    }

    const tweetAuth = await oauth1aSign('POST', tweetUrl, {}, apiKey, apiSecret, accessToken, accessSecret);

    const tweetRes = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': tweetAuth,
      },
      body: JSON.stringify(payload),
    });

    const tweetData = await tweetRes.json();

    if (tweetRes.ok) {
      await base44.asServiceRole.entities.Article.update(articleId, { tweeted: true });
      return Response.json({ success: true, tweet: tweetData });
    } else {
      const msg = tweetData?.detail || tweetData?.errors?.[0]?.message || JSON.stringify(tweetData);
      return Response.json({ error: `Twitter API error: ${msg}`, details: tweetData }, { status: tweetRes.status });
    }
  } catch (error) {
    console.error('autoTweetArticle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});