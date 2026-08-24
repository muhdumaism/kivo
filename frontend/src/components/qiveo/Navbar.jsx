import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, isStaff } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { CreateProjectModal } from "./CreateProjectModal";
import {
  Plus, Bell, ChevronDown, Download, Compass, Server, Menu, X,
  User as UserIcon, Settings, FolderHeart, Boxes, BarChart3, Building2, LogOut, Flag, Package,
} from "lucide-react";

function useOutside(ref, onClose) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onClose]);
}

export function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [modal, setModal] = useState(null); // 'project' | null
  const soon = () => toast("Coming soon");

  return (
    <>
      <header className="sticky top-0 z-50 h-16 bg-[#0A0A0C]/90 backdrop-blur-xl border-b-2 border-[#E9D5FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 shrink-0">
            <span className="font-heading font-black text-2xl tracking-tighter text-[#E9D5FF] uppercase">QIVEO</span>
          </Link>

          <nav className="hidden lg:flex items-center justify-center gap-6 flex-1 max-w-xl mx-auto">
            <Link to="/browse" className="text-sm font-heading font-extrabold text-[#E9D5FF] hover:underline">Games</Link>
            <Link to="/news" className="text-sm font-heading font-extrabold text-[#E9D5FF] hover:underline">News</Link>
            <Link to="/about" className="text-sm font-heading font-extrabold text-[#E9D5FF] hover:underline">About</Link>
            <Link to="/pitch" className="text-sm font-heading font-extrabold text-[#E9D5FF] hover:underline">Pitch Us</Link>
            <Link to="/contact" className="text-sm font-heading font-extrabold text-[#E9D5FF] hover:underline">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button data-testid="nav-publish" onClick={() => setModal("project")} className="hidden sm:inline-flex items-center gap-1.5 retro-btn-black px-4 py-2 text-sm font-extrabold"><Plus className="w-4 h-4" />Publish</button>
                <NotificationBell />
                <AvatarMenu user={user} onSoon={soon} onLogout={() => { logout(); nav("/"); }} />
              </div>
            ) : (
              <Link to="/login" data-testid="nav-login" className="inline-flex items-center gap-2 retro-btn-black px-5 py-2 text-sm font-extrabold">Sign in</Link>
            )}

            <button data-testid="nav-menu-toggle" onClick={() => setMobile(!mobile)} className="lg:hidden text-[#E9D5FF] ml-1">{mobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>

        {mobile && (
          <div className="lg:hidden border-b-2 border-[#E9D5FF] bg-[#0A0A0C] px-4 py-3 space-y-1">
            <Link to="/browse" data-testid="mnav-discover" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-[#E9D5FF] hover:bg-[#E9D5FF]/5 font-heading font-bold">Discover content</Link>
            <Link to="/browse" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-[#E9D5FF] hover:bg-[#E9D5FF]/5 font-heading font-bold">Host a server</Link>
            {user ? (
              <>
                <button data-testid="mnav-publish" onClick={() => { setModal("project"); setMobile(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-[#E9D5FF] hover:bg-[#E9D5FF]/5 font-heading font-bold">+ Publish</button>
                <Link to="/creator" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-[#E9D5FF] hover:bg-[#E9D5FF]/5 font-heading font-bold">Projects</Link>
                <Link to="/collections" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-[#E9D5FF] hover:bg-[#E9D5FF]/5 font-heading font-bold">Collections</Link>
                {isStaff(user) && <Link to="/admin" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-rose-600 font-heading font-bold">Staff Panel</Link>}
                <button onClick={() => { logout(); nav("/"); setMobile(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-rose-600 font-heading font-bold">Sign out</button>
              </>
            ) : <Link to="/login" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-[#E9D5FF] hover:bg-[#E9D5FF]/5 font-heading font-bold">Sign in</Link>}
          </div>
        )}
      </header>

      {modal === "project" && <CreateProjectModal onClose={() => setModal(null)} />}
    </>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unread: 0 });
  const ref = useRef(null);
  const { addListener } = useWebSocket();
  useOutside(ref, () => setOpen(false));
  const load = () => api.get("/notifications").then((r) => setData(r.data)).catch(() => {});
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);

  useEffect(() => {
    if (!addListener) return;
    const unbind = addListener("notification", (msg) => {
      setData((prev) => {
        if (prev.notifications.some((n) => n.id === msg.notification.id)) return prev;
        return {
          notifications: [msg.notification, ...prev.notifications],
          unread: prev.unread + 1,
        };
      });
    });
    return unbind;
  }, [addListener]);

  const openMenu = () => { setOpen(!open); if (!open && data.unread) api.post("/notifications/read-all").then(() => setData((d) => ({ ...d, unread: 0 }))); };

  return (
    <div className="relative" ref={ref}>
      <button data-testid="nav-notifications" onClick={openMenu} className="relative w-9 h-9 grid place-items-center rounded-xl border-2 border-[#E9D5FF] text-[#E9D5FF] hover:bg-[#E9D5FF]/5 transition-colors">
        <Bell className="w-5 h-5" />
        {data.unread > 0 && <span data-testid="notif-badge" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#E9D5FF] text-[#0A0A0C] text-[10px] font-extrabold rounded-full grid place-items-center border border-[#0A0A0C]">{data.unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-2xl shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-hidden" data-testid="notif-menu">
          <div className="px-4 py-3 border-b-2 border-[#E9D5FF] font-heading font-extrabold text-[#E9D5FF] text-sm">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? <p className="px-4 py-6 text-center text-[#E9D5FF]/50 text-sm font-mono font-bold">All caught up ✨</p> :
              data.notifications.map((n) => (
                <Link key={n.id} to={n.link || "#"} onClick={() => setOpen(false)} className="block px-4 py-3 border-b border-dashed border-[#E9D5FF]/30 hover:bg-[#E9D5FF]/5">
                  <p className="text-sm font-heading font-bold text-[#E9D5FF]">{n.text}</p>
                  <p className="text-[10px] font-mono text-[#E9D5FF]/50 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarMenu({ user, onSoon, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const staff = isStaff(user);
  return (
    <div className="relative" ref={ref}>
      <button data-testid="nav-profile" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl border-2 border-[#E9D5FF] hover:bg-[#E9D5FF]/5 transition-colors">
        <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-lg bg-[#15141E] border border-[#E9D5FF]/30 object-cover" />
        <ChevronDown className={`w-3.5 h-3.5 text-[#E9D5FF] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-2xl shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-2" data-testid="avatar-menu" onClick={() => setOpen(false)}>
          <div className="px-3 py-2 mb-1"><p className="font-heading font-extrabold text-[#E9D5FF] text-sm truncate">{user.name}</p><p className="text-[11px] font-mono text-[#E9D5FF]/50 truncate">{user.email}</p></div>
          <div className="h-px bg-[#E9D5FF]/20 my-1" />
          <MenuLink to="/profile" icon={UserIcon} label="Profile" />
          <MenuItem icon={Server} label="My servers" onClick={onSoon} />
          <div className="h-px bg-[#E9D5FF]/20 my-1" />
          {staff && <MenuLink to="/admin/reports" icon={Flag} label="Active reports" />}
          <MenuLink to="/collections" icon={FolderHeart} label="Collections" />
          <div className="h-px bg-[#E9D5FF]/20 my-1" />
          <MenuLink to="/creator" icon={Boxes} label="Projects" />
          <MenuItem icon={Building2} label="Organizations" onClick={onSoon} />
          {staff && <><div className="h-px bg-[#E9D5FF]/20 my-1" /><MenuLink to="/admin" icon={Package} label="Staff panel" /></>}
          <div className="h-px bg-[#E9D5FF]/20 my-1" />
          <button data-testid="nav-logout" onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 font-heading font-bold"><LogOut className="w-4 h-4" />Sign out</button>
        </div>
      )}
    </div>
  );
}

const MenuItem = ({ icon: Icon, label, onClick, testid }) => (
  <button data-testid={testid} onClick={onClick} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#E9D5FF]/80 hover:bg-[#E9D5FF]/5 hover:text-[#E9D5FF] transition-colors font-heading font-bold"><Icon className="w-4 h-4" />{label}</button>
);
const MenuLink = ({ to, icon: Icon, label }) => (
  <Link to={to} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#E9D5FF]/80 hover:bg-[#E9D5FF]/5 hover:text-[#E9D5FF] transition-colors font-heading font-bold"><Icon className="w-4 h-4" />{label}</Link>
);
