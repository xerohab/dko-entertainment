import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicNav from "@/components/layout/PublicNav";
import { Bookmark, Loader2, Trash2, LogIn } from "lucide-react";
import { format } from "date-fns";

export default function SavedArticles() {
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (isAuthed) => {
      setAuthed(isAuthed);
      if (isAuthed) {
        const me = await base44.auth.me();
        setUser(me);
        const items = await base44.entities.SavedArticle.filter({ user_email: me.email }, "-created_date", 100);
        setSaved(items);
      }
      setLoading(false);
    });
  }, []);

  const handleRemove = async (id) => {
    await base44.entities.SavedArticle.delete(id);
    setSaved(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-6 h-6 text-accent" />
          <h1 className="font-oswald font-bold text-white text-3xl uppercase">Saved Articles</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
        ) : !authed ? (
          <div className="text-center py-24">
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-oswald text-white text-xl uppercase mb-2">Login to Save Articles</p>
            <p className="font-inter text-muted-foreground text-sm mb-6">Create an account to bookmark articles and find them here.</p>
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-700 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-24">
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-oswald text-white text-xl uppercase mb-2">No Saved Articles</p>
            <p className="font-inter text-muted-foreground text-sm">Bookmark articles while reading to find them here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
                {item.article_image && (
                  <img src={item.article_image} alt={item.article_title} className="w-20 h-14 object-cover rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/article/${item.article_slug || item.article_id}`}
                    className="font-oswald font-bold text-white text-sm uppercase leading-tight hover:text-primary transition-colors line-clamp-2 block"
                  >
                    {item.article_title}
                  </Link>
                  <p className="font-inter text-muted-foreground text-xs mt-1">
                    Saved {item.created_date ? format(new Date(item.created_date), "MMM d, yyyy") : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}