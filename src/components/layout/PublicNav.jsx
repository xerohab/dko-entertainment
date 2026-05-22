import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Menu, X, Search, ChevronDown } from "lucide-react";

function NavDropdown({ cat, subs, location }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = location.pathname.startsWith(`/category/${cat.slug}`);

  if (!subs || subs.length === 0) {
    return (
      <Link
        to={`/category/${cat.slug}`}
        className={`px-3 py-2 font-oswald font-medium text-sm tracking-wider uppercase transition-colors hover:text-primary ${isActive ? "text-primary" : "text-foreground"}`}
      >
        {cat.name}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-2 font-oswald font-medium text-sm tracking-wider uppercase transition-colors hover:text-primary ${isActive ? "text-primary" : "text-foreground"}`}
      >
        {cat.name}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-black border border-border rounded-lg shadow-2xl shadow-black/50 min-w-48 z-50 py-1">
          <Link
            to={`/category/${cat.slug}`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 font-oswald text-sm uppercase text-muted-foreground hover:text-white hover:bg-secondary/50 transition-colors"
          >
            All {cat.name}
          </Link>
          <div className="border-t border-border/50 my-1" />
          {subs.map(sub => (
            <SubDropdownItem key={sub.id} sub={sub} grandchildren={sub._grandchildren || []} location={location} onClose={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubDropdownItem({ sub, allCats, location, onClose, grandchildren = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isActive = location.pathname.startsWith(`/category/${sub.slug}`);

  if (grandchildren.length === 0) {
    return (
      <Link
        to={`/category/${sub.slug}`}
        onClick={onClose}
        className={`block px-4 py-2 font-oswald text-sm uppercase hover:text-white hover:bg-secondary/50 transition-colors ${isActive ? "text-primary" : "text-foreground"}`}
      >
        {sub.name}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative group">
      <div className="flex items-center justify-between px-4 py-2 hover:bg-secondary/50 cursor-pointer" onClick={() => setOpen(!open)}>
        <span className={`font-oswald text-sm uppercase ${isActive ? "text-primary" : "text-foreground"}`}>{sub.name}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="bg-secondary/30 border-t border-border/30">
          <Link
            to={`/category/${sub.slug}`}
            onClick={onClose}
            className="block pl-8 pr-4 py-2 font-oswald text-xs uppercase text-muted-foreground hover:text-white hover:bg-secondary/50 transition-colors"
          >
            All {sub.name}
          </Link>
          {grandchildren.map(gc => (
            <Link
              key={gc.id}
              to={`/category/${gc.slug}`}
              onClick={onClose}
              className={`block pl-8 pr-4 py-2 font-oswald text-xs uppercase hover:text-white hover:bg-secondary/50 transition-colors ${location.pathname === `/category/${gc.slug}` ? "text-primary" : "text-muted-foreground"}`}
            >
              {gc.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PublicNav() {
  const [allCats, setAllCats] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Category.list("sort_order", 200).then(setAllCats).catch(() => {});
  }, []);

  const topLevel = allCats.filter(c => !c.parent_id);
  const getSubs = (parentId) => allCats.filter(c => c.parent_id === parentId);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal("");
    }
  };

  const renderMobileTree = (cats, depth = 0) =>
    cats.map(cat => {
      const children = getSubs(cat.id);
      return (
        <div key={cat.id}>
          <Link
            to={`/category/${cat.slug}`}
            className="flex items-center py-2 font-oswald font-medium text-sm tracking-wider uppercase text-foreground hover:text-primary transition-colors"
            style={{ paddingLeft: `${16 + depth * 16}px` }}
            onClick={() => setMobileOpen(false)}
          >
            {depth > 0 && <ChevronDown className="w-3 h-3 mr-1 rotate-[-90deg] text-muted-foreground" />}
            {cat.name}
          </Link>
          {children.length > 0 && renderMobileTree(children, depth + 1)}
        </div>
      );
    });

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
          <nav className="hidden md:flex items-center gap-0.5">
            <Link
              to="/"
              className={`px-3 py-2 font-oswald font-medium text-sm tracking-wider uppercase transition-colors hover:text-primary ${location.pathname === "/" ? "text-primary" : "text-foreground"}`}
            >
              HOME
            </Link>
            {topLevel.map(cat => (
              <NavDropdown
                key={cat.id}
                cat={cat}
                location={location}
                subs={getSubs(cat.id).map(sub => ({
                  ...sub,
                  _grandchildren: getSubs(sub.id),
                }))}
              />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Search..."
                  className="w-40 bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button onClick={() => { setSearchOpen(false); setSearchVal(""); }} className="p-1.5 text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <Search className="w-5 h-5" />
              </button>
            )}
            <Link to="/pricing" className="hidden md:inline-flex px-3 py-1.5 bg-accent/10 border border-accent/40 text-accent font-oswald text-xs font-medium tracking-wider uppercase rounded hover:bg-accent/20 transition-colors">
              MEMBERSHIP
            </Link>
            <Link to="/admin" className="hidden md:inline-flex px-3 py-1.5 bg-primary text-white font-oswald text-xs font-medium tracking-wider uppercase rounded hover:bg-red-700 transition-colors">
              ADMIN
            </Link>
            <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-border py-3 flex flex-col">
            <Link to="/" className="px-4 py-2 font-oswald font-medium text-sm tracking-wider uppercase text-foreground hover:text-primary" onClick={() => setMobileOpen(false)}>HOME</Link>
            {renderMobileTree(topLevel)}
            <Link to="/pricing" className="px-4 py-2 font-oswald font-medium text-sm tracking-wider uppercase text-accent" onClick={() => setMobileOpen(false)}>MEMBERSHIP</Link>
            <Link to="/admin" className="px-4 py-2 mt-1 font-oswald font-medium text-sm tracking-wider uppercase text-primary" onClick={() => setMobileOpen(false)}>ADMIN PANEL</Link>
          </nav>
        )}
      </div>
    </header>
  );
}