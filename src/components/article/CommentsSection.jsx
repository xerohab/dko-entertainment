import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Send, User, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function CommentsSection({ article }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ author_name: "", author_email: "", body: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadComments();
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setCurrentUser(me);
        setForm(f => ({
          ...f,
          author_name: me.display_name || me.full_name || "",
          author_email: me.email || "",
        }));
      }
    });
  }, [article.id]);

  const loadComments = async () => {
    setLoading(true);
    const c = await base44.entities.Comment.filter({ article_id: article.id, status: "approved" }, "-created_date", 50);
    setComments(c);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.body.trim() || !form.author_name.trim()) return;
    setSubmitting(true);
    await base44.entities.Comment.create({
      article_id: article.id,
      article_title: article.title,
      author_name: form.author_name,
      author_email: form.author_email,
      author_avatar: currentUser?.avatar || "",
      body: form.body,
      user_id: currentUser?.id || null,
      status: "approved",
    });
    setForm(f => ({ ...f, body: "" }));
    setSubmitted(true);
    setSubmitting(false);
    loadComments();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-6 bg-accent rounded" />
        <h2 className="font-oswald font-bold text-white text-xl uppercase tracking-wider flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-accent" />
          Comments ({comments.length})
        </h2>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 mb-8">
        <h3 className="font-oswald font-bold text-white text-base uppercase mb-4">Leave a Comment</h3>
        {!currentUser && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              value={form.author_name}
              onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
              placeholder="Your name *"
              required
              className="bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
            <input
              value={form.author_email}
              onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))}
              placeholder="Email (optional)"
              type="email"
              className="bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
          </div>
        )}
        {currentUser && (
          <div className="flex items-center gap-3 mb-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary overflow-hidden flex items-center justify-center shrink-0">
              {currentUser.avatar
                ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-white text-xs font-oswald font-bold">{currentUser.full_name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <span className="text-white font-inter text-sm">Commenting as <strong>{currentUser.display_name || currentUser.full_name}</strong></span>
          </div>
        )}
        <textarea
          value={form.body}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          placeholder="Share your thoughts..."
          required
          rows={4}
          className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-none mb-3"
        />
        <div className="flex items-center justify-between">
          {submitted && <span className="text-green-400 font-inter text-sm">Comment posted!</span>}
          <button
            type="submit"
            disabled={submitting}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post Comment
          </button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground font-inter text-sm">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                  {c.author_avatar
                    ? <img src={c.author_avatar} alt="" className="w-full h-full object-cover" />
                    : <User className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-inter font-semibold text-white text-sm">{c.author_name}</span>
                    <span className="text-muted-foreground font-inter text-xs">
                      {c.created_date ? format(new Date(c.created_date), "MMM d, yyyy") : ""}
                    </span>
                  </div>
                  <p className="text-foreground font-inter text-sm leading-relaxed">{c.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}