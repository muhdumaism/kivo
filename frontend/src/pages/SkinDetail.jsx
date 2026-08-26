import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API } from '@/lib/api';
import { toast } from 'sonner';
import { Download, Share2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { SkinViewer } from 'skinview3d';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';

export default function SkinDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [skin, setSkin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/mods/${slug}`)
      .then(res => {
        setSkin(res.data);
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Failed to load skin');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (skin && viewerRef.current && !viewerInstance.current && skin.gallery?.[0]) {
      const modelTag = skin.tags?.find(t => t.startsWith('model:'));
      const model = modelTag ? modelTag.split(':')[1] : 'classic';
      const rawUrl = skin.gallery[0].startsWith('http') ? skin.gallery[0] : `${API.replace('/api', '')}${skin.gallery[0]}`;

      viewerInstance.current = new SkinViewer({
        canvas: viewerRef.current,
        width: 300,
        height: 400,
        skin: rawUrl,
        model: model
      });
      viewerInstance.current.autoRotate = true;
      viewerInstance.current.autoRotateSpeed = 0.5;
    } else if (viewerInstance.current && skin && skin.gallery?.[0]) {
      const modelTag = skin.tags?.find(t => t.startsWith('model:'));
      const model = modelTag ? modelTag.split(':')[1] : 'classic';
      const rawUrl = skin.gallery[0].startsWith('http') ? skin.gallery[0] : `${API.replace('/api', '')}${skin.gallery[0]}`;
      viewerInstance.current.loadSkin(rawUrl, model);
    }
  }, [skin]);

  const downloadSkin = () => {
    if (!skin?.gallery?.[0]) return;
    const rawUrl = skin.gallery[0].startsWith('http') ? skin.gallery[0] : `${API.replace('/api', '')}${skin.gallery[0]}`;
    const a = document.createElement('a');
    a.href = rawUrl;
    a.download = `${skin.slug}_skin.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Attempt to ping download analytics
    api.get(`/download/${skin.id}`).catch(() => {});
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
          <p className="font-mono text-[#FFF8E1]/50 font-bold animate-pulse">Loading skin...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !skin) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-20 w-full text-center">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-3xl font-heading font-black text-[#FFF8E1] mb-2 uppercase tracking-tight">Skin Not Found</h1>
          <p className="font-mono text-[#FFF8E1]/60 mb-8">{error}</p>
          <button onClick={() => nav('/skins')} className="px-6 py-2 rounded-xl bg-[#24201A] border border-[#92400E] text-[#FFF8E1] font-bold hover:bg-[#92400E] transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Skins
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const modelTag = skin.tags?.find(t => t.startsWith('model:'));
  const model = modelTag ? modelTag.split(':')[1] : 'classic';

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
                <h1 className="text-4xl sm:text-5xl font-heading font-black text-[#FFF8E1] uppercase tracking-tighter mb-1">{skin.title}</h1>
                <p className="font-mono text-[#FFF8E1]/50 text-sm">Created by <span className="text-[#F5C542]">{skin.author_name}</span></p>
              </div>

              {skin.summary && (
                <div className="bg-[#24201A] border border-[#92400E] p-4 rounded-xl">
                  <p className="text-sm font-mono text-[#FFF8E1]/80 leading-relaxed">{skin.summary}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#24201A] border border-[#92400E] p-4 rounded-xl flex items-center justify-between">
                  <p className="text-[10px] uppercase font-mono text-[#FFF8E1]/50 font-bold tracking-widest">Model</p>
                  <p className="text-[#FFF8E1] font-bold capitalize text-sm">{model}</p>
                </div>
                <div className="bg-[#24201A] border border-[#92400E] p-4 rounded-xl flex items-center justify-between">
                  <p className="text-[10px] uppercase font-mono text-[#FFF8E1]/50 font-bold tracking-widest">Downloads</p>
                  <p className="text-[#FFF8E1] font-bold text-sm">{skin.downloads || 0}</p>
                </div>
              </div>
              
              {skin.tags?.filter(t => !t.includes(':')).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skin.tags.filter(t => !t.includes(':')).map(t => (
                    <span key={t} className="px-3 py-1 rounded-md bg-[#F5C542]/10 border border-[#F5C542]/30 text-xs font-mono font-bold text-[#F5C542]">{t}</span>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#92400E]">
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
