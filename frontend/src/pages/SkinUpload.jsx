import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';
import { UploadCloud, Check, X, RefreshCw } from 'lucide-react';
import { SkinViewer } from 'skinview3d';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';

export default function SkinUpload() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [drag, setDrag] = useState(false);
  
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [skinModel, setSkinModel] = useState('classic');
  const [visibility, setVisibility] = useState('public');
  
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  
  const viewerRef = useRef(null);
  const skinViewerInstance = useRef(null);

  useEffect(() => {
    if (previewUrl && viewerRef.current && !skinViewerInstance.current) {
      skinViewerInstance.current = new SkinViewer({
        canvas: viewerRef.current,
        width: 300,
        height: 400,
        skin: previewUrl,
        model: skinModel
      });
      skinViewerInstance.current.autoRotate = true;
      skinViewerInstance.current.autoRotateSpeed = 0.5;
    } else if (skinViewerInstance.current && previewUrl) {
      skinViewerInstance.current.loadSkin(previewUrl, skinModel);
    }
  }, [previewUrl, skinModel]);

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.png')) {
      toast.error('Only PNG skins are supported');
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const publish = async () => {
    if (!file || !title.trim()) {
      toast.error('File and Title are required');
      return;
    }
    
    setBusy(true);
    try {
      // Create thumbnail from 3D canvas
      let thumbBlob = null;
      if (viewerRef.current && skinViewerInstance.current) {
        // Force render immediately before capture to avoid blank WebGL canvas (preserveDrawingBuffer issue)
        skinViewerInstance.current.renderer.render(skinViewerInstance.current.scene, skinViewerInstance.current.camera);
        const dataUrl = viewerRef.current.toDataURL('image/png');
        thumbBlob = await (await fetch(dataUrl)).blob();
      } else {
        thumbBlob = file; // Fallback
      }

      const form = new FormData();
      form.append('skin', file);
      form.append('thumbnail', thumbBlob, 'thumbnail.png');
      form.append('title', title);
      form.append('summary', summary);
      
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      form.append('tags', JSON.stringify(tagsArray));
      form.append('skin_model', skinModel);
      form.append('visibility', visibility);

      const { data } = await api.post('/creator/skins/publish', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Skin published successfully!');
      nav(`/skins`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to publish skin');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
      <h1 className="text-3xl font-heading font-black text-[#FFF8E1] mb-2 uppercase">Publish a Skin</h1>
      <p className="text-[#FFF8E1]/60 font-mono text-sm mb-8">Upload your masterpiece and share it with the Qiveo community.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {!file ? (
            <div 
              className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${drag ? 'border-[#F5C542] bg-[#F5C542]/10' : 'border-[#92400E] bg-[#171512] hover:bg-[#F5C542]/5'}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('skin-upload').click()}
            >
              <UploadCloud className="w-12 h-12 text-[#FFF8E1]/50 mb-4" />
              <p className="text-[#FFF8E1] font-heading font-bold mb-1">Drag and drop your skin</p>
              <p className="text-[#FFF8E1]/50 font-mono text-xs mb-4">or click to browse (64x64 or 64x32 PNG)</p>
              <button className="px-6 py-2 rounded-full bg-[#24201A] border border-[#92400E] text-[#FFF8E1] text-sm font-bold hover:bg-[#92400E]">Browse Files</button>
              <input id="skin-upload" type="file" accept=".png" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="bg-[#171512] border-2 border-[#92400E] rounded-3xl p-6 flex flex-col items-center">
              <div className="bg-[#24201A] rounded-xl overflow-hidden mb-6 flex justify-center w-full">
                <canvas ref={viewerRef} className="max-w-full" />
              </div>
              
              <div className="w-full flex justify-between items-center bg-[#24201A] p-3 rounded-xl border border-[#92400E]">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-bold text-[#FFF8E1] truncate max-w-[150px]">{file.name}</p>
                    <p className="text-xs font-mono text-[#FFF8E1]/50">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-5">
          <div className="bg-[#171512] border border-[#92400E] rounded-3xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Awesome Skin" className="w-full bg-[#24201A] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors" />
            </div>
            
            <div>
              <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Summary</label>
              <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder="A short description..." className="w-full bg-[#24201A] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Model Type</label>
                <select value={skinModel} onChange={e => setSkinModel(e.target.value)} className="w-full bg-[#24201A] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors">
                  <option value="classic">Classic (4px arms)</option>
                  <option value="slim">Slim (3px arms)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Visibility</label>
                <select value={visibility} onChange={e => setVisibility(e.target.value)} className="w-full bg-[#24201A] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors">
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Tags</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="boy, blue, pvp" className="w-full bg-[#24201A] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors" />
              <p className="text-[#FFF8E1]/40 text-xs mt-1 font-mono">Comma separated</p>
            </div>
          </div>
          
          <button 
            onClick={publish} 
            disabled={!file || busy}
            className="w-full py-4 rounded-2xl bg-[#F5C542] text-[#171512] font-black text-lg hover:bg-[#FFD84D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {busy ? 'Publishing...' : 'Publish Skin'}
          </button>
        </div>
      </div>
    </div>
    <Footer />
  </div>
  );
}
