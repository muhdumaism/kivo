import { useState } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { Palette, Download, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { useMinecraftVersions } from '@/lib/minecraftVersions';
import { resolvePackFormat } from '@/lib/packFormatResolver';
import { createZip, downloadZip } from '@/lib/zipHelper';
import { toast } from 'sonner';

const PAINTINGS = [
  { id: 'kebab', name: 'Kebab', blocks: '1x1' },
  { id: 'aztec', name: 'Aztec', blocks: '1x1' },
  { id: 'alban', name: 'Alban', blocks: '1x1' },
  { id: 'aztec2', name: 'Aztec2', blocks: '1x1' },
  { id: 'bomb', name: 'Bomb', blocks: '1x1' },
  { id: 'plant', name: 'Plant', blocks: '1x1' },
  { id: 'wasteland', name: 'Wasteland', blocks: '1x1' },
  { id: 'pool', name: 'Pool', blocks: '2x1' },
  { id: 'courbet', name: 'Courbet', blocks: '2x1' },
  { id: 'sea', name: 'Sea', blocks: '2x1' },
  { id: 'sunset', name: 'Sunset', blocks: '2x1' },
  { id: 'creebet', name: 'Creebet', blocks: '2x1' },
  { id: 'wanderer', name: 'Wanderer', blocks: '1x2' },
  { id: 'graham', name: 'Graham', blocks: '1x2' },
  { id: 'match', name: 'Match', blocks: '2x2' },
  { id: 'bust', name: 'Bust', blocks: '2x2' },
  { id: 'stage', name: 'Stage', blocks: '2x2' },
  { id: 'void', name: 'The Void', blocks: '2x2' },
  { id: 'skull_and_roses', name: 'Skull and Roses', blocks: '2x2' },
  { id: 'wither', name: 'Wither', blocks: '2x2' },
  { id: 'fighters', name: 'Fighters', blocks: '4x2' },
  { id: 'pointer', name: 'Pointer', blocks: '4x4' },
  { id: 'pigscene', name: 'Pigscene', blocks: '4x4' },
  { id: 'burning_skull', name: 'Burning Skull', blocks: '4x4' },
  { id: 'skeleton', name: 'Skeleton', blocks: '4x3' },
  { id: 'donkey_kong', name: 'Donkey Kong', blocks: '4x3' }
];

export default function CustomPaintings() {
  const { getReleases, latest } = useMinecraftVersions();
  const releases = getReleases();
  
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedPainting, setSelectedPainting] = useState('kebab');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Default to latest release
  const currentVersion = selectedVersion || latest?.release;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const generatePack = async () => {
    if (!imageFile) return toast.error("Please upload an image first.");
    if (!currentVersion) return toast.error("Please wait for versions to load.");

    setIsGenerating(true);
    try {
      const zip = createZip();
      
      // 1. Add pack.mcmeta
      const mcmeta = resolvePackFormat(currentVersion, `Custom ${selectedPainting} painting`);
      zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

      // 2. Add pack.png (use the uploaded image as the pack icon)
      zip.file("pack.png", imageFile);

      // 3. Add the painting texture
      // Modern versions (1.14+) use individual files in assets/minecraft/textures/painting/
      const folder = zip.folder("assets").folder("minecraft").folder("textures").folder("painting");
      folder.file(`${selectedPainting}.png`, imageFile);

      // 4. Download
      await downloadZip(zip, `${selectedPainting}_painting_pack.zip`);
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
              <Palette className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Custom Paintings</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Upload any image to replace a Minecraft painting. Generates a ready-to-use resource pack.
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
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">2. Select Painting</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {PAINTINGS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPainting(p.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${selectedPainting === p.id ? 'bg-[#F5C542] text-[#171512] border-[#F5C542]' : 'bg-[#171512] text-[#FFF8E1]/60 border-[#92400E]/30 hover:border-[#F5C542]/50 hover:text-[#FFF8E1]'}`}
                  >
                    <span className="font-bold font-mono text-sm">{p.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedPainting === p.id ? 'bg-[#171512]/20' : 'bg-[#24201A]'}`}>{p.blocks}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 flex-1 flex flex-col">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">3. Upload Image</h3>
              
              {!imageFile ? (
                <div 
                  onClick={() => document.getElementById('painting-upload').click()}
                  className="flex-1 border-2 border-dashed border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#F5C542] hover:bg-[#171512]/50 transition-all group p-8"
                >
                  <div className="w-16 h-16 bg-[#171512] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-[#F5C542]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#FFF8E1] font-bold mb-1">Click to browse or drag image</p>
                    <p className="text-[#FFF8E1]/40 font-mono text-xs">Supports PNG, JPG, JPEG</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative group w-full max-w-sm aspect-square bg-[#171512] rounded-2xl border border-[#92400E]/50 overflow-hidden flex items-center justify-center p-4">
                    <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain [image-rendering:pixelated]" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => document.getElementById('painting-upload').click()}
                        className="px-4 py-2 bg-[#F5C542] text-[#171512] rounded-lg font-bold flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" /> Change Image
                      </button>
                    </div>
                  </div>
                  <p className="text-[#FFF8E1]/60 font-mono text-xs mt-4">Note: The image will be squished/stretched in-game to match the {PAINTINGS.find(p => p.id === selectedPainting)?.blocks} aspect ratio.</p>
                </div>
              )}
              <input id="painting-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
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
