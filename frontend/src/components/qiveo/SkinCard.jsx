import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { API } from '@/lib/api';

export default function SkinCard({ skin }) {
  // `skin.icon` contains the pre-rendered static 3D thumbnail!
  const thumbnail = skin.icon?.startsWith('http') ? skin.icon : `${API.replace('/api', '')}${skin.icon}`;

  return (
    <Link 
      to={`/skins/${skin.slug}`} 
      className="group bg-[#171512] border-2 border-[#92400E] rounded-2xl overflow-hidden hover:border-[#F5C542] transition-colors relative"
    >
      <div className="aspect-[3/4] bg-[#24201A] p-4 flex items-center justify-center relative">
        <img 
          src={thumbnail} 
          alt={skin.title} 
          className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        
        <div className="absolute top-2 right-2 bg-[#171512]/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 border border-[#92400E]">
          <Download className="w-3 h-3 text-[#FFF8E1]/70" />
          <span className="text-[10px] font-mono font-bold text-[#FFF8E1]">{skin.downloads || 0}</span>
        </div>
      </div>
      
      <div className="p-3 border-t-2 border-[#92400E] group-hover:border-[#F5C542] transition-colors bg-[#171512]">
        <h3 className="text-sm font-heading font-black text-[#FFF8E1] truncate">{skin.title}</h3>
        <p className="text-xs font-mono text-[#FFF8E1]/50 truncate mt-0.5">by {skin.author_name}</p>
      </div>
    </Link>
  );
}
