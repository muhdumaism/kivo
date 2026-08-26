import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function WorkspaceSwitcher({ user }) {
  return (
    <div className="relative">
      <Link 
        to="/"
        className="flex items-center justify-between px-2 py-2 mb-4 rounded-lg hover:bg-[#24201A] cursor-pointer transition-colors select-none group border border-transparent hover:border-[#92400E]/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-[#F5C542] text-[#000000] flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(146,64,14,1)]">
            Q
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-heading font-black leading-none mb-1 text-[#FFF8E1] truncate max-w-[120px]">
              QIVEO.dev
            </span>
            <span className="text-[11px] font-mono text-[#F59E0B] leading-none uppercase tracking-widest">
              Staff Panel
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function NavItem({ 
  item, 
  activeId, 
  level = 0
}) {
  const isActive = activeId === item.id || (item.id !== '/admin' && activeId.startsWith(item.id));
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(isActive || false);

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <Link 
        to={hasChildren ? "#" : item.id}
        onClick={handleClick}
        className={`group flex items-center justify-between px-2.5 py-[9px] rounded-[8px] cursor-pointer transition-all duration-200 select-none mb-0.5
          ${isActive 
            ? 'bg-[#24201A] text-[#F5C542] font-medium border border-[#92400E] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]' 
            : 'text-[#FFF8E1]/60 hover:bg-[#24201A]/50 hover:text-[#FFF8E1] border border-transparent hover:border-[#92400E]/50'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
      >
        <div className="flex items-center gap-2.5">
          <item.icon 
            className={`w-[16px] h-[16px] transition-colors
              ${isActive ? 'text-[#F5C542]' : 'text-[#FFF8E1]/40 group-hover:text-[#F5C542]'}
            `} 
            strokeWidth={1.5} 
          />
          <span className="text-[12px] tracking-wide truncate font-mono uppercase font-bold">
            {item.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-[#92400E] text-[#FFF8E1]">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight 
              className={`w-3.5 h-3.5 text-[#FFF8E1]/30 transition-transform duration-200 ${isOpen ? 'rotate-90 text-[#F5C542]' : 'group-hover:text-[#FFF8E1]'}`} 
              strokeWidth={2}
            />
          )}
        </div>
      </Link>

      {hasChildren && (
        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-1 mt-1">
            <div 
              className="absolute top-0 bottom-0 border-l-2 border-[#92400E]/20"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children.map(child => (
              <NavItem 
                key={child.id} 
                item={child} 
                activeId={activeId} 
                level={level + 1} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSidebar({ 
  className = '',
  navGroups,
  user
}) {
  const location = useLocation();
  const activeId = location.pathname;

  return (
    <div className={`flex flex-col w-[260px] h-full bg-[#000000] border-r-2 border-[#92400E] p-4 font-sans ${className}`}>
      <WorkspaceSwitcher user={user} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-6 mt-4">
        {navGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            {group.heading && (
              <span className="px-2.5 mb-2 text-[10px] font-heading font-black tracking-widest text-[#FFF8E1]/40 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map(item => (
              <NavItem 
                key={item.id} 
                item={item} 
                activeId={activeId} 
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t-2 border-[#92400E]/50 flex flex-col gap-1">
        <div className="px-2 mb-2 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[12px] font-heading font-bold text-[#FFF8E1]">{user?.name || "Admin"}</span>
                <span className="text-[10px] font-mono text-[#F59E0B] uppercase tracking-widest">{user?.role || "Staff"}</span>
            </div>
        </div>
      </div>
    </div>
  );
}
