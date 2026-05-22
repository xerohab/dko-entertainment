import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Save, Twitter, Eye, EyeOff, Loader2, Settings, CheckCircle } from "lucide-react";

const TWITTER_FIELDS = [
  { key: "twitter_api_key", label: "API Key (Consumer Key)", placeholder: "Enter Twitter API Key" },
  { key: "twitter_api_secret", label: "API Secret (Consumer Secret)", placeholder: "Enter Twitter API Secret" },
  { key: "twitter_access_token", label: "Access Token", placeholder: "Enter Access Token" },
  { key: "twitter_access_secret", label: "Access Token Secret", placeholder: "Enter Access Token Secret" },
];

export default function SiteSettings() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/admin"); return; }
    base44.entities.SiteSettings.list().then(rows => {
      const map = {};
      rows.forEach(r => { map[r.key] = r.value; });
      setSettings(map);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const existing = await base44.entities.SiteSettings.list();
    const existingMap = {};
    existing.forEach(r => { existingMap[r.key] = r.id; });

    for (const [key, value] of Object.entries(settings)) {
      if (existingMap[key]) {
        await base44.entities.SiteSettings.update(existingMap[key], { value });
      } else {
        await base44.entities.SiteSettings.create({ key, value: value || "" });
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-oswald font-bold text-white text-3xl uppercase flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          Site Settings
        </h1>
        <p className="text-muted-foreground font-inter text-sm mt-1">Configure Twitter/X integration and site options</p>
      </div>

      {/* Twitter Config */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1DA1F2]/10 flex items-center justify-center">
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
          </div>
          <div>
            <h3 className="font-oswald font-bold text-white text-base uppercase">Twitter / X Integration</h3>
            <p className="text-muted-foreground font-inter text-xs">Auto-tweets are sent when an article is published</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TWITTER_FIELDS.map(field => (
            <div key={field.key}>
              <label className="block font-inter text-sm font-medium text-foreground mb-1.5">{field.label}</label>
              <div className="relative">
                <input
                  type={showSecrets[field.key] ? "text" : "password"}
                  value={settings[field.key] || ""}
                  onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-secondary border border-border rounded px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-secondary rounded-lg">
          <p className="text-muted-foreground font-inter text-xs">
            <strong className="text-foreground">Note:</strong> These credentials are stored in the database and used by the backend function to auto-tweet when articles are published. Keep them secure and never share.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-green-400 font-inter text-sm">
            <CheckCircle className="w-4 h-4" />
            Settings saved!
          </div>
        )}
      </div>
    </div>
  );
}