import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Upload, Plus, Trash2, ShieldCheck, FileArchive, Image as ImageIcon } from "lucide-react";
import api, { API } from "@/lib/api";

export default function AdminClientConfig() {
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState("");
  const [modFile, setModFile] = useState(null);
  
  const [galleryFile, setGalleryFile] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [activeVersion, setActiveVersion] = useState(null);
  
  const modInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    loadGallery();
    loadActiveVersion();
  }, []);

  const loadActiveVersion = async () => {
    try {
      const res = await api.get("/client/active-version");
      setActiveVersion(res.data.version);
    } catch (err) {
      console.error(err);
    }
  };

  const loadGallery = async () => {
    try {
      const res = await api.get("/client/gallery");
      setGallery(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModUpload = async (e) => {
    e.preventDefault();
    if (!version || !modFile) return toast.error("Please provide a version number and a .jar file");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("version", version);
    formData.append("file", modFile);

    try {
      await api.post("/admin/client/version", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("New client version uploaded and set as active!");
      setVersion("");
      setModFile(null);
      if (modInputRef.current) modInputRef.current.value = "";
      loadActiveVersion();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    e.preventDefault();
    if (!galleryFile) return toast.error("Please select an image");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", galleryFile);

    try {
      await api.post("/admin/client/gallery", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Image added to gallery!");
      setGalleryFile(null);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      loadGallery();
    } catch (err) {
      toast.error("Gallery upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black font-heading text-[#FFF8E1]">Client Management</h1>
        <p className="text-[#FFF8E1]/60 mt-1">Manage Qiveo Client versions and the landing page gallery.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Mod Upload Section */}
        <div className="retro-card border-[#92400E]/30 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#92400E]/30 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#24201A] border border-[#92400E]/50 flex items-center justify-center text-[#F5C542]">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-[#FFF8E1]">Upload Mod Release</h2>
              <p className="text-xs text-[#FFF8E1]/50">This will immediately become the active download.</p>
            </div>
          </div>

          <form onSubmit={handleModUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#FFF8E1] mb-2">Version Name</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0.4-fabric"
                className="w-full retro-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#FFF8E1] mb-2">Mod File (.jar)</label>
              <input
                type="file"
                accept=".jar"
                onChange={(e) => setModFile(e.target.files[0])}
                ref={modInputRef}
                className="w-full text-sm text-[#FFF8E1]/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#F5C542] file:text-[#000000] hover:file:bg-[#FFD84D]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full retro-btn-black py-3 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {loading ? "Uploading..." : "Publish Release"}
            </button>
          </form>

          {activeVersion && (
            <div className="mt-6 p-4 rounded-xl bg-[#24201A] border border-[#F5C542]/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#FFF8E1]/50 font-bold uppercase tracking-wider mb-1">Currently Active</p>
                <p className="text-[#F5C542] font-mono font-bold">{activeVersion}</p>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#F5C542]" />
            </div>
          )}
        </div>

        {/* Gallery Upload Section */}
        <div className="retro-card border-[#92400E]/30 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#92400E]/30 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#24201A] border border-[#92400E]/50 flex items-center justify-center text-[#F5C542]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-[#FFF8E1]">Gallery Upload</h2>
              <p className="text-xs text-[#FFF8E1]/50">Add screenshots to the landing page.</p>
            </div>
          </div>

          <form onSubmit={handleGalleryUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#FFF8E1] mb-2">Screenshot Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setGalleryFile(e.target.files[0])}
                ref={galleryInputRef}
                className="w-full text-sm text-[#FFF8E1]/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#F5C542] file:text-[#000000] hover:file:bg-[#FFD84D]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full retro-btn-black py-3 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? "Uploading..." : "Add to Gallery"}
            </button>
          </form>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="retro-card border-[#92400E]/30 p-6">
        <h2 className="text-xl font-bold font-heading text-[#FFF8E1] mb-6">Current Gallery</h2>
        {gallery.length === 0 ? (
          <p className="text-center text-[#FFF8E1]/50 py-12 border-2 border-dashed border-[#92400E]/30 rounded-xl">No images in the gallery yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map(img => (
              <div key={img.id} className="relative group aspect-video rounded-xl overflow-hidden border border-[#92400E]/30">
                <img src={`${API.replace("/api", "")}${img.image_url}`} alt="Gallery item" className="w-full h-full object-cover" />
                {/* Note: Delete functionality omitted for brevity, but UI placeholder is here */}
                <div className="absolute inset-0 bg-[#000000]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
