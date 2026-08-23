import { Link, useNavigate } from "react-router-dom";
import { useAuth, isStaff } from "@/context/AuthContext";
import { Box, Search, Upload, Shield, LogOut, User as UserIcon, Terminal } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-charcoal border-b border-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-4">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 bg-teal grid place-items-center border border-teal-light">
            <Box className="w-5 h-5 text-warm" />
          </div>
          <span className="font-heading font-black text-xl tracking-tighter text-warm">KIVO</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-2 font-mono text-sm">
          <Link to="/browse" data-testid="nav-browse" className="px-3 py-2 text-warm/70 hover:text-amber transition-colors uppercase tracking-wide">Browse</Link>
          <Link to="/game/minecraft" data-testid="nav-minecraft" className="px-3 py-2 text-warm/70 hover:text-amber transition-colors uppercase tracking-wide">Minecraft</Link>
        </nav>

        <div className="flex-1" />

        <Link to="/browse" data-testid="nav-search" className="md:hidden text-warm/70"><Search className="w-5 h-5" /></Link>

        {user ? (
          <div className="flex items-center gap-2">
            {isStaff(user) && (
              <Link to="/admin" data-testid="nav-admin" className="hidden sm:inline-flex items-center gap-1.5 bg-rust text-warm px-3 py-2 font-mono text-xs uppercase tracking-wide border border-rust hover:-translate-y-0.5 transition-transform">
                <Shield className="w-4 h-4" /> Staff
              </Link>
            )}
            <Link to="/creator" data-testid="nav-creator" className="hidden sm:inline-flex items-center gap-1.5 bg-teal text-warm px-3 py-2 font-mono text-xs uppercase tracking-wide border border-teal-light hover:-translate-y-0.5 transition-transform">
              <Upload className="w-4 h-4" /> Creator
            </Link>
            <Link to="/profile" data-testid="nav-profile" className="flex items-center gap-2 pl-1">
              <img src={user.avatar_url} alt={user.name} className="w-9 h-9 border border-slate-light bg-slate" />
            </Link>
            <button data-testid="nav-logout" onClick={() => { logout(); nav("/"); }} className="text-warm/50 hover:text-rust transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link to="/login" data-testid="nav-login" className="inline-flex items-center gap-1.5 bg-amber text-charcoal px-4 py-2 font-mono text-sm font-semibold uppercase tracking-wide hover:-translate-y-0.5 transition-transform hard-shadow-teal">
            <Terminal className="w-4 h-4" /> Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
