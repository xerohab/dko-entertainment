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

    const { articleId } = await req.json();
    if (!articleId) {
      return Response.json({ error: 'articleId is required' }, { status: 400 });
    }

    // Get article
    const articles = await base44.asServiceRole.entities.Article.filter({ id: articleId });
    if (!articles.length) {
      return Response.json({ error: 'Article not found' }, { status: 404 });
    }
    const article = articles[0];

    // Don't tweet if already tweeted
    if (article.tweeted) {
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

    // Build request payload with optional media
    const payload = { text: tweetText };
    
    // Add media if featured image exists
    if (article.featured_image) {
      const imageRes = await fetch(article.featured_image);
      if (imageRes.ok) {
        const imageBuffer = await imageRes.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        
        // Upload media to Twitter
        const mediaUrl = 'https://upload.twitter.com/1.1/media/upload.json';
        const mediaAuthHeader = oauth.toHeader(oauth.authorize({ url: mediaUrl, method: 'POST' }, token));
        
        const mediaRes = await fetch(mediaUrl, {
          method: 'POST',
          headers: {
            'Authorization': mediaAuthHeader['Authorization'],
          },
          body: new URLSearchParams({
            media_data: base64Image,
          }),
        });
        
        const mediaData = await mediaRes.json();
        if (mediaData.media_id) {
          payload.media = { media_ids: [mediaData.media_id.toString()] };
        }
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