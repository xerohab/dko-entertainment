import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import ArticleCard from "@/components/articles/ArticleCard";
import { Loader2, ChevronRight } from "lucide-react";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Article.filter({ status: "published" }, "-published_date", 24),
      base44.entities.Category.list("sort_order", 200),
    ]).then(([arts, cats]) => {
      setArticles(arts);
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, []);

  const hero = articles[0];
  const secondary = articles.slice(1, 3);
  const rest = articles.slice(3, 15);

  // Group articles by top-level category for sections
  const topLevelCats = categories.filter(c => !c.parent_id);
  const getArticlesByCategory = (catName) =>
    articles.filter(a => a.category?.toLowerCase() === catName?.toLowerCase()).slice(0, 4);

  return (
    <div className="min-h-screen bg-background font-inter">
      <PublicNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-32">
            <h2 className="font-oswald font-bold text-white text-3xl uppercase">No Articles Yet</h2>
            <p className="text-muted-foreground font-inter mt-2">Check back soon for the latest wrestling news.</p>
          </div>
        ) : (
          <>
            {/* Category Quick Links */}
            {topLevelCats.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
                <Link
                  to="/"
                  className="shrink-0 px-4 py-1.5 bg-primary text-white font-oswald text-xs font-semibold tracking-widest uppercase rounded-full"
                >
                  ALL
                </Link>
                {topLevelCats.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="shrink-0 px-4 py-1.5 bg-secondary border border-border text-foreground font-oswald text-xs font-semibold tracking-widest uppercase rounded-full hover:border-primary hover:text-primary transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Hero + Secondary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {hero && (
                <div className="lg:col-span-2">
                  <ArticleCard article={hero} size="hero" />
                </div>
              )}
              {secondary.length > 0 && (
                <div className="flex flex-col gap-6">
                  {secondary.map(a => (
                    <ArticleCard key={a.id} article={a} size="default" />
                  ))}
                </div>
              )}
            </div>

            {/* Latest News Grid */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1 h-6 bg-primary rounded" />
              <h2 className="font-oswald font-bold text-white text-xl uppercase tracking-wider">Latest Wrestling News &amp; Rumors</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
              {rest.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>

            {/* Per-category sections */}
            {topLevelCats.map(cat => {
              const catArticles = getArticlesByCategory(cat.name);
              if (catArticles.length === 0) return null;
              return (
                <div key={cat.id} className="mb-12">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 bg-primary rounded" />
                      <h2 className="font-oswald font-bold text-white text-xl uppercase tracking-wider">{cat.name}</h2>
                    </div>
                    <Link
                      to={`/category/${cat.slug}`}
                      className="flex items-center gap-1 text-primary font-oswald text-sm uppercase tracking-wider hover:underline"
                    >
                      View All <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {catArticles.map(a => <ArticleCard key={a.id} article={a} />)}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>

      <footer className="bg-black border-t border-border mt-4 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-oswald font-bold text-white text-lg mb-0.5">DKO Wrestling &amp; Entertainment</div>
              <p className="text-muted-foreground font-inter text-sm">Your #1 Source for Wrestling News</p>
            </div>
            {topLevelCats.length > 0 && (
              <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                {topLevelCats.map(cat => (
                  <Link key={cat.id} to={`/category/${cat.slug}`} className="text-muted-foreground font-oswald text-xs uppercase tracking-wider hover:text-primary transition-colors">
                    {cat.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="border-t border-border/50 mt-6 pt-4 text-center text-muted-foreground font-inter text-xs">
            © {new Date().getFullYear()} DKO Wrestling &amp; Entertainment. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}