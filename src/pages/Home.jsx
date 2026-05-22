import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicNav from "@/components/layout/PublicNav";
import ArticleCard from "@/components/articles/ArticleCard";
import { Search, Filter, Loader2, ChevronDown } from "lucide-react";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    base44.entities.Category.list("sort_order", 200).then(setCategories).catch(() => {});
    loadArticles(1, "", "");
  }, []);

  const loadArticles = async (pageNum, searchVal, catVal, replace = true) => {
    setLoading(true);
    const all = await base44.entities.Article.filter({ status: "published" }, "-published_date", 200);
    let filtered = all;
    if (searchVal) {
      const q = searchVal.toLowerCase();
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.excerpt?.toLowerCase().includes(q) ||
        a.author_name?.toLowerCase().includes(q)
      );
    }
    if (catVal) {
      filtered = filtered.filter(a =>
        a.categories?.includes(catVal) || a.category === catVal
      );
    }
    const start = 0;
    const end = pageNum * PAGE_SIZE;
    setHasMore(end < filtered.length);
    if (replace) {
      setArticles(filtered.slice(start, end));
    } else {
      setArticles(filtered.slice(start, end));
    }
    setLoading(false);
  };

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    loadArticles(1, val, selectedCategory);
  };

  const handleCategory = (cat) => {
    setSelectedCategory(cat);
    setPage(1);
    loadArticles(1, search, cat);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadArticles(next, search, selectedCategory);
  };

  const topLevel = categories.filter(c => !c.parent_id);
  const hero = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Search + Filter Bar */}
      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <button
              onClick={() => handleCategory("")}
              className={`shrink-0 px-3 py-1.5 rounded font-oswald text-xs uppercase tracking-wider transition-colors ${
                !selectedCategory ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-white"
              }`}
            >
              All
            </button>
            {topLevel.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.name)}
                className={`shrink-0 px-3 py-1.5 rounded font-oswald text-xs uppercase tracking-wider transition-colors ${
                  selectedCategory === cat.name ? "text-white" : "bg-secondary text-muted-foreground hover:text-white"
                }`}
                style={selectedCategory === cat.name ? { backgroundColor: cat.color || "#CC0000" } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && articles.length === 0 ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground font-inter">
            <p className="text-lg">No articles found.</p>
          </div>
        ) : (
          <>
            {/* Hero */}
            {hero && !search && !selectedCategory && (
              <div className="mb-8">
                <ArticleCard article={hero} size="hero" />
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(search || selectedCategory ? articles : rest).map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-secondary border border-border rounded-lg font-oswald text-sm uppercase tracking-wider text-foreground hover:border-primary transition-colors disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-oswald font-bold text-xs">DKO</span>
            </div>
            <span className="font-oswald font-bold text-white text-base">DKO Wrestling &amp; Entertainment</span>
          </div>
          <p className="text-muted-foreground font-inter text-xs">© {new Date().getFullYear()} DKO Wrestling and Entertainment. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}