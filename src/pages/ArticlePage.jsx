import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicNav from "@/components/layout/PublicNav";
import ArticleCard from "@/components/articles/ArticleCard";
import CommentsSection from "@/components/article/CommentsSection";
import { format } from "date-fns";
import { Loader2, User, Calendar, Eye, MessageCircle } from "lucide-react";

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewCount, setViewCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const tracked = useRef(false);

  useEffect(() => {
    tracked.current = false;
    const load = async () => {
      setLoading(true);
      let arts = await base44.entities.Article.filter({ slug, status: "published" });
      if (!arts.length) arts = await base44.entities.Article.filter({ id: slug, status: "published" });
      if (arts.length) {
        const a = arts[0];
        setArticle(a);
        const [rel, vc, cc] = await Promise.all([
          base44.entities.Article.filter({ status: "published", category: a.category }, "-published_date", 4),
          base44.entities.ArticleView.filter({ article_id: a.id }),
          base44.entities.Comment.filter({ article_id: a.id, status: "approved" }),
        ]);
        setRelated(rel.filter(r => r.id !== a.id).slice(0, 3));
        setViewCount(vc.length + 1);
        setCommentCount(cc.length);

        // Track view (once per mount)
        if (!tracked.current) {
          tracked.current = true;
          base44.entities.ArticleView.create({
            article_id: a.id,
            article_title: a.title,
            article_slug: a.slug || a.id,
            referrer: document.referrer || "",
          }).catch(() => {});
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="text-center py-32">
          <h2 className="font-oswald font-bold text-white text-3xl uppercase">Article Not Found</h2>
          <Link to="/" className="text-primary font-inter text-sm mt-4 inline-block hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Category */}
        <div className="mb-4">
          <Link to={`/category/${article.category?.toLowerCase()}`}>
            <span className="inline-block bg-primary text-white text-xs font-oswald font-semibold tracking-widest uppercase px-3 py-1 rounded hover:bg-red-700 transition-colors">
              {article.category}
            </span>
          </Link>
        </div>

        {/* Title */}
        <h1 className="font-oswald font-bold text-white text-3xl md:text-4xl lg:text-5xl uppercase leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-border">
          {article.author_name && (
            <div className="flex items-center gap-1.5 text-muted-foreground font-inter text-sm">
              <User className="w-4 h-4" />
              <span>{article.author_name}</span>
            </div>
          )}
          {article.published_date && (
            <div className="flex items-center gap-1.5 text-muted-foreground font-inter text-sm">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(article.published_date), "MMMM d, yyyy")}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground font-inter text-sm">
            <Eye className="w-4 h-4" />
            <span>{viewCount.toLocaleString()} views</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground font-inter text-sm">
            <MessageCircle className="w-4 h-4" />
            <span>{commentCount} comments</span>
          </div>
        </div>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="mb-8 rounded-xl overflow-hidden border border-border">
            <img src={article.featured_image} alt={article.title} className="w-full object-cover max-h-[500px]" />
          </div>
        )}

        {/* Body */}
        <div
          className="prose prose-invert prose-headings:font-oswald prose-headings:uppercase prose-headings:text-white prose-p:font-inter prose-p:text-foreground prose-p:leading-relaxed prose-a:text-primary max-w-none"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Comments */}
        <CommentsSection article={article} />
      </article>

      {/* Related */}
      {related.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div className="border-t border-border pt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-primary rounded" />
              <h2 className="font-oswald font-bold text-white text-xl uppercase tracking-wider">More {article.category} News</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map(r => <ArticleCard key={r.id} article={r} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}