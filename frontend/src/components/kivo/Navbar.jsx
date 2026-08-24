import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, isStaff } from "@/context/AuthContext";
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
      <header className="sticky top-0 z-50 h-16 bg-ink/80 backdrop-blur-xl border-b border-plumborder/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-3">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet to-coral grid place-items-center"><span className="font-pixel text-ink text-lg leading-none">K</span></div>
            <span className="font-pixel text-2xl text-warm hidden sm:block">kivo</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-3 flex-1">
            <DiscoverDropdown />
            <Link to="/browse" data-testid="nav-servers" className="px-3 py-2 text-sm font-medium text-lavender2/70 hover:text-warm transition-colors flex items-center gap-1.5"><Server className="w-4 h-4" />Host a server</Link>
            <Link to="/browse" data-testid="nav-getapp" className="ml-1 inline-flex items-center gap-1.5 bg-violet/15 text-lavender2 border border-violet/40 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-violet/25 transition-colors"><Download className="w-4 h-4" />Get Kivo</Link>
          </nav>

          <div className="flex-1 lg:hidden" />

          {user ? (
            <div className="flex items-center gap-2">
              <CreateDropdown onNewProject={() => setModal("project")} onSoon={soon} nav={nav} />
              <button data-testid="nav-publish" onClick={() => setModal("project")} className="hidden sm:inline-flex items-center gap-1.5 bg-coral text-ink px-4 py-2 rounded-lg text-sm font-bold hover:-translate-y-0.5 transition-transform glow-coral"><Plus className="w-4 h-4" />Publish</button>
              <NotificationBell />
              <AvatarMenu user={user} onSoon={soon} onLogout={() => { logout(); nav("/"); }} />
            </div>
          ) : (
            <Link to="/login" data-testid="nav-login" className="inline-flex items-center gap-2 bg-coral text-ink px-5 py-2.5 rounded-lg text-sm font-bold hover:-translate-y-0.5 transition-transform glow-coral">Sign in</Link>
          )}

          <button data-testid="nav-menu-toggle" onClick={() => setMobile(!mobile)} className="lg:hidden text-warm ml-1">{mobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>

        {mobile && (
          <div className="lg:hidden border-t border-plumborder/60 bg-ink px-4 py-3 space-y-1">
            <Link to="/browse" data-testid="mnav-discover" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-lavender2/80 hover:bg-plum">Discover content</Link>
            <Link to="/browse" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-lavender2/80 hover:bg-plum">Host a server</Link>
            {user ? (
              <>
                <button data-testid="mnav-publish" onClick={() => { setModal("project"); setMobile(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-coral2">+ Publish</button>
                <Link to="/creator" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-lavender2/80">Projects</Link>
                <Link to="/collections" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-lavender2/80">Collections</Link>
                {isStaff(user) && <Link to="/admin" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-rose">Staff Panel</Link>}
                <button onClick={() => { logout(); nav("/"); setMobile(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-rose">Sign out</button>
              </>
            ) : <Link to="/login" onClick={() => setMobile(false)} className="block px-3 py-2.5 rounded-lg text-coral2">Sign in</Link>}
          </div>
        )}
      </header>

      {modal === "project" && <CreateProjectModal onClose={() => setModal(null)} />}
    </>
  );
}

function DiscoverDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const items = [["Mod", "Mod"], ["Plugin", "Mod"], ["Skin", "Skin"], ["Build", "Build"], ["World", "World"], ["Collectible", "Collectible"]];
  return (
    <div className="relative" ref={ref}>
      <button data-testid="nav-discover" onClick={() => setOpen(!open)} className="px-3 py-2 text-sm font-medium text-lavender2/70 hover:text-warm transition-colors flex items-center gap-1.5"><Compass className="w-4 h-4" />Discover content <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} /></button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-plum border border-plumborder rounded-xl shadow-2xl p-2" data-testid="discover-menu">
          <Link to="/browse" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-warm hover:bg-plum2">All content</Link>
          <div className="h-px bg-plumborder my-1" />
          {items.map(([label, type], i) => (
            <Link key={i} to={`/browse?item_type=${type}`} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-lavender2/80 hover:bg-plum2 hover:text-warm">{label}s</Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateDropdown({ onNewProject, onSoon, nav }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const act = (fn) => { setOpen(false); fn(); };
  return (
    <div className="relative" ref={ref}>
      <button data-testid="nav-create-toggle" onClick={() => setOpen(!open)} className="w-9 h-9 grid place-items-center rounded-lg border border-plumborder text-lavender2 hover:border-violet/60 hover:text-warm transition-colors"><Plus className="w-5 h-5" /></button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-plum border border-plumborder rounded-xl shadow-2xl p-2" data-testid="create-menu">
          <MenuItem testid="create-project" icon={Package} label="New project" onClick={() => act(onNewProject)} />
          <MenuItem testid="create-server" icon={Server} label="New server" onClick={() => act(onSoon)} />
          <MenuItem testid="create-collection" icon={FolderHeart} label="New collection" onClick={() => act(() => nav("/collections?new=1"))} />
          <MenuItem testid="create-org" icon={Building2} label="New organization" onClick={() => act(onSoon)} />
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unread: 0 });
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const load = () => api.get("/notifications").then((r) => setData(r.data)).catch(() => {});
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);
  const openMenu = () => { setOpen(!open); if (!open && data.unread) api.post("/notifications/read-all").then(() => setData((d) => ({ ...d, unread: 0 }))); };
  return (
    <div className="relative" ref={ref}>
      <button data-testid="nav-notifications" onClick={openMenu} className="relative w-9 h-9 grid place-items-center rounded-lg border border-plumborder text-lavender2 hover:border-violet/60 hover:text-warm transition-colors">
        <Bell className="w-5 h-5" />
        {data.unread > 0 && <span data-testid="notif-badge" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-coral text-ink text-[10px] font-bold rounded-full grid place-items-center">{data.unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-plum border border-plumborder rounded-xl shadow-2xl overflow-hidden" data-testid="notif-menu">
          <div className="px-4 py-3 border-b border-plumborder font-heading font-bold text-warm text-sm">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? <p className="px-4 py-6 text-center text-lavender2/40 text-sm font-mono">All caught up ✨</p> :
              data.notifications.map((n) => (
                <Link key={n.id} to={n.link || "#"} onClick={() => setOpen(false)} className="block px-4 py-3 border-b border-plumborder/50 hover:bg-plum2">
                  <p className="text-sm text-warm">{n.text}</p>
                  <p className="text-[10px] font-mono text-lavender2/40 mt-1">{new Date(n.created_at).toLocaleString()}</p>
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
      <button data-testid="nav-profile" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg border border-plumborder hover:border-violet/60 transition-colors">
        <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-lg bg-plum2" />
        <ChevronDown className={`w-3.5 h-3.5 text-lavender2/60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-plum border border-plumborder rounded-xl shadow-2xl p-2" data-testid="avatar-menu" onClick={() => setOpen(false)}>
          <div className="px-3 py-2 mb-1"><p className="font-heading font-bold text-warm text-sm truncate">{user.name}</p><p className="text-[11px] font-mono text-lavender2/50 truncate">{user.email}</p></div>
          <div className="h-px bg-plumborder my-1" />
          <MenuLink to="/profile" icon={UserIcon} label="Profile" />
          <MenuItem icon={Server} label="My servers" onClick={onSoon} />
          <div className="h-px bg-plumborder my-1" />
          {staff && <MenuLink to="/admin/reports" icon={Flag} label="Active reports" />}
          <MenuLink to="/collections" icon={FolderHeart} label="Collections" />
          <div className="h-px bg-plumborder my-1" />
          <MenuLink to="/creator" icon={Boxes} label="Projects" />
          <MenuItem icon={Building2} label="Organizations" onClick={onSoon} />
          {staff && <><div className="h-px bg-plumborder my-1" /><MenuLink to="/admin" icon={Package} label="Staff panel" /></>}
          <div className="h-px bg-plumborder my-1" />
          <button data-testid="nav-logout" onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose hover:bg-rose/10"><LogOut className="w-4 h-4" />Sign out</button>
        </div>
      )}
    </div>
  );
}

const MenuItem = ({ icon: Icon, label, onClick, testid }) => (
  <button data-testid={testid} onClick={onClick} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-lavender2/80 hover:bg-plum2 hover:text-warm transition-colors"><Icon className="w-4 h-4" />{label}</button>
);
const MenuLink = ({ to, icon: Icon, label }) => (
  <Link to={to} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-lavender2/80 hover:bg-plum2 hover:text-warm transition-colors"><Icon className="w-4 h-4" />{label}</Link>
);
