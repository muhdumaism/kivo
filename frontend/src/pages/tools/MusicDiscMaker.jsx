import { useState } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { Disc3, Download, UploadCloud, Music } from 'lucide-react';
import { useMinecraftVersions } from '@/lib/minecraftVersions';
import { resolvePackFormat } from '@/lib/packFormatResolver';
import { createZip, downloadZip } from '@/lib/zipHelper';
import { toast } from 'sonner';

const MUSIC_DISCS = [
  { id: '13', name: '13', color: '#FCD34D' },
  { id: 'cat', name: 'cat', color: '#34D399' },
  { id: 'blocks', name: 'blocks', color: '#F87171' },
  { id: 'chirp', name: 'chirp', color: '#60A5FA' },
  { id: 'far', name: 'far', color: '#A78BFA' },
  { id: 'mall', name: 'mall', color: '#C084FC' },
  { id: 'mellohi', name: 'mellohi', color: '#F472B6' },
  { id: 'stal', name: 'stal', color: '#374151' },
  { id: 'strad', name: 'strad', color: '#FFFFFF' },
  { id: 'ward', name: 'ward', color: '#10B981' },
  { id: '11', name: '11', color: '#1F2937' },
  { id: 'wait', name: 'wait', color: '#6EE7B7' },
  { id: 'pigstep', name: 'Pigstep', color: '#FCA5A5' },
  { id: 'otherside', name: 'otherside', color: '#93C5FD' },
  { id: '5', name: '5', color: '#64748B' },
  { id: 'relic', name: 'relic', color: '#FDE047' },
  { id: 'creator', name: 'Creator', color: '#D8B4FE' },
  { id: 'creator_music_box', name: 'Creator (Music Box)', color: '#C4B5FD' },
  { id: 'precipice', name: 'Precipice', color: '#99F6E4' }
];

export default function MusicDiscMaker() {
  const { getReleases, latest } = useMinecraftVersions();
  const releases = getReleases();
  
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedDisc, setSelectedDisc] = useState('pigstep');
  const [audioFile, setAudioFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentVersion = selectedVersion || latest?.release;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.ogg')) {
        toast.error("Minecraft requires .ogg format for sounds. Please convert your file to .ogg first.");
        return;
      }
      setAudioFile(file);
    }
  };

  const generatePack = async () => {
    if (!audioFile) return toast.error("Please upload an .ogg audio file first.");
    if (!currentVersion) return toast.error("Please wait for versions to load.");

    setIsGenerating(true);
    try {
      const zip = createZip();
      
      const mcmeta = resolvePackFormat(currentVersion, `Custom ${selectedDisc} Music Disc`);
      zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

      const folder = zip.folder("assets").folder("minecraft").folder("sounds").folder("records");
      folder.file(`${selectedDisc}.ogg`, audioFile);

      await downloadZip(zip, `${selectedDisc}_disc_pack.zip`);
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
              <Disc3 className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Music Disc Maker</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Replace any Minecraft music disc with your own custom audio track.
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
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">2. Select Music Disc to Replace</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {MUSIC_DISCS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDisc(d.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${selectedDisc === d.id ? 'bg-[#F5C542] text-[#171512] border-[#F5C542]' : 'bg-[#171512] text-[#FFF8E1]/60 border-[#92400E]/30 hover:border-[#F5C542]/50 hover:text-[#FFF8E1]'}`}
                  >
                    <Disc3 className={`w-8 h-8 ${selectedDisc === d.id ? 'text-[#171512]' : 'text-white'}`} style={{ color: selectedDisc === d.id ? '#171512' : d.color }} />
                    <span className="font-bold font-mono text-[10px] uppercase truncate w-full text-center">{d.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 flex-1 flex flex-col">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">3. Upload Audio</h3>
              
              {!audioFile ? (
                <div 
                  onClick={() => document.getElementById('audio-upload').click()}
                  className="flex-1 border-2 border-dashed border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#F5C542] hover:bg-[#171512]/50 transition-all group p-8"
                >
                  <div className="w-16 h-16 bg-[#171512] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-[#F5C542]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#FFF8E1] font-bold mb-1">Click to browse or drag audio</p>
                    <p className="text-[#FFF8E1]/40 font-mono text-xs mb-2">Only .OGG format is supported by Minecraft</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 border border-[#92400E]/50 rounded-2xl flex flex-col items-center justify-center bg-[#171512] p-8 text-center relative overflow-hidden group">
                  <div className="w-20 h-20 bg-[#24201A] rounded-full flex items-center justify-center mb-4 border border-[#F5C542]/30">
                    <Music className="w-10 h-10 text-[#F5C542]" />
                  </div>
                  <h4 className="text-[#FFF8E1] font-bold font-mono truncate max-w-[250px]">{audioFile.name}</h4>
                  <p className="text-[#FFF8E1]/40 font-mono text-xs mt-1">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => document.getElementById('audio-upload').click()}
                      className="px-4 py-2 bg-[#F5C542] text-[#171512] rounded-lg font-bold flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" /> Change File
                    </button>
                  </div>
                </div>
              )}
              <input id="audio-upload" type="file" accept=".ogg,audio/ogg" className="hidden" onChange={handleFileUpload} />
            </div>

            <button
              onClick={generatePack}
              disabled={!audioFile || isGenerating}
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
