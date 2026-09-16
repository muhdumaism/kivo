import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Download, Users } from 'lucide-react';
import { API } from '@/lib/api';
import { SkinViewer } from 'skinview3d';

export default function SkinCard({ skin }) {
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);
  
  // Determine the display URL for the skin texture
  let textureUrl = skin.texture_url || '';
  if (textureUrl.includes('textures.minecraft.net/texture/')) {
    const parts = textureUrl.split('/');
    const tex_id = parts[parts.length - 1];
    textureUrl = `${API}/minecraft/download/${tex_id}`;
  } else if (textureUrl.startsWith('/')) {
    textureUrl = `${API.replace('/api', '')}${textureUrl}`;
  }
  
  const isQiveo = skin.source === 'qiveo';
  const hasMod = !!skin.mod;

  useEffect(() => {
    if (textureUrl && viewerRef.current && !viewerInstance.current) {
      viewerInstance.current = new SkinViewer({
        canvas: viewerRef.current,
        width: 150,
        height: 200,
        skin: textureUrl,
        model: skin.model || 'classic'
      });
      viewerInstance.current.zoom = 0.9;
      viewerInstance.current.autoRotate = true;
      viewerInstance.current.autoRotateSpeed = 0.5;
    }
    
    return () => {
      if (viewerInstance.current) {
        viewerInstance.current.dispose();
        viewerInstance.current = null;
      }
    };
  }, [textureUrl, skin.model]);

  const linkTarget = hasMod ? `/skins/${skin.mod.slug}` : (skin.users?.length > 0 ? `/skins/player/${skin.users[0].username}` : '#');
  const title = skin.name || (skin.users?.length > 0 ? `${skin.users[0].username}'s Skin` : 'Unknown Skin');

  return (
    <Link 
      to={linkTarget} 
      className={`group bg-[#171512] border-2 border-[#92400E] rounded-2xl overflow-hidden hover:border-[#F5C542] transition-colors relative flex flex-col ${linkTarget === '#' ? 'cursor-default' : ''}`}
      onClick={(e) => linkTarget === '#' && e.preventDefault()}
    >
      <div className="aspect-[3/4] bg-[#24201A] p-2 flex items-center justify-center relative overflow-hidden">
        {textureUrl ? (
          <canvas ref={viewerRef} className="group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="text-[#FFF8E1]/50 font-mono text-xs">No Texture</div>
        )}
        
        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border ${
            isQiveo ? 'bg-[#92400E] border-[#F5C542] text-[#FFF8E1]' : 'bg-[#171512]/80 backdrop-blur-sm border-[#92400E] text-[#FFF8E1]/70'
          }`}>
            {isQiveo ? 'Qiveo' : 'Minecraft'}
          </div>
          <div className="bg-[#171512]/80 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-mono font-bold text-[#FFF8E1]/70 border border-[#92400E]">
            {skin.model === 'slim' ? 'Slim' : 'Classic'}
          </div>
        </div>

        {hasMod && (
          <div className="absolute top-2 right-2 bg-[#171512]/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 border border-[#92400E]">
            <Download className="w-3 h-3 text-[#FFF8E1]/70" />
            <span className="text-[10px] font-mono font-bold text-[#FFF8E1]">{skin.mod.downloads || 0}</span>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t-2 border-[#92400E] group-hover:border-[#F5C542] transition-colors bg-[#171512] mt-auto flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-heading font-black text-[#FFF8E1] truncate">{title}</h3>
          {hasMod && (
            <p className="text-xs font-mono text-[#FFF8E1]/50 truncate mt-0.5">by {skin.mod.author_name}</p>
          )}
        </div>
        
        {/* Users Section */}
        <div className="pt-2 border-t border-[#92400E]/30">
          {skin.users && skin.users.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {skin.users.slice(0, 3).map(u => (
                  <img 
                    key={u.uuid} 
                    src={`https://crafatar.com/avatars/${u.uuid}?size=24&overlay`} 
                    alt={u.username}
                    className="w-6 h-6 rounded-md border border-[#171512] bg-[#24201A]"
                    title={u.username}
                  />
                ))}
              </div>
              <div className="text-[10px] font-mono text-[#FFF8E1]/70 truncate flex-1">
                {skin.users[0].username}
                {skin.users.length > 1 && ` +${skin.users.length - 1}`}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#FFF8E1]/40">
              <Users className="w-3 h-3" />
              <span>No known users</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
