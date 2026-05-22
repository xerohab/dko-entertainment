import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

// Props: slot = "top" | "mid" | "bottom" | "sidebar"
export default function AdBanner({ slot = "mid", className = "" }) {
  const [ad, setAd] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        const subs = await base44.entities.UserSubscription.filter({ user_email: me.email, status: "active" });
        setIsMember(subs.length > 0);
      }
    });

    base44.entities.Ad.filter({ slot, is_active: true }).then(ads => {
      if (ads.length > 0) setAd(ads[0]);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [slot]);

  if (isMember || dismissed || !loaded || !ad) return null;

  return (
    <div className={`relative bg-secondary/30 border border-border/50 rounded-lg overflow-hidden text-center ${className}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-white transition-colors z-10"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="px-4 py-0.5">
        <span className="text-muted-foreground font-inter text-[10px] uppercase tracking-wider">Advertisement</span>
      </div>

      <div className="px-4 pb-4">
        {ad.type === "image" && ad.image_url && (
          ad.link_url ? (
            <a href={ad.link_url} target="_blank" rel="noopener noreferrer">
              <img src={ad.image_url} alt={ad.headline || "Ad"} className="max-w-full rounded" />
            </a>
          ) : (
            <img src={ad.image_url} alt={ad.headline || "Ad"} className="max-w-full rounded" />
          )
        )}

        {ad.type === "text" && (
          <div className="py-2">
            {ad.headline && <p className="font-oswald font-bold text-white text-lg">{ad.headline}</p>}
            {ad.body_text && <p className="font-inter text-muted-foreground text-sm mt-1">{ad.body_text}</p>}
            {ad.link_url && (
              <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-4 py-1.5 bg-primary text-white font-oswald text-xs uppercase tracking-wider rounded hover:bg-red-700 transition-colors">
                Learn More
              </a>
            )}
          </div>
        )}

        {ad.type === "html" && ad.custom_html && (
          <div dangerouslySetInnerHTML={{ __html: ad.custom_html }} />
        )}

        {ad.type === "adsense" && ad.adsense_publisher_id && (
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={ad.adsense_publisher_id}
            data-ad-slot="auto"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
      </div>
    </div>
  );
}