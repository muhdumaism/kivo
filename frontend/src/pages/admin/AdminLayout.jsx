import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, ClipboardCheck, Flag, Users, ScrollText, Activity, Shield, Newspaper, Mail, ArrowLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AdminSidebar } from "@/components/qiveo/AdminSidebar";

const NAV_GROUPS = [
  {
    heading: 'Dashboard',
    items: [
      { id: '/admin', title: 'Overview', icon: LayoutDashboard },
      { id: '/admin/anomalies', title: 'Anomalies', icon: Activity },
    ]
  },
  {
    heading: 'Moderation',
    items: [
      { id: '/admin/queue', title: 'Review Queue', icon: ClipboardCheck },
      { id: '/admin/mods', title: 'Mod Moderation', icon: Shield },
      { id: '/admin/reports', title: 'Reports & Abuse', icon: Flag },
    ]
  },
  {
    heading: 'System',
    items: [
      { id: '/admin/users', title: 'Users & Trust', icon: Users },
      { id: '/admin/news', title: 'Publish News', icon: Newspaper },
      { id: '/admin/contact', title: 'Contact Inquiries', icon: Mail },
      { id: '/admin/audit', title: 'Audit Log', icon: ScrollText },
    ]
  }
];

const PERMS = {
  super_admin: ["/admin", "/admin/queue", "/admin/mods", "/admin/reports", "/admin/users", "/admin/news", "/admin/contact", "/admin/audit", "/admin/anomalies"],
  ts_moderator: ["/admin", "/admin/queue", "/admin/mods", "/admin/reports", "/admin/users", "/admin/news", "/admin/contact", "/admin/audit", "/admin/anomalies"],
  content_reviewer: ["/admin", "/admin/queue", "/admin/mods", "/admin/anomalies"],
  support_agent: ["/admin", "/admin/reports", "/admin/users", "/admin/contact", "/admin/anomalies"],
  auditor: ["/admin", "/admin/users", "/admin/audit", "/admin/anomalies"],
};

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const allowed = PERMS[user?.role] || ["/admin"];
  
  const navGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => allowed.includes(item.id))
  })).filter(group => group.items.length > 0);

  const activeItem = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === location.pathname);
  const activeTitle = activeItem ? activeItem.title : "Dashboard";

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] font-sans">
      <div className="flex h-screen w-full bg-[#000000] overflow-hidden">
        
        <div 
          className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-[#000000] border-r-2 border-[#92400E] ${
            isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'
          }`}
        >
          <AdminSidebar navGroups={navGroups} user={user} className="w-[260px] border-none" />
        </div>
        
        <div className="flex-1 bg-[#24201A]/30 flex flex-col min-w-0 transition-all duration-300 relative grain">
           <div className="absolute inset-0 scanlines opacity-[0.15] pointer-events-none z-0" />
           
           <div className="h-16 border-b-2 border-[#92400E] flex items-center px-4 sm:px-6 justify-between bg-[#000000]/80 backdrop-blur-sm shrink-0 z-10 relative">
             <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsOpen(!isOpen)}
                 className="p-1.5 rounded-md text-[#FFF8E1]/60 hover:bg-[#24201A] hover:text-[#FFF8E1] transition-colors"
               >
                 {isOpen ? <PanelLeftClose className="w-[20px] h-[20px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[20px] h-[20px]" strokeWidth={1.5} />}
               </button>
               <div className="flex items-center gap-2.5 text-[11px] sm:text-sm text-[#FFF8E1]/60 font-mono uppercase tracking-widest">
                 <span className="truncate hidden sm:inline-block">Staff Panel</span>
                 <span className="text-[#92400E] hidden sm:inline-block">/</span>
                 <span className="font-bold text-[#F5C542] truncate">{activeTitle}</span>
               </div>
             </div>
             
             <div className="flex items-center gap-3">
               <Link to="/" className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#FFF8E1]/50 hover:text-[#F5C542] transition-colors">
                  <ArrowLeft className="w-3 h-3" /> <span className="hidden sm:inline-block">Exit to site</span>
               </Link>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto relative z-10 p-6 lg:p-8">
             <Outlet />
           </div>
        </div>
      </div>
    </div>
  );
}
