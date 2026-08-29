import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { UserCircle, Search, Download, UploadCloud } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { SkinPreview3D } from '@/components/qiveo/SkinPreview3D';

export default function AvatarMaker() {
  const [username, setUsername] = useState('');
  const [skinUrl, setSkinUrl] = useState('');
  const [modelType, setModelType] = useState('classic');
  const [loading, setLoading] = useState(false);
  
  const [renderType, setRenderType] = useState('full'); // face, bust, full
  const [bgChoice, setBgChoice] = useState('transparent'); // transparent, color, gradient
  const [bgColor, setBgColor] = useState('#F5C542');
  const [bgGradient, setBgGradient] = useState('linear-gradient(135deg, #F5C542 0%, #92400E 100%)');
  const [outputSize, setOutputSize] = useState('512');
  
  const viewerRef = useRef(null);
  const faceCanvasRef = useRef(null);

  const fetchProfile = async (e) => {
    e?.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      const { data } = await api.get(`/minecraft/profile/${username.trim()}`);
      const texUrl = data.skin.url;
      const textureId = texUrl.split('/').pop();
      setSkinUrl(`${api.defaults.baseURL || '/api'}/minecraft/download/${textureId}`);
      setModelType(data.skin.model || 'classic');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Player not found");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSkinUrl(url);
    }
  };

  // Setup camera based on render type (if 3D)
  useEffect(() => {
    if (renderType === 'face') return; // Handled by 2D canvas
    
    const viewer = viewerRef.current?.getViewer();
    if (viewer && viewer.camera) {
      if (renderType === 'bust') {
        viewer.camera.position.set(0, 15, 40);
        viewer.camera.lookAt(0, 10, 0);
        viewer.zoom = 1.5;
      } else if (renderType === 'full') {
        viewer.camera.position.set(30, 20, 50);
        viewer.camera.lookAt(0, 0, 0);
        viewer.zoom = 0.8;
      }
    }
  }, [renderType, skinUrl]);

  // 2D Face render
  useEffect(() => {
    if (renderType === 'face' && skinUrl && faceCanvasRef.current) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const size = parseInt(outputSize);
        const ctx = faceCanvasRef.current.getContext('2d');
        faceCanvasRef.current.width = size;
        faceCanvasRef.current.height = size;
        
        ctx.clearRect(0, 0, size, size);
        ctx.imageSmoothingEnabled = false;
        
        // Draw background if not transparent
        if (bgChoice === 'color') {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, size, size);
        } else if (bgChoice === 'gradient') {
          const grad = ctx.createLinearGradient(0, 0, size, size);
          grad.addColorStop(0, '#F5C542');
          grad.addColorStop(1, '#92400E');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);
        }

        ctx.drawImage(img, 8, 8, 8, 8, 0, 0, size, size);
        ctx.drawImage(img, 40, 8, 8, 8, 0, 0, size, size);
      };
      img.src = skinUrl;
    }
  }, [renderType, skinUrl, bgChoice, bgColor, bgGradient, outputSize]);

  const exportAvatar = () => {
    if (!skinUrl) {
      toast.error("Please load a skin first");
      return;
    }
    
    let dataUrl = '';
    
    if (renderType === 'face' && faceCanvasRef.current) {
      dataUrl = faceCanvasRef.current.toDataURL('image/png');
    } else if (viewerRef.current) {
      // Force render for WebGL
      viewerRef.current.forceRender();
      
      // We need to composite the background and the 3D canvas
      const size = parseInt(outputSize);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (bgChoice === 'color') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
      } else if (bgChoice === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, '#F5C542');
        grad.addColorStop(1, '#92400E');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
      }
      
      const vCanvas = viewerRef.current.getCanvas();
      if (vCanvas) {
        ctx.drawImage(vCanvas, 0, 0, size, size);
        dataUrl = canvas.toDataURL('image/png');
      }
    }

    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `qiveo-avatar-${username || 'custom'}.png`;
      a.click();
      toast.success("Avatar exported!");
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-16 w-full">
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#24201A] rounded-xl flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Avatar Maker</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Create high-quality profile pictures from any Minecraft skin.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">1. Select Skin</h3>
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
                <div className="flex items-center gap-4 text-[#FFF8E1]/40 font-mono text-xs">
                  <div className="flex-1 h-px bg-[#92400E]/50"></div>
                  OR
                  <div className="flex-1 h-px bg-[#92400E]/50"></div>
                </div>
                <button
                  onClick={() => document.getElementById('skin-upload').click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#171512] border border-[#92400E]/50 text-[#FFF8E1] rounded-xl hover:bg-[#24201A] transition-colors"
                >
                  <UploadCloud className="w-5 h-5" />
                  Upload Skin File
                </button>
                <input id="skin-upload" type="file" accept=".png" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">2. Render Style</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase text-[#FFF8E1]/40 mb-2">Type</label>
                  <div className="flex bg-[#171512] rounded-xl p-1 border border-[#92400E]/50">
                    {['face', 'bust', 'full'].map(t => (
                      <button
                        key={t}
                        onClick={() => setRenderType(t)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors capitalize ${renderType === t ? 'bg-[#F5C542] text-[#171512]' : 'text-[#FFF8E1]/60 hover:text-[#FFF8E1]'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase text-[#FFF8E1]/40 mb-2">Background</label>
                  <select 
                    value={bgChoice} 
                    onChange={e => setBgChoice(e.target.value)}
                    className="w-full bg-[#171512] border border-[#92400E]/50 rounded-xl px-4 py-2.5 text-[#FFF8E1] font-mono text-sm focus:outline-none"
                  >
                    <option value="transparent">Transparent</option>
                    <option value="color">Solid Color</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>

                {bgChoice === 'color' && (
                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase text-[#FFF8E1]/40 mb-2">Color Hex</label>
                    <div className="flex gap-2">
                      <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                      <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 bg-[#171512] border border-[#92400E]/50 rounded-xl px-3 text-[#FFF8E1] font-mono text-sm" />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase text-[#FFF8E1]/40 mb-2">Output Size</label>
                  <select 
                    value={outputSize} 
                    onChange={e => setOutputSize(e.target.value)}
                    className="w-full bg-[#171512] border border-[#92400E]/50 rounded-xl px-4 py-2.5 text-[#FFF8E1] font-mono text-sm focus:outline-none"
                  >
                    <option value="256">256 x 256</option>
                    <option value="512">512 x 512</option>
                    <option value="1024">1024 x 1024</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={exportAvatar}
              disabled={!skinUrl}
              className="w-full py-4 bg-[#F5C542] text-[#171512] rounded-2xl font-black text-lg hover:bg-[#FFD84D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Download className="w-6 h-6" /> Export PNG
            </button>
            
          </div>

          {/* Preview */}
          <div className="lg:col-span-7">
            <div className="bg-[#171512] border border-[#92400E]/50 rounded-3xl p-6 h-full min-h-[500px] flex items-center justify-center relative overflow-hidden"
                 style={{
                   background: bgChoice === 'color' ? bgColor : bgChoice === 'gradient' ? bgGradient : 'repeating-conic-gradient(#24201A 0% 25%, transparent 0% 50%) 50% / 20px 20px'
                 }}
            >
              {!skinUrl ? (
                <div className="text-center bg-[#171512]/80 p-6 rounded-2xl border border-[#92400E]">
                  <UserCircle className="w-16 h-16 text-[#FFF8E1]/20 mb-4 mx-auto" />
                  <p className="text-[#FFF8E1]/40 font-mono text-sm">Preview will appear here</p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center drop-shadow-2xl">
                  {renderType === 'face' ? (
                    <canvas ref={faceCanvasRef} className="max-w-full max-h-[400px] object-contain [image-rendering:pixelated]" />
                  ) : (
                    <SkinPreview3D 
                      ref={viewerRef}
                      skinUrl={skinUrl}
                      model={modelType}
                      width={parseInt(outputSize)}
                      height={parseInt(outputSize)}
                      controls={true}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}
