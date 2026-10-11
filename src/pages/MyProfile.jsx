import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicNav from "@/components/layout/PublicNav";
import PerkSphereConnection from "@/components/perksphere/PerkSphereConnection";
import { Camera, Save, Loader2, ArrowLeft, Twitter, User, Upload, CheckCircle, Info } from "lucide-react";

export default function MyProfile() {
  const navigate = useNavigate();
  const uploadRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    display_name: "",
    motto: "",
    bio: "",
    twitter_handle: "",
    avatar: "",
  });

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      setForm({
        display_name: user.display_name || user.full_name || "",
        motto: user.motto || "",
        bio: user.bio || "",
        twitter_handle: user.twitter_handle || "",
        avatar: user.avatar || "",
      });
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, avatar: file_url }));
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      display_name: form.display_name,
      motto: form.motto,
      bio: form.bio,
      twitter_handle: form.twitter_handle,
      avatar: form.avatar,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-white rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-oswald font-bold text-white text-2xl md:text-3xl uppercase">My Profile</h1>
            <p className="text-muted-foreground font-inter text-sm mt-0.5">Update your public profile</p>
          </div>
        </div>

        {/* Avatar */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h3 className="font-oswald font-bold text-white text-base uppercase mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" /> Profile Picture
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => uploadRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-oswald font-semibold text-xs uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
              <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              {form.avatar && (
                <button onClick={() => set("avatar", "")} className="text-red-400 font-inter text-xs hover:underline text-left">Remove photo</button>
              )}
              <p className="text-muted-foreground font-inter text-xs">JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 space-y-4">
          <h3 className="font-oswald font-bold text-white text-base uppercase flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Basic Info
          </h3>
          <div>
            <label className="block text-xs font-inter font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Display Name</label>
            <input value={form.display_name} onChange={e => set("display_name", e.target.value)} placeholder={currentUser?.full_name || "Your name"} className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-inter font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Motto / Tagline</label>
            <input value={form.motto} onChange={e => set("motto", e.target.value)} placeholder="e.g. Wrestling is life" className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-inter font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Tell readers about yourself..." rows={3} className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="block text-xs font-inter font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Twitter className="w-3.5 h-3.5" /> Twitter / X Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-inter text-sm">@</span>
              <input value={form.twitter_handle} onChange={e => set("twitter_handle", e.target.value.replace("@", ""))} placeholder="yourhandle" className="w-full bg-secondary border border-border rounded pl-7 pr-4 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h3 className="font-oswald font-bold text-white text-base uppercase mb-3">Account Info</h3>
          <div className="space-y-2.5 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-inter text-sm">Email</span>
              <span className="text-white font-inter text-sm">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-inter text-sm">Full Name</span>
              <span className="text-white font-inter text-sm">{currentUser?.full_name || "—"}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground font-inter text-xs">
              Email and password changes are managed through your login provider. Contact an admin if you need your account email updated.
            </p>
          </div>
        </div>

        <PerkSphereConnection />
        <div className="flex items-center gap-3 pb-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          {saved && <CheckCircle className="w-5 h-5 text-green-400" />}
        </div>
      </div>
    </div>
  );
}
