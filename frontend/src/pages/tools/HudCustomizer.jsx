import { useState } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { LayoutPanelTop, Download, UploadCloud } from 'lucide-react';
import { useMinecraftVersions } from '@/lib/minecraftVersions';
import { resolvePackFormat } from '@/lib/packFormatResolver';
import { createZip, downloadZip } from '@/lib/zipHelper';
import { toast } from 'sonner';

const HUD_ELEMENTS = [
  { id: 'crosshair', label: 'Crosshair', defaultSize: '15x15', path: 'hud/crosshair.png' },
  { id: 'hotbar', label: 'Hotbar', defaultSize: '182x22', path: 'hud/hotbar.png' },
  { id: 'hotbar_selection', label: 'Hotbar Selection', defaultSize: '24x24', path: 'hud/hotbar_selection.png' },
  { id: 'experience_bar_background', label: 'XP Bar (Empty)', defaultSize: '182x5', path: 'hud/experience_bar_background.png' },
  { id: 'experience_bar_progress', label: 'XP Bar (Full)', defaultSize: '182x5', path: 'hud/experience_bar_progress.png' },
  { id: 'boss_bar_01', label: 'Boss Bar (Empty)', defaultSize: '182x5', path: 'boss_bar/pink_background.png' }, // Example boss bar
];

export default function HudCustomizer() {
  const { getReleases, latest } = useMinecraftVersions();
  const releases = getReleases();
  
  const [selectedVersion, setSelectedVersion] = useState('');
  const [uploads, setUploads] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const currentVersion = selectedVersion || latest?.release;

  const handleFileUpload = (elementId, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploads(prev => ({
        ...prev,
        [elementId]: { file, preview: URL.createObjectURL(file) }
      }));
    }
  };

  const generatePack = async () => {
    if (Object.keys(uploads).length === 0) return toast.error("Please upload at least one HUD element.");
    if (!currentVersion) return toast.error("Please wait for versions to load.");

    setIsGenerating(true);
    try {
      const zip = createZip();
      
      const mcmeta = resolvePackFormat(currentVersion, "Custom HUD UI Pack");
      zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

      // Sprites folder (Modern UI format since 1.20.2)
      const spritesFolder = zip.folder("assets").folder("minecraft").folder("textures").folder("gui").folder("sprites");

      for (const el of HUD_ELEMENTS) {
        if (uploads[el.id]?.file) {
          const pathParts = el.path.split('/');
          const filename = pathParts.pop();
          let currentFolder = spritesFolder;
          for (const part of pathParts) {
            currentFolder = currentFolder.folder(part);
          }
          currentFolder.file(filename, uploads[el.id].file);
        }
      }

      await downloadZip(zip, "custom_hud_pack.zip");
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
              <LayoutPanelTop className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">HUD Customizer</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Replace individual UI elements to create your own custom HUD resource pack. Compatible with 1.20.2+ (sprite format).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">Target Version</h3>
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
              <p className="text-[#FFF8E1]/40 font-mono text-[10px] mt-4 leading-relaxed">
                Note: This tool uses the modern <code>gui/sprites</code> folder structure introduced in Minecraft 1.20.2. It will not work for older versions that use the monolithic <code>icons.png</code> or <code>widgets.png</code> atlases.
              </p>
            </div>

            <button
              onClick={generatePack}
              disabled={Object.keys(uploads).length === 0 || isGenerating}
              className="w-full py-4 bg-[#F5C542] text-[#171512] rounded-2xl font-black text-lg hover:bg-[#FFD84D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#F5C542]/10"
            >
              {isGenerating ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <><Download className="w-6 h-6" /> Download Pack</>
              )}
            </button>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 h-full">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-6">HUD Elements</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {HUD_ELEMENTS.map(el => (
                  <div key={el.id} className="bg-[#171512] border border-[#92400E]/30 rounded-xl p-4 flex flex-col items-center justify-center relative group">
                    <div className="absolute top-3 left-3 flex flex-col">
                      <span className="text-xs font-bold font-mono text-[#FFF8E1]">{el.label}</span>
                      <span className="text-[9px] font-mono text-[#FFF8E1]/40 uppercase tracking-widest">{el.defaultSize}</span>
                    </div>

                    <div className="mt-8 mb-4">
                      {uploads[el.id] ? (
                        <div className="h-16 flex items-center justify-center p-2 border border-dashed border-[#F5C542]/30 bg-black/20 rounded">
                          <img src={uploads[el.id].preview} className="max-w-full max-h-full object-contain [image-rendering:pixelated]" alt={el.label} />
                        </div>
                      ) : (
                        <div className="h-16 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-dashed border-[#92400E]/50 rounded-full flex items-center justify-center text-[#92400E]">
                            <LayoutPanelTop className="w-4 h-4 opacity-50" />
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => document.getElementById(`upload-${el.id}`).click()}
                      className={`px-4 py-2 w-full text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${uploads[el.id] ? 'bg-[#24201A] text-[#FFF8E1] border border-[#92400E]/50 hover:bg-[#171512]' : 'bg-[#F5C542] text-[#171512] hover:bg-[#FFD84D]'}`}
                    >
                      <UploadCloud className="w-4 h-4" /> {uploads[el.id] ? 'Replace' : 'Upload PNG'}
                    </button>
                    <input id={`upload-${el.id}`} type="file" accept="image/png" className="hidden" onChange={(e) => handleFileUpload(el.id, e)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
