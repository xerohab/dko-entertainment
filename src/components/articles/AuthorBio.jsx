import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import ArticleCard from "./ArticleCard";
import { Loader2 } from "lucide-react";

export default function AuthorBio({ authorEmail, authorName }) {
  const [author, setAuthor] = useState(null);
  const [authorArticles, setAuthorArticles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authorEmail) return;
    base44.entities.User.filter({ email: authorEmail }).then(users => {
      if (users.length) setAuthor(users[0]);
    });
  }, [authorEmail]);

  const handleAuthorClick = async () => {
    setLoading(true);
    const articles = await base44.entities.Article.filter({
      author_email: authorEmail,
      status: "published",
    }, "-published_date", 50);
    setAuthorArticles(articles);
    setLoading(false);
    setShowModal(true);
  };

  if (!author && !authorName) return null;

  const displayName = author?.full_name || authorName || "Unknown Author";
  const motto = author?.motto || "";
  const avatar = author?.avatar || "";

  return (
    <>
      <div
        onClick={handleAuthorClick}
        className="bg-secondary/50 border border-border rounded-lg p-6 my-8 cursor-pointer hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-start gap-4">
          {avatar && (
            <img
              src={avatar}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          )}
          <div className="flex-1">
            <h3 className="font-oswald font-bold text-white text-lg uppercase mb-1">
              {displayName}
            </h3>
            {motto && (
              <p className="text-muted-foreground font-inter text-sm">
                {motto}
              </p>
            )}
            <p className="text-xs text-muted-foreground font-inter mt-2">
              Click to view more articles by this author
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                {avatar && (
                  <img
                    src={avatar}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <h2 className="font-oswald font-bold text-white text-lg uppercase">
                    {displayName}
                  </h2>
                  <p className="text-xs text-muted-foreground font-inter">
                    {authorArticles.length} article{authorArticles.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : authorArticles.length === 0 ? (
                <p className="text-muted-foreground font-inter text-center py-16">
                  No articles published yet
                </p>
              ) : (
                <div className="grid gap-4">
                  {authorArticles.map(article => (
                    <ArticleCard key={article.id} article={article} size="small" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}