import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { jsonData } = await req.json();
    if (!jsonData || !jsonData.find(item => item.type === 'table' && item.name === 'wp93_posts')) {
      return Response.json({ error: "Invalid WordPress export format" }, { status: 400 });
    }

    const tableData = jsonData.find(item => item.type === 'table' && item.name === 'wp93_posts');
    const posts = tableData?.data || [];

    // Get all images and articles
    const images = await base44.asServiceRole.entities.MediaImage.list("-created_date", 1000);
    const articles = await base44.asServiceRole.entities.Article.list("-created_date", 1000);

    let matched = 0;

    // Match images to articles
    for (const img of images) {
      const filename = img.url?.split('/').pop()?.toLowerCase() || '';
      
      for (const article of articles) {
        // Try to match by featured_image filename or article ID
        const articleTitle = article.title?.toLowerCase().replace(/\s+/g, '-') || '';
        const postFromJson = posts.find(p => 
          p.post_title === article.title || 
          p.ID === article.id
        );

        if (postFromJson && filename.includes(postFromJson.ID)) {
          // Update article with featured image if it doesn't have one
          if (!article.featured_image || article.featured_image === '') {
            await base44.asServiceRole.entities.Article.update(article.id, {
              featured_image: img.url
            });
            matched++;
          }
          break;
        }
      }
    }

    return Response.json({ 
      matched, 
      articles: articles.length,
      totalImages: images.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});