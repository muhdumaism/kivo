import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { Sparkles, Download, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { useMinecraftVersions } from '@/lib/minecraftVersions';
import { resolvePackFormat } from '@/lib/packFormatResolver';
import { createZip, downloadZip } from '@/lib/zipHelper';
import { toast } from 'sonner';

export default function TotemGenerator() {
  const { getReleases, latest } = useMinecraftVersions();
  const releases = getReleases();
  
  const [selectedVersion, setSelectedVersion] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);

  const currentVersion = selectedVersion || latest?.release;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  useEffect(() => {
    if (imageFile && canvasRef.current) {
      const url = URL.createObjectURL(imageFile);
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, 16, 16);
        ctx.imageSmoothingEnabled = false; // Pixel art style
        // Draw image scaled to exactly 16x16
        ctx.drawImage(img, 0, 0, 16, 16);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }, [imageFile]);

  const generatePack = async () => {
    if (!imageFile) return toast.error("Please upload an image first.");
    if (!currentVersion) return toast.error("Please wait for versions to load.");
    if (!canvasRef.current) return toast.error("Canvas not ready.");

    setIsGenerating(true);
    try {
      const zip = createZip();
      
      const mcmeta = resolvePackFormat(currentVersion, "Custom Totem of Undying");
      zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

      // Use original image as pack icon
      zip.file("pack.png", imageFile);

      // Get 16x16 blob from canvas
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png'));
      
      const folder = zip.folder("assets").folder("minecraft").folder("textures").folder("item");
      folder.file("totem_of_undying.png", blob);

      await downloadZip(zip, "custom_totem_pack.zip");
      toast.success("Resource pack generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate resource pack.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#24201A] rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Totem Generator</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Upload any image to create a custom Totem of Undying. Your image will be automatically scaled to Minecraft's native 16x16 resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">1. Target Version</h3>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="w-full bg-[#171512] border border-[#92400E]/50 rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542]"
              >
                <option value="">Latest ({latest?.release})</option>
                {releases.slice(0, 30).map(v => (
                  <option key={v.id} value={v.id}>{v.id}</option>
                ))}
              </select>
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">2. Upload Image</h3>
              
              {!imageFile ? (
                <div 
                  onClick={() => document.getElementById('totem-upload').click()}
                  className="w-full h-48 border-2 border-dashed border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#F5C542] hover:bg-[#171512]/50 transition-all group"
                >
                  <div className="w-16 h-16 bg-[#171512] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-[#F5C542]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#FFF8E1] font-bold mb-1">Click to browse or drag image</p>
                    <p className="text-[#FFF8E1]/40 font-mono text-xs">A square aspect ratio is recommended.</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 border border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center bg-[#171512] relative overflow-hidden group">
                  <img src={URL.createObjectURL(imageFile)} className="w-32 h-32 object-contain" alt="Original" />
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => document.getElementById('totem-upload').click()}
                      className="px-4 py-2 bg-[#F5C542] text-[#171512] rounded-lg font-bold flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" /> Change Image
                    </button>
                  </div>
                </div>
              )}
              <input id="totem-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>

          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
              <h3 className="absolute top-6 left-6 text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50">In-Game Preview (16x16)</h3>
              
              <div className="w-64 h-64 bg-[#171512] border-4 border-[#92400E] rounded-2xl shadow-inner flex items-center justify-center relative mt-8 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://minecraft.wiki/images/Stone_Bricks.png')] opacity-10 bg-repeat"></div>
                {!imageFile ? (
                  <Sparkles className="w-16 h-16 text-[#FFF8E1]/10" />
                ) : (
                  <canvas 
                    ref={canvasRef} 
                    width={16} 
                    height={16} 
                    className="w-48 h-48 [image-rendering:pixelated] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform relative z-10" 
                  />
                )}
              </div>
            </div>

            <button
              onClick={generatePack}
              disabled={!imageFile || isGenerating}
              className="w-full py-4 bg-[#F5C542] text-[#171512] rounded-2xl font-black text-lg hover:bg-[#FFD84D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <><Download className="w-6 h-6" /> Download Resource Pack</>
              )}
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
