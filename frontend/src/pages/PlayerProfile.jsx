import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Download, Share2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { SkinViewer } from 'skinview3d';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';

export default function PlayerProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/minecraft/profile/${id}`)
      .then(res => {
        setProfile(res.data);
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Failed to load player profile');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (profile && viewerRef.current && !viewerInstance.current) {
      viewerInstance.current = new SkinViewer({
        canvas: viewerRef.current,
        width: 300,
        height: 400,
        skin: profile.skin.url,
        model: profile.skin.model
      });
      if (profile.cape) {
        viewerInstance.current.loadCape(profile.cape.url);
      }
      viewerInstance.current.autoRotate = true;
      viewerInstance.current.autoRotateSpeed = 0.5;
    } else if (viewerInstance.current && profile) {
      viewerInstance.current.loadSkin(profile.skin.url, profile.skin.model);
      if (profile.cape) {
        viewerInstance.current.loadCape(profile.cape.url);
      }
    }
  }, [profile]);

  const downloadSkin = () => {
    if (!profile?.skin?.url) return;
    const a = document.createElement('a');
    a.href = profile.skin.url;
    a.download = `${profile.username}_skin.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Skin download started');
  };

  const copyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-[#FFF8E1]/50 font-bold animate-pulse">Resolving player data...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-20 w-full text-center">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-3xl font-heading font-black text-[#FFF8E1] mb-2 uppercase tracking-tight">Player Not Found</h1>
          <p className="font-mono text-[#FFF8E1]/60 mb-8">{error}</p>
          <button onClick={() => nav('/skins')} className="px-6 py-2 rounded-xl bg-[#24201A] border border-[#92400E] text-[#FFF8E1] font-bold hover:bg-[#92400E] transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <button onClick={() => nav('/skins')} className="mb-6 inline-flex items-center gap-2 text-[#FFF8E1]/50 hover:text-[#FFF8E1] font-mono font-bold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Skins
        </button>

        <div className="bg-[#171512] border-2 border-[#92400E] rounded-3xl p-6 sm:p-10 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            
            <div className="bg-[#24201A] border-2 border-[#92400E] rounded-2xl p-4 shadow-inner flex justify-center w-full md:w-auto min-w-[300px]">
              <canvas ref={viewerRef} />
            </div>

            <div className="flex-1 w-full space-y-6">
              <div>
                <h1 className="text-4xl sm:text-5xl font-heading font-black text-[#FFF8E1] uppercase tracking-tighter mb-1">{profile.username}</h1>
                <p className="font-mono text-[#FFF8E1]/50 text-xs sm:text-sm truncate">UUID: {profile.uuid}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#24201A] border border-[#92400E] p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-mono text-[#FFF8E1]/50 font-bold tracking-widest mb-1">Model</p>
                  <p className="text-[#FFF8E1] font-bold capitalize">{profile.skin.model}</p>
                </div>
                <div className="bg-[#24201A] border border-[#92400E] p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-mono text-[#FFF8E1]/50 font-bold tracking-widest mb-1">Cape</p>
                  <p className="text-[#FFF8E1] font-bold">{profile.cape ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  onClick={downloadSkin} 
                  className="flex-1 py-3 px-6 rounded-xl bg-[#F5C542] text-[#171512] font-black uppercase tracking-wider inline-flex justify-center items-center gap-2 hover:bg-[#FFD84D] transition-colors"
                >
                  <Download className="w-5 h-5" /> Download Skin
                </button>
                <button 
                  onClick={copyShare}
                  className="sm:w-auto py-3 px-6 rounded-xl bg-[#24201A] border-2 border-[#92400E] text-[#FFF8E1] font-black uppercase tracking-wider inline-flex justify-center items-center gap-2 hover:bg-[#92400E] transition-colors"
                >
                  <Share2 className="w-5 h-5" /> Share
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
