import { useState, useRef } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { GitMerge, Download, UploadCloud, FileArchive, Trash2, GripVertical } from 'lucide-react';
import { createZip, loadZip, downloadZip } from '@/lib/zipHelper';
import { toast } from 'sonner';

export default function TexturePackMerger() {
  const [packs, setPacks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Drag and drop sorting state
  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const validFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
    if (validFiles.length < files.length) {
      toast.error("Only .zip files are allowed.");
    }
    
    if (validFiles.length > 0) {
      setPacks(prev => [...prev, ...validFiles.map(f => ({ id: Math.random().toString(), file: f }))]);
    }
  };

  const removePack = (index) => {
    const newPacks = [...packs];
    newPacks.splice(index, 1);
    setPacks(newPacks);
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    
    const newPacks = [...packs];
    const item = newPacks.splice(draggedIdx, 1)[0];
    newPacks.splice(targetIdx, 0, item);
    setPacks(newPacks);
    setDraggedIdx(null);
  };

  const mergePacks = async () => {
    if (packs.length < 2) return toast.error("Please upload at least 2 resource packs to merge.");

    setIsGenerating(true);
    try {
      const mergedZip = createZip();
      
      // We will iterate from bottom to top (index 0 is highest priority? No, usually top is highest priority in Minecraft UI)
      // Wait, Minecraft resource pack list: Top pack overrides packs below it.
      // So packs[0] overrides packs[1].
      // To achieve this in JSZip, we should add files from bottom to top (packs[length-1] up to packs[0]),
      // so that packs[0] files are added last, overwriting earlier ones.
      
      let baseMcmeta = null;
      let baseIcon = null;

      const reversedPacks = [...packs].reverse();

      for (let i = 0; i < reversedPacks.length; i++) {
        const packObj = reversedPacks[i];
        const loadedZip = await loadZip(packObj.file);
        
        const files = Object.keys(loadedZip.files);
        for (const relativePath of files) {
          const zipEntry = loadedZip.files[relativePath];
          if (zipEntry.dir) continue;
          
          const content = await zipEntry.async("blob");
          
          if (relativePath === 'pack.mcmeta') {
            // Highest priority pack (last in the reversed list) gets its mcmeta used as base
            baseMcmeta = content;
          } else if (relativePath === 'pack.png') {
            baseIcon = content;
          } else {
            // Normal asset file
            mergedZip.file(relativePath, content);
          }
        }
      }

      // Restore mcmeta and icon from the highest priority pack
      if (baseMcmeta) {
        // We'll update the description to indicate it's merged
        try {
          const text = await baseMcmeta.text();
          const json = JSON.parse(text);
          json.pack.description = `[Merged] ${json.pack.description || ''}`;
          mergedZip.file('pack.mcmeta', JSON.stringify(json, null, 2));
        } catch (e) {
          mergedZip.file('pack.mcmeta', baseMcmeta);
        }
      } else {
        // Fallback
        mergedZip.file('pack.mcmeta', JSON.stringify({ pack: { pack_format: 15, description: "Merged Pack" } }, null, 2));
      }

      if (baseIcon) {
        mergedZip.file('pack.png', baseIcon);
      }

      await downloadZip(mergedZip, "merged_resource_pack.zip");
      toast.success("Packs merged successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to merge packs. Ensure they are valid ZIP files.");
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
              <GitMerge className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Texture Pack Merger</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Combine multiple resource packs into one. Arrange them in priority order, just like in-game!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">Upload Packs</h3>
              
              <div 
                onClick={() => document.getElementById('pack-upload').click()}
                className="w-full border-2 border-dashed border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#F5C542] hover:bg-[#171512]/50 transition-all group p-8"
              >
                <div className="w-16 h-16 bg-[#171512] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-[#F5C542]" />
                </div>
                <div className="text-center">
                  <p className="text-[#FFF8E1] font-bold mb-1">Click to add .zip files</p>
                  <p className="text-[#FFF8E1]/40 font-mono text-xs">You can select multiple files</p>
                </div>
              </div>
              <input id="pack-upload" type="file" accept=".zip" multiple className="hidden" onChange={handleFileUpload} />
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <p className="text-[#FFF8E1]/40 font-mono text-xs leading-relaxed">
                <strong className="text-[#F5C542]">How it works:</strong> The pack at the TOP of the list has the highest priority. If two packs modify the same texture, the texture from the higher pack will be kept.
              </p>
            </div>

          </div>

          <div className="lg:col-span-2 flex flex-col space-y-6">
            <div className="bg-[#171512] border border-[#92400E]/50 rounded-3xl p-6 flex-1 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://minecraft.wiki/images/Stone_Bricks.png')] opacity-5 bg-repeat"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 flex items-center gap-2">
                    <FileArchive className="w-4 h-4" /> Priority List
                  </h3>
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-[#24201A] rounded-full text-[#F5C542]">{packs.length} Pack(s)</span>
                </div>
                
                {packs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <FileArchive className="w-16 h-16 text-[#FFF8E1]/10 mb-4" />
                    <p className="text-[#FFF8E1]/40 font-mono text-sm">No packs uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                    {packs.map((pack, idx) => (
                      <div 
                        key={pack.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        className={`bg-[#24201A] border ${idx === 0 ? 'border-[#F5C542]' : 'border-[#92400E]/30'} rounded-xl p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing hover:bg-[#2A251D] transition-colors`}
                      >
                        <GripVertical className="w-5 h-5 text-[#FFF8E1]/20" />
                        <div className="w-10 h-10 bg-[#171512] rounded flex items-center justify-center border border-[#92400E]/30 shrink-0">
                          <FileArchive className="w-5 h-5 text-[#FFF8E1]/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[#FFF8E1] font-bold font-mono truncate text-sm">
                            {pack.file.name}
                          </h4>
                          <p className="text-[#FFF8E1]/40 font-mono text-[10px]">
                            {(pack.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {idx === 0 && <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5C542] bg-[#171512] px-2 py-1 rounded">Highest Priority</span>}
                          <button onClick={() => removePack(idx)} className="p-2 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={mergePacks}
              disabled={packs.length < 2 || isGenerating}
              className="w-full py-4 bg-[#F5C542] text-[#171512] rounded-2xl font-black text-lg hover:bg-[#FFD84D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#F5C542]/10"
            >
              {isGenerating ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <><GitMerge className="w-6 h-6" /> Merge & Download Pack</>
              )}
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
