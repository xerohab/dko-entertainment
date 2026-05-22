import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Edit2, Check, X, Loader2, Tag } from "lucide-react";

export default function CategoriesManager() {
  const { user } = useOutletContext();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/admin"); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const cats = await base44.entities.Category.list("sort_order", 50);
    setCategories(cats);
    setLoading(false);
  };

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await base44.entities.Category.create({
      name: newName.trim(),
      slug: generateSlug(newName.trim()),
      sort_order: categories.length,
    });
    setNewName("");
    setAdding(false);
    setSaving(false);
    load();
  };

  const handleEdit = async (cat) => {
    if (!editName.trim()) return;
    setSaving(true);
    await base44.entities.Category.update(cat.id, {
      name: editName.trim(),
      slug: generateSlug(editName.trim()),
    });
    setEditing(null);
    setSaving(false);
    load();
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    await base44.entities.Category.delete(cat.id);
    setCategories(prev => prev.filter(c => c.id !== cat.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-oswald font-bold text-white text-3xl uppercase">Categories</h1>
          <p className="text-muted-foreground font-inter text-sm mt-0.5">Manage news categories</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Add Form */}
      {adding && (
        <div className="bg-card border border-primary rounded-xl p-5 mb-5 flex items-center gap-3">
          <Tag className="w-5 h-5 text-primary shrink-0" />
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
            placeholder="Category name (e.g. WWE)"
            className="flex-1 bg-secondary border border-border rounded px-3 py-2 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button onClick={handleAdd} disabled={saving} className="p-2 text-green-400 hover:text-green-300 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button onClick={() => setAdding(false)} className="p-2 text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
      ) : categories.length === 0 ? (
        <div className="bg-card border border-border rounded-xl text-center py-16 text-muted-foreground font-inter text-sm">
          No categories yet. Add your first one.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {categories.map((cat, i) => (
            <div key={cat.id} className={`flex items-center gap-4 px-5 py-4 ${i < categories.length - 1 ? "border-b border-border" : ""} hover:bg-secondary/30 transition-colors`}>
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                <Tag className="w-4 h-4 text-primary" />
              </div>
              {editing === cat.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleEdit(cat); if (e.key === "Escape") setEditing(null); }}
                    className="flex-1 bg-secondary border border-primary rounded px-3 py-1.5 text-white font-inter text-sm focus:outline-none"
                  />
                  <button onClick={() => handleEdit(cat)} disabled={saving} className="p-1.5 text-green-400 hover:text-green-300">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 text-muted-foreground hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-oswald font-bold text-white text-base uppercase">{cat.name}</div>
                    <div className="text-muted-foreground font-inter text-xs">/category/{cat.slug}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditing(cat.id); setEditName(cat.name); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}