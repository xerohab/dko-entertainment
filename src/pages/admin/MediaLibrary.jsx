import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ImageUploader from "@/components/media/ImageUploader";
import { Trash2, Copy, Check, Loader2, Grid, List, AlertTriangle, Upload } from "lucide-react";
import { format } from "date-fns";

export default function MediaLibrary() {
  const { user } = useOutletContext();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [copied, setCopied] = useState(null);
  const [view, setView] = useState("grid");
  const [matching, setMatching] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const jsonInputRef = useRef();

  const load = async () => {
    setLoading(true);
    const imgs = await base44.entities.MediaImage.list("-created_date", 1000);
    setImages(imgs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (url) => {
    await base44.entities.MediaImage.create({
      url,
      title: `Image ${new Date().toLocaleDateString()}`,
      uploaded_by: user.email,
    });
    load();
  };

  const handleDelete = async (img) => {
    if (!confirm("Delete this image?")) return;
    setDeleting(img.id);
    await base44.entities.MediaImage.delete(img.id);
    setImages(prev => prev.filter(i => i.id !== img.id));
    setDeleting(null);
  };

  const handleDeleteAll = async () => {
    if (!confirm(`DELETE ALL ${images.length} images? This CANNOT be undone!`)) return;
    if (!confirm("Are you absolutely sure? All media will be permanently deleted.")) return;
    setDeletingAll(true);
    for (const img of images) {
      await base44.entities.MediaImage.delete(img.id);
    }
    setImages([]);
    setDeletingAll(false);
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === images.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(images.map(img => img.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`DELETE ${selected.size} selected images? This CANNOT be undone!`)) return;
    setDeletingAll(true);
    for (const imgId of selected) {
      await base44.entities.MediaImage.delete(imgId);
    }
    setImages(images.filter(img => !selected.has(img.id)));
    setSelected(new Set());
    setDeletingAll(false);
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleMatchImages = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMatching(true);
    const text = await file.text();
    const data = JSON.parse(text);
    const result = await base44.functions.invoke("matchImageToArticles", { jsonData: data });
    alert(`Matched ${result.matched} images to ${result.articles} articles`);
    setMatching(false);
    jsonInputRef.current.value = "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-oswald font-bold text-white text-3xl uppercase">Media Library</h1>
          <p className="text-muted-foreground font-inter text-sm mt-0.5">{images.length} images</p>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deletingAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/40 border border-red-700/50 text-red-400 font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-900/70 transition-colors disabled:opacity-40"
            >
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Delete {selected.size}
            </button>
          )}
          {user.role === "admin" && images.length > 0 && selected.size === 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/40 border border-red-700/50 text-red-400 font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-900/70 transition-colors disabled:opacity-40"
            >
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Delete All
            </button>
          )}
          <button onClick={() => setView("grid")} className={`p-2 rounded border transition-colors ${view === "grid" ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-white"}`}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setView("list")} className={`p-2 rounded border transition-colors ${view === "list" ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-white"}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Upload */}
      <div className="mb-8 space-y-4">
        <div>
          <h2 className="font-oswald font-semibold text-white text-lg uppercase mb-2">Upload Images</h2>
          <ImageUploader onUpload={handleUpload} />
        </div>

        {/* JSON Match Section */}
        {user.role === "admin" && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-oswald font-semibold text-white text-lg uppercase mb-3">Match Images to Articles</h2>
            <p className="text-muted-foreground font-inter text-sm mb-4">Upload your WordPress JSON export to automatically match images to articles by filename.</p>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleMatchImages}
              disabled={matching}
              className="hidden"
            />
            <button
              onClick={() => jsonInputRef.current?.click()}
              disabled={matching}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded text-sm font-inter text-foreground hover:border-primary transition-colors disabled:opacity-50"
            >
              {matching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {matching ? "Processing..." : "Upload JSON Export"}
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground font-inter text-sm">No images uploaded yet.</div>
      ) : view === "grid" ? (
        <div>
          {selected.size > 0 && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/50 rounded text-sm text-primary font-inter flex justify-between items-center">
              <span>{selected.size} selected</span>
              <button onClick={() => setSelected(new Set())} className="text-xs hover:underline">Clear</button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map(img => (
              <div key={img.id} className={`group relative bg-card border rounded-lg overflow-hidden cursor-pointer transition-all ${selected.has(img.id) ? "border-primary bg-primary/10" : "border-border hover:border-primary"}`}>
                <div className="aspect-square overflow-hidden relative">
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <input
                    type="checkbox"
                    checked={selected.has(img.id)}
                    onChange={() => toggleSelect(img.id)}
                    className="absolute top-2 left-2 w-4 h-4 cursor-pointer"
                  />
                </div>
                <div className="p-2">
                  <p className="text-white font-inter text-xs truncate">{img.title}</p>
                  <p className="text-muted-foreground font-inter text-xs">{img.created_date ? format(new Date(img.created_date), "MMM d") : ""}</p>
                </div>
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleCopy(img.url)} className="bg-black/70 rounded p-1 text-white hover:text-primary transition-colors">
                    {copied === img.url ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(img)} disabled={deleting === img.id} className="bg-black/70 rounded p-1 text-white hover:text-red-400 transition-colors">
                    {deleting === img.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {selected.size > 0 && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/50 rounded text-sm text-primary font-inter flex justify-between items-center">
              <span>{selected.size} selected</span>
              <button onClick={() => setSelected(new Set())} className="text-xs hover:underline">Clear</button>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3"><input type="checkbox" checked={selected.size === images.length && images.length > 0} onChange={toggleSelectAll} className="w-4 h-4 cursor-pointer" /></th>
                  <th className="text-left px-4 py-3 font-inter text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image</th>
                  <th className="text-left px-4 py-3 font-inter text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 font-inter text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Uploaded</th>
                  <th className="text-right px-4 py-3 font-inter text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {images.map(img => (
                  <tr key={img.id} className={`transition-colors ${selected.has(img.id) ? "bg-primary/10" : "hover:bg-secondary/30"}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(img.id)} onChange={() => toggleSelect(img.id)} className="w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <img src={img.url} alt={img.title} className="w-16 h-12 object-cover rounded" />
                    </td>
                    <td className="px-4 py-3 text-white font-inter text-sm">{img.title}</td>
                    <td className="px-4 py-3 text-muted-foreground font-inter text-xs hidden sm:table-cell">
                      {img.created_date ? format(new Date(img.created_date), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleCopy(img.url)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                          {copied === img.url ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(img)} disabled={deleting === img.id} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                          {deleting === img.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}