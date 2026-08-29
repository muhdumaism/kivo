import { useState } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { Package, Download, UploadCloud, Trash2, Edit2 } from 'lucide-react';
import { createZip, downloadZip } from '@/lib/zipHelper';
import { toast } from 'sonner';

// Simple UUID v4 generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function SkinPackMaker() {
  const [packName, setPackName] = useState('My Custom Skin Pack');
  const [skins, setSkins] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const validFiles = files.filter(f => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.png'));
    if (validFiles.length < files.length) {
      toast.error("Only image files (.png) are allowed.");
    }
    
    if (validFiles.length > 0) {
      const newSkins = validFiles.map((file, i) => ({
        id: uuidv4(),
        file,
        preview: URL.createObjectURL(file),
        name: `Skin ${skins.length + i + 1}`
      }));
      setSkins(prev => [...prev, ...newSkins]);
    }
  };

  const removeSkin = (index) => {
    const newSkins = [...skins];
    URL.revokeObjectURL(newSkins[index].preview);
    newSkins.splice(index, 1);
    setSkins(newSkins);
  };

  const updateSkinName = (index, newName) => {
    const newSkins = [...skins];
    newSkins[index].name = newName;
    setSkins(newSkins);
  };

  const generatePack = async () => {
    if (skins.length === 0) return toast.error("Please add at least one skin.");
    if (!packName.trim()) return toast.error("Please provide a pack name.");

    setIsGenerating(true);
    try {
      const zip = createZip();
      
      const headerUuid = uuidv4();
      const moduleUuid = uuidv4();

      // 1. Generate manifest.json
      const manifest = {
        format_version: 1,
        header: {
          name: packName,
          uuid: headerUuid,
          version: [1, 0, 0]
        },
        modules: [
          {
            type: "skin_pack",
            uuid: moduleUuid,
            version: [1, 0, 0]
          }
        ]
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      // 2. Generate skins.json
      const skinsJson = {
        skins: skins.map((skin, idx) => ({
          localization_name: skin.name.replace(/[^a-zA-Z0-9]/g, ''),
          geometry: "geometry.humanoid.custom",
          texture: `${idx}.png`,
          type: "free"
        })),
        serialize_name: packName.replace(/[^a-zA-Z0-9]/g, ''),
        localization_name: packName.replace(/[^a-zA-Z0-9]/g, '')
      };
      zip.file("skins.json", JSON.stringify(skinsJson, null, 2));

      // 3. Generate texts/en_US.lang
      let langContent = `skinpack.${skinsJson.localization_name}=${packName}\n`;
      skins.forEach((skin) => {
        langContent += `skin.${skinsJson.localization_name}.${skin.name.replace(/[^a-zA-Z0-9]/g, '')}=${skin.name}\n`;
      });
      zip.folder("texts").file("en_US.lang", langContent);

      // 4. Add skin files
      skins.forEach((skin, idx) => {
        zip.file(`${idx}.png`, skin.file);
      });

      // Download as .mcpack
      const safeFilename = packName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await downloadZip(zip, `${safeFilename}.mcpack`);
      toast.success("Skin pack generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate skin pack.");
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
              <Package className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Bedrock Skin Pack Maker</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Bundle multiple custom skins into a single <code>.mcpack</code> file for Minecraft Bedrock Edition.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">Pack Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase text-[#FFF8E1]/40 mb-2">Pack Name</label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    className="w-full bg-[#171512] border border-[#92400E]/50 rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">Add Skins</h3>
              <div 
                onClick={() => document.getElementById('skin-upload').click()}
                className="w-full border-2 border-dashed border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#F5C542] hover:bg-[#171512]/50 transition-all group p-8"
              >
                <div className="w-16 h-16 bg-[#171512] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-[#F5C542]" />
                </div>
                <div className="text-center">
                  <p className="text-[#FFF8E1] font-bold mb-1">Click to add .png files</p>
                  <p className="text-[#FFF8E1]/40 font-mono text-xs">You can select multiple files</p>
                </div>
              </div>
              <input id="skin-upload" type="file" accept="image/png" multiple className="hidden" onChange={handleFileUpload} />
            </div>

          </div>

          <div className="lg:col-span-2 flex flex-col space-y-6">
            <div className="bg-[#171512] border border-[#92400E]/50 rounded-3xl p-6 flex-1 shadow-inner relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-[url('https://minecraft.wiki/images/Stone_Bricks.png')] opacity-5 bg-repeat"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50">Skins in Pack</h3>
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-[#24201A] rounded-full text-[#F5C542]">{skins.length} / 50</span>
                </div>
                
                {skins.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Package className="w-16 h-16 text-[#FFF8E1]/10 mb-4" />
                    <p className="text-[#FFF8E1]/40 font-mono text-sm">No skins added yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[500px] content-start">
                    {skins.map((skin, idx) => (
                      <div key={skin.id} className="bg-[#24201A] border border-[#92400E]/30 rounded-xl p-3 flex gap-4 items-center group">
                        <div className="w-16 h-16 bg-[#171512] rounded-lg border border-[#92400E]/30 flex items-center justify-center shrink-0">
                          <img src={skin.preview} className="max-w-full max-h-full object-contain [image-rendering:pixelated]" alt={skin.name} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1">
                            <input 
                              type="text" 
                              value={skin.name}
                              onChange={(e) => updateSkinName(idx, e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-[#F5C542] text-[#FFF8E1] font-bold text-sm focus:outline-none px-1"
                            />
                            <Edit2 className="w-3 h-3 text-[#FFF8E1]/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                          <p className="text-[#FFF8E1]/40 font-mono text-[10px] px-1 truncate">{skin.file.name}</p>
                        </div>
                        <button onClick={() => removeSkin(idx)} className="p-2 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={generatePack}
              disabled={skins.length === 0 || isGenerating}
              className="w-full py-4 bg-[#F5C542] text-[#171512] rounded-2xl font-black text-lg hover:bg-[#FFD84D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#F5C542]/10"
            >
              {isGenerating ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <><Download className="w-6 h-6" /> Export .MCPACK</>
              )}
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
