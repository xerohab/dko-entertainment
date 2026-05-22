import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import OAuth from 'npm:oauth-1.0a@2.2.6';
import { createHmac } from 'node:crypto';

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
      return Response.json({ error: 'Twitter credentials not configured' }, { status: 400 });
    }

    // Build tweet text
    const articleUrl = `${Deno.env.get('SITE_URL') || 'https://dko-wrestling.base44.app'}/article/${article.slug || article.id}`;
    const tweetText = `${article.title}\n\n${articleUrl}`;

    // OAuth 1.0a signing
    const oauth = new OAuth({
      consumer: { key: apiKey, secret: apiSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return createHmac('sha1', key).update(base_string).digest('base64');
      },
    });

    const url = 'https://api.twitter.com/2/tweets';
    const token = { key: accessToken, secret: accessSecret };
    const authHeader = oauth.toHeader(oauth.authorize({ url, method: 'POST' }, token));

    const payload = { text: tweetText };

    // Upload and attach featured image if exists
    if (article.featured_image) {
      const imgRes = await fetch(article.featured_image);
      const bytes = await imgRes.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));

      const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
      const uploadAuth = oauth.toHeader(oauth.authorize({ url: uploadUrl, method: 'POST' }, token));
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: uploadAuth['Authorization'] },
        body: new URLSearchParams({ media_data: b64 }),
      });

      const media = await uploadRes.json();
      if (media.media_id) {
        payload.media = { media_ids: [media.media_id.toString()] };
      }
    }

    const tweetRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader['Authorization'],
      },
      body: JSON.stringify(payload),
    });

    const tweetData = await tweetRes.json();

    if (tweetRes.ok) {
      // Mark as tweeted
      await base44.asServiceRole.entities.Article.update(articleId, { tweeted: true });
      return Response.json({ success: true, tweet: tweetData });
    } else {
      console.error('Twitter API error:', tweetData);
      return Response.json({ error: 'Twitter API error', details: tweetData }, { status: 500 });
    }
  } catch (error) {
    console.error('autoTweetArticle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});