import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicNav from "@/components/layout/PublicNav";
import ArticleCard from "@/components/articles/ArticleCard";
import { Loader2, Search } from "lucide-react";

export default function SearchPage() {
  const location = useLocation();
  const q = new URLSearchParams(location.search).get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    base44.entities.Article.filter({ status: "published" }, "-published_date", 50)
      .then(all => {
        const lower = q.toLowerCase();
        setResults(all.filter(a =>
          a.title?.toLowerCase().includes(lower) ||
          a.excerpt?.toLowerCase().includes(lower) ||
          a.category?.toLowerCase().includes(lower)
        ));
      })
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground font-inter text-sm mb-2">
            <Search className="w-4 h-4" />
            <span>Search results for</span>
          </div>
          <h1 className="font-oswald font-bold text-white text-3xl uppercase">"{q}"</h1>
          {!loading && <p className="text-muted-foreground font-inter text-sm mt-1">{results.length} results found</p>}
        </div>
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}
      </main>
    </div>
  );
}