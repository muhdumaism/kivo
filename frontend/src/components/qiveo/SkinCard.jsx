import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { API } from '@/lib/api';
import { SkinViewer } from 'skinview3d';

export default function SkinCard({ skin }) {
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);
  const fallbackThumbnail = skin.icon?.startsWith('http') ? skin.icon : `${API.replace('/api', '')}${skin.icon}`;

  useEffect(() => {
    if (skin.gallery?.[0] && viewerRef.current && !viewerInstance.current) {
      const modelTag = skin.tags?.find(t => t.startsWith('model:'));
      const model = modelTag ? modelTag.split(':')[1] : 'classic';
      const rawUrl = skin.gallery[0].startsWith('http') ? skin.gallery[0] : `${API.replace('/api', '')}${skin.gallery[0]}`;
      
      viewerInstance.current = new SkinViewer({
        canvas: viewerRef.current,
        width: 150,
        height: 200,
        skin: rawUrl,
        model: model
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
  }, [skin]);

  return (
    <Link 
      to={`/skins/${skin.slug}`} 
      className="group bg-[#171512] border-2 border-[#92400E] rounded-2xl overflow-hidden hover:border-[#F5C542] transition-colors relative flex flex-col"
    >
      <div className="aspect-[3/4] bg-[#24201A] p-2 flex items-center justify-center relative overflow-hidden">
        {skin.gallery?.[0] ? (
          <canvas ref={viewerRef} className="group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <img 
            src={fallbackThumbnail} 
            alt={skin.title} 
            className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
          />
        )}
        
        <div className="absolute top-2 right-2 bg-[#171512]/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 border border-[#92400E]">
          <Download className="w-3 h-3 text-[#FFF8E1]/70" />
          <span className="text-[10px] font-mono font-bold text-[#FFF8E1]">{skin.downloads || 0}</span>
        </div>
      </div>
      
      <div className="p-3 border-t-2 border-[#92400E] group-hover:border-[#F5C542] transition-colors bg-[#171512] mt-auto">
        <h3 className="text-sm font-heading font-black text-[#FFF8E1] truncate">{skin.title}</h3>
        <p className="text-xs font-mono text-[#FFF8E1]/50 truncate mt-0.5">by {skin.author_name}</p>
      </div>
    </Link>
  );
}
