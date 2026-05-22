import { useState, useEffect } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Camera, Save, Loader2, ArrowLeft, Twitter, User, Shield } from "lucide-react";
import ImagePickerModal from "@/components/media/ImagePickerModal";

export default function UserProfile() {
  const { user: currentUser } = useOutletContext();
  const { id } = useParams(); // if id present, admin editing another user
  const navigate = useNavigate();

  const isEditingOther = !!id && id !== currentUser?.id;
  const targetUserId = id || currentUser?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const [form, setForm] = useState({
    display_name: "",
    motto: "",
    bio: "",
    twitter_handle: "",
    avatar: "",
    role: "editor",
  });

  useEffect(() => {
    if (isEditingOther && currentUser?.role !== "admin") {
      navigate("/admin");
      return;
    }
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    const users = await base44.entities.User.list("-created_date", 200);
    const target = users.find(u => u.id === targetUserId);
    if (target) {
      setProfile(target);
      setForm({
        display_name: target.display_name || target.full_name || "",
        motto: target.motto || "",
        bio: target.bio || "",
        twitter_handle: target.twitter_handle || "",
        avatar: target.avatar || "",
        role: target.role || "editor",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      display_name: form.display_name,
      motto: form.motto,
      bio: form.bio,
      twitter_handle: form.twitter_handle,
      avatar: form.avatar,
    };
    if (currentUser?.role === "admin") {
      updates.role = form.role;
    }

    if (isEditingOther) {
      await base44.entities.User.update(targetUserId, updates);
    } else {
      await base44.auth.updateMe(updates);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-white transition-colors rounded hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-oswald font-bold text-white text-3xl uppercase">
            {isEditingOther ? `Edit: ${profile?.full_name || profile?.email}` : "My Profile"}
          </h1>
          <p className="text-muted-foreground font-inter text-sm mt-0.5">
            {isEditingOther ? "Admin editing user profile" : "Update your public profile"}
          </p>
        </div>
      </div>

      {/* Avatar */}
      <div className="bg-card border border-border rounded-xl p-6 mb-5">
        <h3 className="font-oswald font-bold text-white text-base uppercase mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" /> Profile Picture
        </h3>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
            {form.avatar ? (
              <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowImagePicker(true)}
              className="px-4 py-2 bg-secondary border border-border text-white font-inter text-sm rounded hover:border-primary transition-colors"
            >
              Choose from Media Library
            </button>
            {form.avatar && (
              <button
                onClick={() => setForm(f => ({ ...f, avatar: "" }))}
                className="text-red-400 font-inter text-xs hover:underline text-left"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-card border border-border rounded-xl p-6 mb-5 space-y-4">
        <h3 className="font-oswald font-bold text-white text-base uppercase flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Basic Info
        </h3>

        <div>
          <label className="block text-xs font-inter font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Display Name</label>
          <input
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            placeholder={profile?.full_name || "Your name"}
            className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-inter font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Motto / Tagline</label>
          <input
            value={form.motto}
            onChange={e => setForm(f => ({ ...f, motto: e.target.value }))}
            placeholder="e.g. Wrestling is life"
            className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-inter font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Tell readers about yourself..."
            rows={3}
            className="w-full bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-inter font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Twitter className="w-3.5 h-3.5" /> Twitter / X Handle
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-inter text-sm">@</span>
            <input
              value={form.twitter_handle}
              onChange={e => setForm(f => ({ ...f, twitter_handle: e.target.value.replace("@", "") }))}
              placeholder="yourhandle"
              className="w-full bg-secondary border border-border rounded pl-7 pr-4 py-2.5 text-white font-inter text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Role (admin only) */}
      {currentUser?.role === "admin" && (
        <div className="bg-card border border-border rounded-xl p-6 mb-5">
          <h3 className="font-oswald font-bold text-white text-base uppercase mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Role & Permissions
          </h3>
          <select
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="bg-secondary border border-border rounded px-3 py-2.5 text-white font-inter text-sm focus:outline-none focus:border-primary w-full"
          >
            <option value="admin">Admin — Full access</option>
            <option value="editor">Editor — Create & edit articles</option>
            <option value="user">User — Read only</option>
          </select>
          {!isEditingOther && (
            <p className="text-yellow-400/80 font-inter text-xs mt-2">⚠ Changing your own role to non-admin will lock you out of admin features.</p>
          )}
        </div>
      )}

      {/* Account Info (read-only) */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-oswald font-bold text-white text-base uppercase mb-3">Account Info</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground font-inter text-sm">Email</span>
            <span className="text-white font-inter text-sm">{profile?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-inter text-sm">Full Name</span>
            <span className="text-white font-inter text-sm">{profile?.full_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-inter text-sm">Member Since</span>
            <span className="text-white font-inter text-sm">{profile?.created_date ? new Date(profile.created_date).toLocaleDateString() : "—"}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-40"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Changes"}
      </button>

      {showImagePicker && (
        <ImagePickerModal
          onSelect={(url) => { setForm(f => ({ ...f, avatar: url })); setShowImagePicker(false); }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}