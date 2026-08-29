import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { Smile, Search, Download, UploadCloud } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

// SVG overlays stored as data URLs
const OVERLAYS = [
  { id: 'none', label: 'None', src: null },
  { id: 'deal_with_it', label: 'Deal With It', src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="16" y="48" width="96" height="16" fill="black"/><rect x="24" y="64" width="24" height="8" fill="black"/><rect x="80" y="64" width="24" height="8" fill="black"/></svg>' },
  { id: 'crying', label: 'Crying', src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="16" y="80" width="16" height="48" fill="%2360A5FA"/><rect x="96" y="80" width="16" height="48" fill="%2360A5FA"/></svg>' },
  { id: 'thinking', label: 'Thinking', src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="104" cy="104" r="16" fill="%23FCD34D"/><circle cx="80" cy="88" r="8" fill="%23FCD34D"/><circle cx="64" cy="72" r="4" fill="%23FCD34D"/></svg>' },
  { id: 'angry', label: 'Angry', src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="M 16 48 L 48 64 L 16 64 Z" fill="red"/><path d="M 112 48 L 80 64 L 112 64 Z" fill="red"/></svg>' }
];

export default function CustomEmojis() {
  const [username, setUsername] = useState('');
  const [skinUrl, setSkinUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOverlay, setSelectedOverlay] = useState('none');
  
  const canvasRef = useRef(null);

  const fetchProfile = async (e) => {
    e?.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      const { data } = await api.get(`/minecraft/profile/${username.trim()}`);
      const texUrl = data.skin.url;
      const textureId = texUrl.split('/').pop();
      setSkinUrl(`${api.defaults.baseURL || '/api'}/minecraft/download/${textureId}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Player not found");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSkinUrl(URL.createObjectURL(file));
      setUsername('Custom_Skin');
    }
  };

  useEffect(() => {
    if (skinUrl && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);
        ctx.imageSmoothingEnabled = false;
        
        // Draw face base (x=8, y=8, w=8, h=8) -> 128x128
        ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 128, 128);
        // Draw face overlay (x=40, y=8, w=8, h=8) -> 128x128
        ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 128, 128);
        
        // Draw emoji overlay
        const overlay = OVERLAYS.find(o => o.id === selectedOverlay);
        if (overlay && overlay.src) {
          const oImg = new Image();
          oImg.onload = () => {
            ctx.drawImage(oImg, 0, 0, 128, 128);
          };
          oImg.src = overlay.src;
        }
      };
      img.src = skinUrl;
    }
  }, [skinUrl, selectedOverlay]);

  const downloadEmoji = () => {
    if (!skinUrl || !canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `emoji_${username || 'custom'}_${selectedOverlay}.png`;
    a.click();
    toast.success("Emoji downloaded!");
  };

  return (
    <div className="min-h-screen bg-[#171512] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#24201A] rounded-xl flex items-center justify-center">
              <Smile className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Custom Emojis</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Turn your Minecraft skin's face into Discord or Slack emojis with fun overlays.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">1. Load Skin</h3>
              <div className="space-y-4">
                <form onSubmit={fetchProfile} className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Username"
                    className="flex-1 bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542]"
                  />
                  <button type="submit" disabled={loading} className="px-4 bg-[#F5C542] text-[#171512] rounded-xl font-bold hover:bg-[#FFD84D]">
                    <Search className="w-5 h-5" />
                  </button>
                </form>
                <button
                  onClick={() => document.getElementById('skin-upload').click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#171512] border border-[#92400E]/50 text-[#FFF8E1] rounded-xl hover:bg-[#F5C542] hover:text-[#171512] transition-colors font-bold text-sm"
                >
                  <UploadCloud className="w-4 h-4" /> Upload Skin PNG
                </button>
                <input id="skin-upload" type="file" accept="image/png" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">2. Select Overlay</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {OVERLAYS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOverlay(o.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${selectedOverlay === o.id ? 'bg-[#F5C542] text-[#171512] border-[#F5C542]' : 'bg-[#171512] text-[#FFF8E1]/60 border-[#92400E]/30 hover:border-[#F5C542]/50 hover:text-[#FFF8E1]'}`}
                  >
                    <span className="font-bold font-mono text-sm">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-[#171512] border border-[#92400E]/50 rounded-3xl p-6 flex-1 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
              <div className="absolute inset-0 bg-[url('https://minecraft.wiki/images/Stone_Bricks.png')] opacity-10 bg-repeat"></div>
              
              {!skinUrl ? (
                <div className="text-center bg-[#24201A]/80 p-6 rounded-2xl border border-[#92400E] relative z-10">
                  <Smile className="w-16 h-16 text-[#FFF8E1]/20 mb-4 mx-auto" />
                  <p className="text-[#FFF8E1]/40 font-mono text-sm">Preview will appear here</p>
                </div>
              ) : (
                <div className="relative z-10">
                  <canvas ref={canvasRef} width={128} height={128} className="w-64 h-64 [image-rendering:pixelated] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform bg-[#24201A] border-4 border-[#92400E] rounded-2xl" />
                  <p className="text-[#FFF8E1]/40 font-mono text-[10px] mt-6 text-center">Output Size: 128x128 PNG</p>
                </div>
              )}
            </div>

            <button
              onClick={downloadEmoji}
              disabled={!skinUrl}
              className="w-full py-4 bg-[#F5C542] text-[#171512] rounded-2xl font-black text-lg hover:bg-[#FFD84D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Download className="w-6 h-6" /> Download Emoji
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
