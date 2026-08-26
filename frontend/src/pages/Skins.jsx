import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Search, Loader2 } from 'lucide-react';
import SkinCard from '@/components/qiveo/SkinCard';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';

export default function Skins() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [skins, setSkins] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    // Fetch published skins from Qiveo marketplace
    api.get('/mods?category=skins&limit=24').then(res => setSkins(res.data.mods || [])).catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    // Let the player profile page handle the lookup
    nav(`/skins/player/${query.trim()}`);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl sm:text-5xl font-heading font-black text-[#FFF8E1] uppercase tracking-tighter mb-4">Minecraft Skins</h1>
        <p className="text-[#FFF8E1]/60 font-mono mb-8">Search for any Minecraft player or discover custom skins created by the Qiveo community.</p>
        
        <form onSubmit={search} className="relative max-w-xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Username or UUID..."
            className="w-full bg-[#171512] border-2 border-[#92400E] rounded-2xl py-4 pl-12 pr-4 text-[#FFF8E1] font-bold focus:outline-none focus:border-[#F5C542] transition-colors"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFF8E1]/50 w-5 h-5" />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F5C542] text-[#171512] px-6 py-2 rounded-xl font-bold hover:bg-[#FFD84D] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Search'}
          </button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-heading font-black text-[#FFF8E1] uppercase">Trending Skins</h2>
          <Link to="/project/create-skin" className="px-5 py-2.5 rounded-full bg-[#24201A] border border-[#92400E] text-[#FFF8E1] text-sm font-bold hover:bg-[#92400E] transition-colors">
            Publish a Skin
          </Link>
        </div>
        
        {skins.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#92400E] rounded-3xl">
            <p className="text-[#FFF8E1]/50 font-mono font-bold">No skins published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {skins.map(skin => (
              <SkinCard key={skin.id} skin={skin} />
            ))}
          </div>
        )}
      </div>
    </div>
    <Footer />
  </div>
  );
}
