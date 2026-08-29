import { useState } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { Box, Download, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { useMinecraftVersions } from '@/lib/minecraftVersions';
import { resolvePackFormat } from '@/lib/packFormatResolver';
import { createZip, downloadZip } from '@/lib/zipHelper';
import { toast } from 'sonner';

export default function CapePackBuilder() {
  const { getReleases, latest } = useMinecraftVersions();
  const releases = getReleases();
  
  const [selectedVersion, setSelectedVersion] = useState('');
  const [username, setUsername] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [replaceElytra, setReplaceElytra] = useState(true);

  const currentVersion = selectedVersion || latest?.release;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const generatePack = async () => {
    if (!imageFile) return toast.error("Please upload a cape image first.");
    if (!currentVersion) return toast.error("Please wait for versions to load.");
    if (!username.trim()) return toast.error("Please enter a username.");

    setIsGenerating(true);
    try {
      const zip = createZip();
      
      const mcmeta = resolvePackFormat(currentVersion, `Custom Cape for ${username}`);
      zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

      // Use uploaded image as pack icon
      zip.file("pack.png", imageFile);

      // OptiFine Cape Path
      const optifineFolder = zip.folder("assets").folder("minecraft").folder("optifine").folder("capes");
      optifineFolder.file(`${username.trim()}.png`, imageFile);

      // Elytra replacement
      if (replaceElytra) {
        const elytraFolder = zip.folder("assets").folder("minecraft").folder("textures").folder("entity");
        elytraFolder.file("elytra.png", imageFile);
      }

      await downloadZip(zip, `${username.trim()}_cape_pack.zip`);
      toast.success("Resource pack generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate resource pack.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171512] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#24201A] rounded-xl flex items-center justify-center">
              <Box className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Cape Pack Builder</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Create an OptiFine-compatible resource pack to show your custom cape in-game (requires OptiFine).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">1. Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase text-[#FFF8E1]/40 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your Minecraft Username"
                    className="w-full bg-[#171512] border border-[#92400E]/50 rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542]"
                  />
                  <p className="text-[#FFF8E1]/30 font-mono text-[10px] mt-2">OptiFine binds the cape to your exact username.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase text-[#FFF8E1]/40 mb-2">Target Version</label>
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
                
                <label className="flex items-center gap-2 text-[#FFF8E1] font-mono text-sm cursor-pointer pt-2">
                  <input type="checkbox" checked={replaceElytra} onChange={e => setReplaceElytra(e.target.checked)} className="accent-[#F5C542] w-4 h-4" />
                  Also replace Elytra texture with this cape
                </label>
              </div>
            </div>

          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 flex-1 flex flex-col">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">2. Upload Cape</h3>
              
              {!imageFile ? (
                <div 
                  onClick={() => document.getElementById('cape-upload').click()}
                  className="flex-1 border-2 border-dashed border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#F5C542] hover:bg-[#171512]/50 transition-all group p-8"
                >
                  <div className="w-16 h-16 bg-[#171512] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-[#F5C542]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#FFF8E1] font-bold mb-1">Click to browse or drag image</p>
                    <p className="text-[#FFF8E1]/40 font-mono text-xs">Standard cape sizes: 64x32</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 border border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center bg-[#171512] relative overflow-hidden group">
                  <img src={URL.createObjectURL(imageFile)} className="max-w-[200px] object-contain [image-rendering:pixelated]" alt="Cape Preview" />
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => document.getElementById('cape-upload').click()}
                      className="px-4 py-2 bg-[#F5C542] text-[#171512] rounded-lg font-bold flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" /> Change Cape
                    </button>
                  </div>
                </div>
              )}
              <input id="cape-upload" type="file" accept="image/png" className="hidden" onChange={handleFileUpload} />
            </div>

            <button
              onClick={generatePack}
              disabled={!imageFile || isGenerating || !username.trim()}
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
