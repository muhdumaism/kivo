import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { Skull, Search, Copy, Check } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function PlayerHeads() {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [versionType, setVersionType] = useState('modern'); // 'modern' (1.20.5+) or 'legacy' (1.13 - 1.20.4)
  const [copied, setCopied] = useState(false);
  
  const canvasRef = useRef(null);

  const fetchProfile = async (e) => {
    e?.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setProfile(null);
    try {
      const { data } = await api.get(`/minecraft/profile/${username.trim()}`);
      setProfile(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Player not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.skin?.url && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        // Clear
        ctx.clearRect(0, 0, 128, 128);
        // Disable smoothing for pixel art
        ctx.imageSmoothingEnabled = false;
        
        // Base head (x=8, y=8, w=8, h=8 in skin layout)
        ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 128, 128);
        // Head overlay (x=40, y=8, w=8, h=8)
        ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 128, 128);
      };
      // We proxy the skin URL through our backend if it's from textures.minecraft.net to avoid CORS issues
      // Or just load it directly if CORS allows. textures.minecraft.net does not send CORS.
      // We can use a data URL if we base64 encoded it on the backend, but we just have the URL.
      // Wait, to do a 2D crop on client, we need CORS.
      // Our backend has a proxy: /api/minecraft/download/{texture_id}
      const texUrl = profile.skin.url;
      const textureId = texUrl.split('/').pop();
      img.src = `${api.defaults.baseURL || '/api'}/minecraft/download/${textureId}`;
    }
  }, [profile]);

  const getCommand = () => {
    if (!profile) return '';
    if (versionType === 'modern') {
      // 1.20.5+ Component format
      return `/give @s minecraft:player_head[profile="${profile.username}"] 1`;
    } else {
      // 1.13 - 1.20.4 NBT format
      return `/give @s minecraft:player_head{SkullOwner:"${profile.username}"} 1`;
    }
  };

  const copyCommand = () => {
    const cmd = getCommand();
    if (cmd) {
      navigator.clipboard.writeText(cmd);
      setCopied(true);
      toast.success("Command copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#171512] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#24201A] rounded-xl flex items-center justify-center">
              <Skull className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Player Heads</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Generate commands to give yourself the custom head of any Minecraft player.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 md:p-8">
              <form onSubmit={fetchProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Username</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Notch"
                      className="flex-1 bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={loading || !username.trim()}
                      className="px-6 bg-[#F5C542] text-[#171512] rounded-xl font-bold hover:bg-[#FFD84D] disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <Search className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-[#171512] border border-[#92400E]/50 rounded-3xl p-6">
              <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-3">Target Version</label>
              <div className="flex bg-[#24201A] rounded-xl p-1 border border-[#92400E]">
                <button
                  onClick={() => setVersionType('modern')}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${versionType === 'modern' ? 'bg-[#F5C542] text-[#171512]' : 'text-[#FFF8E1]/60 hover:text-[#FFF8E1]'}`}
                >
                  Modern (1.20.5+)
                </button>
                <button
                  onClick={() => setVersionType('legacy')}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${versionType === 'legacy' ? 'bg-[#F5C542] text-[#171512]' : 'text-[#FFF8E1]/60 hover:text-[#FFF8E1]'}`}
                >
                  Legacy (1.13+)
                </button>
              </div>
              <p className="text-[#FFF8E1]/40 font-mono text-xs mt-4">
                {versionType === 'modern' 
                  ? "Uses the new component system: minecraft:player_head[profile=...]" 
                  : "Uses legacy NBT tags: minecraft:player_head{SkullOwner: ...}"}
              </p>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
            {!profile ? (
              <div className="text-[#FFF8E1]/30 flex flex-col items-center">
                <Skull className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-mono text-sm">Enter a username to generate head</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 bg-[#171512] border-4 border-[#92400E] rounded-xl shadow-2xl overflow-hidden relative">
                    <canvas ref={canvasRef} width={128} height={128} className="w-full h-full [image-rendering:pixelated]" />
                  </div>
                </div>
                
                <h3 className="text-xl font-heading font-black text-[#FFF8E1] mb-6">{profile.username}</h3>
                
                <div className="w-full text-left">
                  <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Summon Command</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getCommand()}
                      className="flex-1 bg-[#171512] border border-[#92400E]/50 rounded-xl px-4 py-3 text-[#F5C542] font-mono text-sm focus:outline-none"
                    />
                    <button
                      onClick={copyCommand}
                      className="px-4 bg-[#171512] border border-[#92400E]/50 text-[#FFF8E1] rounded-xl hover:bg-[#F5C542] hover:text-[#171512] transition-colors flex items-center justify-center"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
