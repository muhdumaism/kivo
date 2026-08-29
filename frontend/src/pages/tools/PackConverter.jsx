import { useState } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { FileArchive, Download, UploadCloud, ArrowRightLeft } from 'lucide-react';
import { useMinecraftVersions } from '@/lib/minecraftVersions';
import { resolvePackFormat } from '@/lib/packFormatResolver';
import { loadZip, downloadZip } from '@/lib/zipHelper';
import { toast } from 'sonner';

export default function PackConverter() {
  const { getReleases, latest } = useMinecraftVersions();
  const releases = getReleases();
  
  const [selectedVersion, setSelectedVersion] = useState('');
  const [packFile, setPackFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentVersion = selectedVersion || latest?.release;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        return toast.error("Please upload a .zip file.");
      }
      setPackFile(file);
    }
  };

  const convertPack = async () => {
    if (!packFile) return toast.error("Please upload a resource pack.");
    if (!currentVersion) return toast.error("Please wait for versions to load.");

    setIsGenerating(true);
    try {
      const zip = await loadZip(packFile);
      
      // Update pack.mcmeta
      const mcmetaContent = resolvePackFormat(currentVersion, "Converted Pack");
      
      // Try to preserve original description if it exists
      try {
        const originalMcmetaFile = zip.file("pack.mcmeta");
        if (originalMcmetaFile) {
          const originalText = await originalMcmetaFile.async("string");
          const originalJson = JSON.parse(originalText);
          if (originalJson.pack && originalJson.pack.description) {
            mcmetaContent.pack.description = `[${currentVersion}] ` + originalJson.pack.description;
          }
        }
      } catch (e) {
        console.log("Could not parse original pack.mcmeta, using default description");
      }

      zip.file("pack.mcmeta", JSON.stringify(mcmetaContent, null, 2));

      await downloadZip(zip, packFile.name.replace('.zip', `_for_${currentVersion}.zip`));
      toast.success("Pack converted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to convert pack. Is it a valid ZIP?");
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
              <FileArchive className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Pack Converter</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Upgrade or downgrade resource packs to work with different Minecraft versions without warnings.
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
              <p className="text-[#FFF8E1]/40 font-mono text-[10px] mt-4 leading-relaxed">
                This tool safely updates the <code>pack_format</code> in your pack's meta file to match the target version. Note that it does not rename individual texture files (like 1.13 to 1.14 changes).
              </p>
            </div>

          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 flex-1 flex flex-col">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">2. Upload Pack</h3>
              
              {!packFile ? (
                <div 
                  onClick={() => document.getElementById('pack-upload').click()}
                  className="flex-1 border-2 border-dashed border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#F5C542] hover:bg-[#171512]/50 transition-all group p-8"
                >
                  <div className="w-16 h-16 bg-[#171512] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-[#F5C542]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#FFF8E1] font-bold mb-1">Click to browse or drag .zip</p>
                    <p className="text-[#FFF8E1]/40 font-mono text-xs">Standard Java Edition resource packs</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 border border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center bg-[#171512] p-8 text-center relative overflow-hidden group">
                  <div className="w-20 h-20 bg-[#24201A] rounded-full flex items-center justify-center mb-4 border border-[#F5C542]/30">
                    <FileArchive className="w-10 h-10 text-[#F5C542]" />
                  </div>
                  <h4 className="text-[#FFF8E1] font-bold font-mono truncate max-w-[250px]">{packFile.name}</h4>
                  <p className="text-[#FFF8E1]/40 font-mono text-xs mt-1">{(packFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => document.getElementById('pack-upload').click()}
                      className="px-4 py-2 bg-[#F5C542] text-[#171512] rounded-lg font-bold flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" /> Change Pack
                    </button>
                  </div>
                </div>
              )}
              <input id="pack-upload" type="file" accept=".zip" className="hidden" onChange={handleFileUpload} />
            </div>

            <button
              onClick={convertPack}
              disabled={!packFile || isGenerating}
              className="w-full py-4 bg-[#F5C542] text-[#171512] rounded-2xl font-black text-lg hover:bg-[#FFD84D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#F5C542]/10"
            >
              {isGenerating ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <><ArrowRightLeft className="w-6 h-6" /> Convert & Download</>
              )}
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
