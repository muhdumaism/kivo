import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Search, Loader2, Filter } from 'lucide-react';
import SkinCard from '@/components/qiveo/SkinCard';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';

export default function Skins() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skins, setSkins] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [source, setSource] = useState('all');
  const [model, setModel] = useState('all');
  const [usage, setUsage] = useState('all');
  
  const nav = useNavigate();

  const fetchSkins = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const res = await api.get(`/v2/skins?page=${pageNum}&limit=24&source=${source}&model=${model}&usage=${usage}&q=${query}`);
      const data = res.data?.data || [];
      
      if (isLoadMore) {
        setSkins(prev => [...prev, ...data]);
      } else {
        setSkins(data);
      }
      
      setHasMore(data.length === 24);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [source, model, usage, query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSkins(1, false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [fetchSkins]);

  const search = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // If it looks like an exact Minecraft player name, go to profile, else search in place
    if (!query.includes(' ') && query.length <= 16) {
      nav(`/skins/player/${query.trim()}`);
    } else {
      fetchSkins(1, false);
    }
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
              placeholder="Search skins or player names..."
              className="w-full bg-[#171512] border-2 border-[#92400E] rounded-2xl py-4 pl-12 pr-4 text-[#FFF8E1] font-bold focus:outline-none focus:border-[#F5C542] transition-colors"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFF8E1]/50 w-5 h-5" />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F5C542] text-[#171512] px-6 py-2 rounded-xl font-bold hover:bg-[#FFD84D] transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 space-y-6 shrink-0">
            <div className="bg-[#171512] rounded-2xl p-6 border border-[#92400E]">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-[#F5C542]" />
                <h3 className="font-heading font-black text-xl text-[#FFF8E1] uppercase">Filters</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#FFF8E1]/50 uppercase tracking-wider mb-2 block">Source</label>
                  <select 
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-[#24201A] border border-[#92400E] rounded-xl px-4 py-2.5 text-[#FFF8E1] font-bold outline-none focus:border-[#F5C542] cursor-pointer"
                  >
                    <option value="all">All Sources</option>
                    <option value="qiveo">Qiveo Uploads</option>
                    <option value="minecraft">Minecraft Players</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-[#FFF8E1]/50 uppercase tracking-wider mb-2 block">Model</label>
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#24201A] border border-[#92400E] rounded-xl px-4 py-2.5 text-[#FFF8E1] font-bold outline-none focus:border-[#F5C542] cursor-pointer"
                  >
                    <option value="all">All Models</option>
                    <option value="classic">Classic (Wide)</option>
                    <option value="slim">Slim</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#FFF8E1]/50 uppercase tracking-wider mb-2 block">Usage</label>
                  <select 
                    value={usage}
                    onChange={(e) => setUsage(e.target.value)}
                    className="w-full bg-[#24201A] border border-[#92400E] rounded-xl px-4 py-2.5 text-[#FFF8E1] font-bold outline-none focus:border-[#F5C542] cursor-pointer"
                  >
                    <option value="all">All Skins</option>
                    <option value="has_users">Has Known Users</option>
                    <option value="no_users">No Known Users</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Skin Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-black text-[#FFF8E1] uppercase">Discover Skins</h2>
              <Link to="/project/create-skin" className="px-5 py-2.5 rounded-full bg-[#24201A] border border-[#92400E] text-[#FFF8E1] text-sm font-bold hover:bg-[#92400E] transition-colors whitespace-nowrap">
                Publish a Skin
              </Link>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#F5C542] animate-spin" />
              </div>
            ) : skins.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-[#92400E] rounded-3xl">
                <p className="text-[#FFF8E1]/50 font-mono font-bold">No skins found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {skins.map((skin, i) => (
                    <SkinCard key={skin.id || i} skin={skin} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button 
                      onClick={() => fetchSkins(page + 1, true)}
                      disabled={loadingMore}
                      className="px-6 py-3 rounded-full bg-[#171512] border-2 border-[#92400E] text-[#FFF8E1] font-bold hover:border-[#F5C542] transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {loadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Load More Skins'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
