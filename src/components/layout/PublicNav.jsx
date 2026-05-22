import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Menu, X, Search } from "lucide-react";

export default function PublicNav() {
  const [categories, setCategories] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.entities.Category.list("sort_order", 10).then(setCategories).catch(() => {});
  }, []);

  return (
    <header className="bg-black border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-oswald font-bold text-sm">DKO</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-oswald font-bold text-white text-lg tracking-wide">DKO Wrestling</span>
              <span className="font-oswald font-light text-muted-foreground text-sm block leading-none">&amp; Entertainment</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className={`px-3 py-2 font-oswald font-medium text-sm tracking-wider uppercase transition-colors hover:text-primary ${location.pathname === '/' ? 'text-primary' : 'text-foreground'}`}>
              HOME
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className={`px-3 py-2 font-oswald font-medium text-sm tracking-wider uppercase transition-colors hover:text-primary ${location.pathname === `/category/${cat.slug}` ? 'text-primary' : 'text-foreground'}`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link to="/admin" className="hidden md:inline-flex px-3 py-1.5 bg-primary text-white font-oswald text-xs font-medium tracking-wider uppercase rounded hover:bg-red-700 transition-colors">
              ADMIN
            </Link>
            <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-3">
            <input
              autoFocus
              type="text"
              placeholder="Search articles..."
              className="w-full bg-secondary border border-border rounded px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  window.location.href = `/search?q=${encodeURIComponent(e.target.value)}`;
                }
              }}
            />
          </div>
        )}

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-border py-3 flex flex-col gap-1">
            <Link to="/" className="px-4 py-2 font-oswald font-medium text-sm tracking-wider uppercase text-foreground hover:text-primary" onClick={() => setMobileOpen(false)}>HOME</Link>
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.slug}`} className="px-4 py-2 font-oswald font-medium text-sm tracking-wider uppercase text-foreground hover:text-primary" onClick={() => setMobileOpen(false)}>
                {cat.name}
              </Link>
            ))}
            <Link to="/admin" className="px-4 py-2 font-oswald font-medium text-sm tracking-wider uppercase text-primary" onClick={() => setMobileOpen(false)}>ADMIN PANEL</Link>
          </nav>
        )}
      </div>
    </header>
  );
}