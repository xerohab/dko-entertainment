import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Edit2, Check, X, Loader2, ChevronRight, FolderOpen, Folder } from "lucide-react";

export default function CategoriesManager() {
  const { user } = useOutletContext();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(null); // null | "root" | parentId
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/admin"); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const cats = await base44.entities.Category.list("sort_order", 200);
    setCategories(cats);
    setLoading(false);
  };

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleAdd = async (parentId = null) => {
    if (!newName.trim()) return;
    setSaving(true);
    const parent = parentId ? categories.find(c => c.id === parentId) : null;
    const level = parent ? (parent.level || 0) + 1 : 0;
    await base44.entities.Category.create({
      name: newName.trim(),
      slug: generateSlug(newName.trim()),
      parent_id: parentId || null,
      level,
      sort_order: categories.filter(c => c.parent_id === parentId).length,
    });
    setNewName("");
    setAdding(null);
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
    const children = categories.filter(c => c.parent_id === cat.id);
    const msg = children.length > 0
      ? `Delete "${cat.name}" and its ${children.length} sub-categor${children.length === 1 ? "y" : "ies"}? This cannot be undone.`
      : `Delete category "${cat.name}"?`;
    if (!confirm(msg)) return;
    // Delete all children recursively
    const toDelete = [cat.id];
    const addChildren = (id) => {
      categories.filter(c => c.parent_id === id).forEach(c => {
        toDelete.push(c.id);
        addChildren(c.id);
      });
    };
    addChildren(cat.id);
    for (const id of toDelete) {
      await base44.entities.Category.delete(id);
    }
    setCategories(prev => prev.filter(c => !toDelete.includes(c.id)));
  };

  // Build tree
  const roots = categories.filter(c => !c.parent_id);

  const renderAddForm = (parentId) => (
    <div className="flex items-center gap-2 mt-1 pl-2">
      <input
        autoFocus
        value={newName}
        onChange={e => setNewName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(parentId); if (e.key === "Escape") { setAdding(null); setNewName(""); } }}
        placeholder="Category name..."
        className="flex-1 bg-background border border-primary rounded px-3 py-1.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none"
      />
      <button onClick={() => handleAdd(parentId)} disabled={saving} className="p-1.5 text-green-400 hover:text-green-300">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>
      <button onClick={() => { setAdding(null); setNewName(""); }} className="p-1.5 text-muted-foreground hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const renderCategory = (cat, depth = 0) => {
    const children = categories.filter(c => c.parent_id === cat.id);
    const indent = depth * 20;
    const canAddChild = depth < 2; // max 3 levels: root → sub → sub-sub

    return (
      <div key={cat.id}>
        <div
          className="flex items-center gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors border-b border-border/50 group"
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          {/* Indent indicator */}
          {depth > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {Array.from({ length: depth }).map((_, i) => (
                <div key={i} className="w-3 h-px bg-border" />
              ))}
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </div>
          )}

          <div className="shrink-0">
            {children.length > 0
              ? <FolderOpen className="w-4 h-4 text-primary" />
              : <Folder className="w-4 h-4 text-muted-foreground" />
            }
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
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setEditing(null)} className="p-1.5 text-muted-foreground hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-oswald font-bold text-white text-sm uppercase">{cat.name}</span>
                  {depth === 0 && <span className="text-xs font-inter text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Top Level</span>}
                  {depth === 1 && <span className="text-xs font-inter text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Sub</span>}
                  {depth === 2 && <span className="text-xs font-inter text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">Sub-Sub</span>}
                </div>
                <div className="text-muted-foreground font-inter text-xs">/category/{cat.slug}</div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canAddChild && (
                  <button
                    onClick={() => { setAdding(cat.id); setNewName(""); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary font-inter transition-colors rounded hover:bg-secondary"
                    title="Add sub-category"
                  >
                    <Plus className="w-3 h-3" /> Sub
                  </button>
                )}
                <button onClick={() => { setEditing(cat.id); setEditName(cat.name); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cat)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {adding === cat.id && (
          <div style={{ paddingLeft: `${16 + indent + 20}px` }} className="py-2 pr-4 bg-secondary/20 border-b border-border/50">
            {renderAddForm(cat.id)}
          </div>
        )}

        {children.map(child => renderCategory(child, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-oswald font-bold text-white text-3xl uppercase">Categories</h1>
          <p className="text-muted-foreground font-inter text-sm mt-0.5">Hierarchical category management (up to 3 levels)</p>
        </div>
        <button
          onClick={() => { setAdding("root"); setNewName(""); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Top-Level
        </button>
      </div>

      {/* Level Legend */}
      <div className="flex items-center gap-4 mb-4 px-2">
        <span className="text-xs font-inter text-muted-foreground flex items-center gap-1.5"><span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Top Level</span> e.g. Promotions</span>
        <span className="text-xs font-inter text-muted-foreground flex items-center gap-1.5"><span className="bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-400">Sub</span> e.g. WWE</span>
        <span className="text-xs font-inter text-muted-foreground flex items-center gap-1.5"><span className="bg-green-500/10 px-1.5 py-0.5 rounded text-green-400">Sub-Sub</span> e.g. RAW</span>
      </div>

      {adding === "root" && (
        <div className="bg-card border border-primary rounded-xl p-4 mb-4">
          <p className="text-xs text-muted-foreground font-inter mb-2 uppercase tracking-wider">New Top-Level Category</p>
          {renderAddForm(null)}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
      ) : categories.length === 0 ? (
        <div className="bg-card border border-border rounded-xl text-center py-16 text-muted-foreground font-inter text-sm">
          No categories yet. Add your first top-level category.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {roots.map(cat => renderCategory(cat, 0))}
        </div>
      )}
    </div>
  );
}