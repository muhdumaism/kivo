import { useState } from "react";
import { Navbar } from "@/components/qiveo/Navbar";
import { Footer } from "@/pages/Home";
import { toast } from "sonner";
import { Rocket, Send, Sparkles } from "lucide-react";

export default function Pitch() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: "",
    studio: "",
    email: "",
    genre: "Sandbox",
    description: "",
    demoUrl: "",
    fundingNeeded: "No",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.studio || !form.email || !form.description) {
      toast.error("Please fill in all required fields!");
      return;
    }
    toast.success("[PITCH SUCCESS] Form transmitted successfully!");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-transparent text-[#E9D5FF]">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(139,92,246,0.3)]">
            <div className="w-16 h-16 bg-[#8B5CF6]/20 border-2 border-[#8B5CF6] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-[#8B5CF6]" />
            </div>
            <h1 className="font-heading text-3xl font-black uppercase mb-4">Pitch Received!</h1>
            <p className="text-sm text-[#E9D5FF]/70 leading-relaxed font-semibold mb-6">
              Thank you for pitching **{form.title}** by **{form.studio}** to Qiveo Games. 
              Our publisher vetting and spotlight team will review your game concept and get in touch at **{form.email}** within 7 working days.
            </p>
            <button 
              onClick={() => { setSubmitted(false); setForm({ title: "", studio: "", email: "", genre: "Sandbox", description: "", demoUrl: "", fundingNeeded: "No" }); }} 
              className="retro-btn-black px-6 py-2.5 text-xs font-extrabold uppercase font-heading"
            >
              Submit Another Pitch
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#E9D5FF]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="border-b-2 border-[#E9D5FF] pb-6 mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#8B5CF6] font-bold">// dev spotlight program</span>
          <h1 className="font-heading text-4xl lg:text-5xl font-black uppercase tracking-tight mt-2">Pitch Your Game</h1>
          <p className="text-[#E9D5FF]/60 mt-2 font-semibold">Get featured on Qiveo's homepage carousel, get publishing spotlight, or request funding support.</p>
        </div>

        {/* Pitch Form */}
        <form onSubmit={handleSubmit} className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Project / Game Title *</label>
              <input 
                type="text" 
                placeholder="Aether Quest"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold"
                required
              />
            </div>
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Developer / Studio Name *</label>
              <input 
                type="text" 
                placeholder="Voxel Forge Studios"
                value={form.studio}
                onChange={(e) => setForm({ ...form, studio: e.target.value })}
                className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Contact Email Address *</label>
              <input 
                type="email" 
                placeholder="devs@voxelforge.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold"
                required
              />
            </div>
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Game Genre</label>
              <select 
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold"
              >
                <option value="Sandbox">Sandbox / Voxel</option>
                <option value="RPG">Action RPG</option>
                <option value="Adventure">Adventure</option>
                <option value="Simulation">Simulation</option>
                <option value="Other">Other / Experimental</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Elevator Pitch & Game Concept *</label>
            <textarea 
              rows={4}
              placeholder="Tell us what makes your game unique, the core game loop, and why our players will love it..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">YouTube Trailer / Gameplay Demo URL</label>
              <input 
                type="url" 
                placeholder="https://youtube.com/watch?v=..."
                value={form.demoUrl}
                onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
                className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold"
              />
            </div>
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Requesting Publishing Funding?</label>
              <select 
                value={form.fundingNeeded}
                onChange={(e) => setForm({ ...form, fundingNeeded: e.target.value })}
                className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold"
              >
                <option value="No">No, just marketing & spotlight promotion</option>
                <option value="Yes">Yes, seeking prototype/completion funding support</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#E9D5FF] text-[#0A0A0C] border-2 border-[#E9D5FF] py-3.5 rounded-2xl font-heading font-black shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:bg-[#8B5CF6] hover:text-[#0A0A0C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase"
          >
            <Rocket className="w-5 h-5" />
            Submit Pitch
          </button>
        </form>
      </div>

      <Footer />
    </div>
  );
}
