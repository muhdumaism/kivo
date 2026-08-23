import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, isStaff } from "@/context/AuthContext";
import { Shield, Upload, LogOut, Menu, X, Wallet } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    ["/", "Home"],
    ["/browse", "Explore"],
    ["/browse?item_type=Collectible", "Collectibles"],
    ["/policy", "Trust"],
  ];

  return (
    <header className="sticky top-0 z-50 bg-ink/70 backdrop-blur-xl border-b border-plumborder/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-4">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet to-coral grid place-items-center">
            <span className="font-pixel text-ink text-lg leading-none">K</span>
          </div>
          <span className="font-pixel text-2xl tracking-tight text-warm">kivo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4 flex-1">
          {links.map(([to, label]) => (
            <Link key={label} to={to} data-testid={`nav-${label.toLowerCase()}`} className="px-3 py-2 text-sm font-medium text-lavender2/70 hover:text-warm transition-colors">{label}</Link>
          ))}
        </nav>

        <div className="flex-1 md:hidden" />

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {isStaff(user) && (
                <Link to="/admin" data-testid="nav-admin" className="inline-flex items-center gap-1.5 border border-rose/50 text-rose px-3 py-2 rounded-full text-xs font-semibold hover:bg-rose/10 transition-colors">
                  <Shield className="w-4 h-4" /> Staff
                </Link>
              )}
              <Link to="/creator" data-testid="nav-creator" className="inline-flex items-center gap-1.5 border border-violet/50 text-lavender2 px-3 py-2 rounded-full text-xs font-semibold hover:bg-violet/10 transition-colors">
                <Upload className="w-4 h-4" /> Studio
              </Link>
              <Link to="/profile" data-testid="nav-profile" className="inline-flex items-center gap-2 bg-plum border border-plumborder pl-1 pr-3 py-1 rounded-full hover:border-violet/60 transition-colors">
                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full bg-plum2" />
                <span className="text-xs font-semibold text-warm max-w-[90px] truncate">{user.name}</span>
              </Link>
              <button data-testid="nav-logout" onClick={() => { logout(); nav("/"); }} className="text-lavender2/50 hover:text-rose transition-colors"><LogOut className="w-5 h-5" /></button>
            </>
          ) : (
            <Link to="/login" data-testid="nav-login" className="shine inline-flex items-center gap-2 bg-coral text-ink px-5 py-2.5 rounded-full text-sm font-bold hover:-translate-y-0.5 transition-transform glow-coral">
              <Wallet className="w-4 h-4" /> Connect
            </Link>
          )}
        </div>

        <button data-testid="nav-menu-toggle" onClick={() => setOpen(!open)} className="md:hidden text-warm">{open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
      </div>

      {open && (
        <div className="md:hidden border-t border-plumborder/60 bg-ink px-4 py-4 space-y-1">
          {links.map(([to, label]) => (
            <Link key={label} to={to} data-testid={`mnav-${label.toLowerCase()}`} onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-lavender2/80 hover:bg-plum">{label}</Link>
          ))}
          <div className="pt-2 border-t border-plumborder/60 flex flex-col gap-2">
            {user ? (
              <>
                {isStaff(user) && <Link to="/admin" data-testid="mnav-staff" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-rose">Staff Panel</Link>}
                <Link to="/creator" data-testid="mnav-studio" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-lavender2">Creator Studio</Link>
                <Link to="/profile" data-testid="mnav-profile" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-lavender2">Profile</Link>
                <button data-testid="mnav-logout" onClick={() => { logout(); nav("/"); setOpen(false); }} className="text-left px-3 py-2.5 rounded-lg text-rose">Log out</button>
              </>
            ) : (
              <Link to="/login" data-testid="mnav-login" onClick={() => setOpen(false)} className="text-center bg-coral text-ink px-5 py-3 rounded-full font-bold">Connect</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
