import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PublicNav from "@/components/layout/PublicNav";
import ArticleCard from "@/components/articles/ArticleCard";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Article.filter({ status: "published" }, "-published_date", 20)
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  const hero = articles[0];
  const secondary = articles.slice(1, 3);
  const rest = articles.slice(3);

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

            {/* Section Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1 h-6 bg-primary rounded" />
              <h2 className="font-oswald font-bold text-white text-xl uppercase tracking-wider">Latest Wrestling News &amp; Rumors</h2>
            </div>

            {/* Article Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {rest.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="bg-black border-t border-border mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-oswald font-bold text-white text-lg mb-1">DKO Wrestling &amp; Entertainment</div>
          <p className="text-muted-foreground font-inter text-sm">Your #1 Source for Wrestling News</p>
        </div>
      </footer>
    </div>
  );
}