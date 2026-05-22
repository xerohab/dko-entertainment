import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

// Loads ad settings from SiteSettings and renders appropriate ad
// Props: slot = "top" | "mid" | "bottom" | "sidebar"
export default function AdBanner({ slot = "mid", className = "" }) {
  const [adSettings, setAdSettings] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check membership
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        // Pro member = has active subscription
        const subs = await base44.entities.UserSubscription.filter({ user_email: me.email, status: "active" });
        setIsMember(subs.length > 0);
      }
    });

    // Load ad settings
    base44.entities.SiteSettings.filter({ key: `ad_${slot}` }).then(rows => {
      if (rows.length > 0) setAdSettings(rows[0]);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [slot]);

  // Pro members see no ads
  if (isMember || dismissed || !loaded) return null;

  // Google AdSense ad
  const googleClientId = adSettings?.value?.includes("ca-pub") ? adSettings.value : null;
  const customHtml = adSettings?.value && !adSettings.value.includes("ca-pub") ? adSettings.value : null;

  // If no ad configured for this slot, show nothing
  if (!googleClientId && !customHtml) return null;

  return (
    <div className={`relative bg-secondary/30 border border-border/50 rounded-lg overflow-hidden text-center ${className}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-white transition-colors z-10"
        title="Dismiss ad"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="px-4 py-0.5">
        <span className="text-muted-foreground font-inter text-[10px] uppercase tracking-wider">Advertisement</span>
      </div>
      {customHtml ? (
        <div
          className="px-4 pb-4"
          dangerouslySetInnerHTML={{ __html: customHtml }}
        />
      ) : googleClientId ? (
        <div className="px-4 pb-4">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={googleClientId}
            data-ad-slot="auto"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : null}
    </div>
  );
}