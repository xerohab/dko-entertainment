import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Loader2 } from "lucide-react";

export default function ImageUploader({ onUpload, compact = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setUploading(true);
    setError(null);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    onUpload(file_url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (compact) {
    return (
      <div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded text-sm font-inter text-foreground hover:border-primary transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current.click()}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors group"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground font-inter text-sm">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="text-foreground font-inter text-sm font-medium">Drop image here or click to upload</p>
            <p className="text-muted-foreground font-inter text-xs">PNG, JPG, WebP supported</p>
          </div>
        )}
      </div>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}