import { useRef, useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, Link, Image as ImageIcon, Youtube,
  Type, ChevronDown, Palette, Minus, Quote, Undo, Redo, Loader2
} from "lucide-react";
import ImagePickerModal from "@/components/media/ImagePickerModal";

// ─── Toolbar helpers ────────────────────────────────────────────────────────

const FONT_SIZES = ["12px","14px","16px","18px","20px","24px","28px","32px","36px","48px"];
const HEADINGS = [
  { label: "Paragraph", tag: "p" },
  { label: "Heading 1", tag: "h1" },
  { label: "Heading 2", tag: "h2" },
  { label: "Heading 3", tag: "h3" },
  { label: "Heading 4", tag: "h4" },
];
const TEXT_COLORS = [
  "#FFFFFF","#E8E8E8","#9CA3AF","#6B7280",
  "#CC0000","#EF4444","#F97316","#D4A017",
  "#22C55E","#0EA5E9","#1A6FCC","#7B2FCC",
  "#EC4899","#0D8C8C","#000000","#1F2937",
];
const BG_COLORS = [
  "transparent","#1F2937","#7F1D1D","#78350F",
  "#14532D","#1E3A5F","#3B0764","#831843",
  "#FBBF24","#FCA5A5","#6EE7B7","#93C5FD",
  "#D8B4FE","#F0FFF4","#FFF7ED","#FEF2F2",
];

function ToolbarBtn({ onClick, active, title, disabled, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick && onClick(); }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? "bg-primary text-white" : "text-muted-foreground hover:text-white hover:bg-secondary/80"} disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

function Dropdown({ label, children, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-white hover:bg-secondary/80 transition-colors"
      >
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-black border border-border rounded-lg shadow-2xl py-1 min-w-max">
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

export default function RichEditor({ value, onChange, placeholder = "Write your article here..." }) {
  const editorRef = useRef(null);
  const isInitialized = useRef(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const savedRange = useRef(null);

  // Initialize editor content once
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || "";
      isInitialized.current = true;
    }
  }, []);

  // Sync incoming value changes (e.g. loading existing article)
  useEffect(() => {
    if (editorRef.current && value !== undefined && editorRef.current.innerHTML !== value) {
      // Only update if content is empty (initial load)
      if (!isInitialized.current || editorRef.current.innerHTML === "") {
        editorRef.current.innerHTML = value || "";
        isInitialized.current = true;
      }
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    } else {
      editorRef.current?.focus();
    }
  };

  const exec = useCallback((cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    notifyChange();
  }, []);

  const notifyChange = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertHTML = (html) => {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    notifyChange();
  };

  // ── Image insertion ──
  const handleImageFromLibrary = (url) => {
    setShowImagePicker(false);
    restoreSelection();
    insertHTML(`<img src="${url}" alt="Article image" style="max-width:100%;height:auto;border-radius:6px;margin:8px 0;" />`);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    saveSelection();
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    insertHTML(`<img src="${file_url}" alt="Article image" style="max-width:100%;height:auto;border-radius:6px;margin:8px 0;" />`);
    setUploading(false);
  };

  // ── YouTube ──
  const handleYouTube = () => {
    saveSelection();
    const url = prompt("Paste YouTube URL:");
    if (!url) return;
    const vid = extractYouTubeId(url);
    if (!vid) { alert("Couldn't find a YouTube video ID in that URL."); return; }
    insertHTML(
      `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:12px 0;border-radius:8px;">` +
      `<iframe src="https://www.youtube.com/embed/${vid}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen loading="lazy"></iframe>` +
      `</div>`
    );
  };

  // ── Link ──
  const handleLink = () => {
    saveSelection();
    const url = prompt("Enter URL:");
    if (!url) return;
    exec("createLink", url.startsWith("http") ? url : `https://${url}`);
    // Make link open in new tab
    setTimeout(() => {
      editorRef.current?.querySelectorAll("a").forEach(a => {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      });
    }, 50);
  };

  // ── Heading ──
  const applyHeading = (tag, close) => {
    if (tag === "p") exec("formatBlock", "<p>");
    else exec("formatBlock", `<${tag}>`);
    close();
  };

  // ── Font size ──
  const applyFontSize = (size, close) => {
    exec("fontSize", "7"); // placeholder
    // Replace the font size 7 with actual CSS
    setTimeout(() => {
      editorRef.current?.querySelectorAll("font[size='7']").forEach(el => {
        el.removeAttribute("size");
        el.style.fontSize = size;
      });
    }, 10);
    close();
  };

  const uploadInputRef = useRef(null);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-secondary/50">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 bg-secondary border-b border-border">

        {/* Undo/Redo */}
        <ToolbarBtn onClick={() => exec("undo")} title="Undo"><Undo className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("redo")} title="Redo"><Redo className="w-4 h-4" /></ToolbarBtn>
        <Separator />

        {/* Heading dropdown */}
        <Dropdown label={<span className="flex items-center gap-1"><Type className="w-3.5 h-3.5" /> Style</span>}>
          {close => HEADINGS.map(h => (
            <button
              key={h.tag}
              type="button"
              onMouseDown={e => { e.preventDefault(); applyHeading(h.tag, close); }}
              className="block w-full text-left px-4 py-1.5 text-sm text-foreground hover:bg-secondary/60 font-inter"
            >
              {h.label}
            </button>
          ))}
        </Dropdown>

        {/* Font size */}
        <Dropdown label="Size">
          {close => FONT_SIZES.map(sz => (
            <button
              key={sz}
              type="button"
              onMouseDown={e => { e.preventDefault(); applyFontSize(sz, close); }}
              className="block w-full text-left px-4 py-1.5 text-foreground hover:bg-secondary/60 font-inter"
              style={{ fontSize: "13px" }}
            >
              {sz}
            </button>
          ))}
        </Dropdown>

        <Separator />

        {/* Basic formatting */}
        <ToolbarBtn onClick={() => exec("bold")} title="Bold"><Bold className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("italic")} title="Italic"><Italic className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("underline")} title="Underline"><Underline className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolbarBtn>

        <Separator />

        {/* Text colour */}
        <Dropdown label={<span className="flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> Color</span>}>
          {close => (
            <div className="p-2 w-48">
              <p className="text-xs text-muted-foreground mb-1.5 font-inter">Text Color</p>
              <div className="grid grid-cols-8 gap-1 mb-3">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); exec("foreColor", c); close(); }}
                    className="w-5 h-5 rounded border border-border/50 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-1.5 font-inter">Highlight</p>
              <div className="grid grid-cols-8 gap-1">
                {BG_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); exec("hiliteColor", c); close(); }}
                    className="w-5 h-5 rounded border border-border/50 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c === "transparent" ? "#333" : c }}
                    title={c === "transparent" ? "Remove highlight" : c}
                  />
                ))}
              </div>
            </div>
          )}
        </Dropdown>

        <Separator />

        {/* Alignment */}
        <ToolbarBtn onClick={() => exec("justifyLeft")} title="Align Left"><AlignLeft className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("justifyCenter")} title="Align Center"><AlignCenter className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("justifyRight")} title="Align Right"><AlignRight className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("justifyFull")} title="Justify"><AlignJustify className="w-4 h-4" /></ToolbarBtn>

        <Separator />

        {/* Lists */}
        <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered List"><ListOrdered className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("formatBlock", "<blockquote>")} title="Blockquote"><Quote className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertHorizontalRule")} title="Horizontal Rule"><Minus className="w-4 h-4" /></ToolbarBtn>

        <Separator />

        {/* Link */}
        <ToolbarBtn onClick={handleLink} title="Insert Link"><Link className="w-4 h-4" /></ToolbarBtn>

        {/* Image (library) */}
        <ToolbarBtn
          onClick={() => { saveSelection(); setShowImagePicker(true); }}
          title="Insert Image from Library"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarBtn>

        {/* Image (upload) */}
        <ToolbarBtn
          onClick={() => { saveSelection(); uploadInputRef.current?.click(); }}
          disabled={uploading}
          title="Upload Image"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <span className="text-xs font-oswald font-bold">IMG+</span>
          )}
        </ToolbarBtn>
        <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        {/* YouTube */}
        <ToolbarBtn onClick={handleYouTube} title="Embed YouTube Video">
          <Youtube className="w-4 h-4" />
        </ToolbarBtn>
      </div>

      {/* ── Editable Area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={notifyChange}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        data-placeholder={placeholder}
        className="min-h-[360px] px-5 py-4 text-white font-inter text-base focus:outline-none
          [&_h1]:font-oswald [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:uppercase [&_h1]:my-3
          [&_h2]:font-oswald [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:uppercase [&_h2]:my-2.5
          [&_h3]:font-oswald [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:my-2
          [&_h4]:font-oswald [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-white [&_h4]:my-2
          [&_p]:my-1.5 [&_p]:leading-relaxed
          [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
          [&_li]:my-0.5
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-3
          [&_hr]:border-border [&_hr]:my-4
          [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-2
          [&_iframe]:rounded-lg
          empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
        style={{ direction: "ltr" }}
      />

      {/* Image picker modal */}
      {showImagePicker && (
        <ImagePickerModal
          onSelect={handleImageFromLibrary}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}