import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Loader2, Menu, ArrowLeft } from "lucide-react";

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin("/admin");
        return;
      }
      const me = await base44.auth.me();
      if (me.role !== "admin" && me.role !== "editor") {
        navigate("/");
        return;
      }
      setUser(me);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar user={user} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60">
            <AdminSidebar user={user} />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center gap-2 px-4 py-3 bg-sidebar border-b border-sidebar-border">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground p-1.5 hover:bg-secondary rounded">
            <Menu className="w-5 h-5" />
          </button>
          {location.pathname !== "/admin" && (
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-white p-1.5 hover:bg-secondary rounded transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="font-oswald font-bold text-white text-base flex-1">DKO Admin</span>
        </div>

        {/* Desktop back button bar */}
        {location.pathname !== "/admin" && (
          <div className="hidden md:flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-white font-inter text-sm transition-colors hover:bg-secondary px-2 py-1 rounded"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  );
}