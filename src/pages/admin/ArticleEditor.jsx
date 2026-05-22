import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReactQuill from "react-quill";
import ImagePickerModal from "@/components/media/ImagePickerModal";
import { Save, Send, ArrowLeft, Image as ImageIcon, X, Loader2, Twitter } from "lucide-react";

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const isNew = !id || id === "new";

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", body: "", category: "",
    featured_image: "", status: "draft",
  });
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    base44.entities.Category.list("sort_order", 20).then(setCategories);
    if (!isNew) {
      base44.entities.Article.filter({ id }).then(arts => {
        if (arts.length) {
          const a = arts[0];
          setForm({
            title: a.title || "",
            slug: a.slug || "",
            excerpt: a.excerpt || "",
            body: a.body || "",
            category: a.category || "",
            featured_image: a.featured_image || "",
            status: a.status || "draft",
          });
        }
        setLoading(false);
      });
    }
  }, [id]);

  const generateSlug = (title) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm(f => ({ ...f, title, slug: isNew ? generateSlug(title) : f.slug }));
  };

  const handleSave = async (publish = false) => {
    setSaving(true);
    const now = new Date().toISOString();
    const data = {
      ...form,
      status: publish ? "published" : "draft",
      author_email: user.email,
      author_name: user.display_name || user.full_name,
      ...(publish && !form.published_date ? { published_date: now } : {}),
    };
    if (isNew) {
      const created = await base44.entities.Article.create(data);
      if (publish) {
        // Trigger tweet
        base44.functions.invoke("autoTweetArticle", { articleId: created.id }).catch(() => {});
      }
      navigate(`/admin/articles`);
    } else {
      await base44.entities.Article.update(id, data);
      if (publish && data.status === "published") {
        base44.functions.invoke("autoTweetArticle", { articleId: id }).catch(() => {});
      }
      navigate("/admin/articles");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin/articles")} className="text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-oswald font-bold text-white text-2xl uppercase">
          {isNew ? "New Article" : "Edit Article"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <label className="block font-inter text-sm font-medium text-foreground mb-1.5">Headline *</label>
            <input
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Enter article headline..."
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white font-oswald text-xl placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block font-inter text-sm font-medium text-foreground mb-1.5">URL Slug</label>
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="url-slug"
              className="w-full bg-secondary border border-border rounded px-4 py-2 text-foreground font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block font-inter text-sm font-medium text-foreground mb-1.5">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Short summary (shown in article cards)..."
              rows={2}
              className="w-full bg-secondary border border-border rounded px-4 py-2 text-foreground font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block font-inter text-sm font-medium text-foreground mb-1.5">Article Body *</label>
            <div className="rounded-lg overflow-hidden border border-border [&_.ql-toolbar]:bg-secondary [&_.ql-toolbar]:border-border [&_.ql-toolbar]:text-white [&_.ql-container]:bg-secondary [&_.ql-container]:border-border [&_.ql-editor]:text-white [&_.ql-editor]:min-h-[300px] [&_.ql-editor]:font-inter">
              <ReactQuill
                value={form.body}
                onChange={v => setForm(f => ({ ...f, body: v }))}
                placeholder="Write your article here..."
                theme="snow"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Publish Box */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-oswald font-bold text-white text-base uppercase mb-4">Publish</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleSave(false)}
                disabled={saving || !form.title}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded text-foreground font-inter text-sm hover:border-primary transition-colors disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving || !form.title || !form.category}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-oswald font-semibold tracking-wider uppercase text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish
              </button>
            </div>
            <p className="text-muted-foreground font-inter text-xs mt-3 flex items-center gap-1">
              <Twitter className="w-3 h-3" />
              Auto-tweets on publish
            </p>
          </div>

          {/* Category */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-oswald font-bold text-white text-base uppercase mb-3">Category *</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(f => ({ ...f, category: cat.name }))}
                  className={`px-3 py-2 rounded text-xs font-oswald font-semibold uppercase tracking-wider transition-colors ${form.category === cat.name ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-white border border-border hover:border-primary"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-oswald font-bold text-white text-base uppercase mb-3">Featured Image</h3>
            {form.featured_image ? (
              <div className="relative">
                <img src={form.featured_image} alt="Featured" className="w-full aspect-video object-cover rounded-lg" />
                <button
                  onClick={() => setForm(f => ({ ...f, featured_image: "" }))}
                  className="absolute top-2 right-2 bg-black/70 rounded-full p-1 text-white hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowImagePicker(true)}
                className="w-full aspect-video bg-secondary border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors group"
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-inter text-xs text-muted-foreground">Select Image</span>
              </button>
            )}
            {form.featured_image && (
              <button
                onClick={() => setShowImagePicker(true)}
                className="mt-2 w-full text-xs text-primary font-inter hover:underline"
              >
                Change image
              </button>
            )}
          </div>
        </div>
      </div>

      {showImagePicker && (
        <ImagePickerModal
          onSelect={url => { setForm(f => ({ ...f, featured_image: url })); setShowImagePicker(false); }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}