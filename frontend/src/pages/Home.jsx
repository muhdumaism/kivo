import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Navbar } from "@/components/qiveo/Navbar";
import { Footer } from "@/components/qiveo/Footer";
import { Reveal } from "@/components/qiveo/Reveal";
import { FeaturesSection } from "@/components/qiveo/FeaturesSection";
import { FAQSection } from "@/components/qiveo/FAQSection";
import { Search, ArrowRight, Download } from "lucide-react";
import { toast } from "sonner";
import { useWebSocket } from "@/context/WebSocketContext";

import { getCategoryName } from "@/content/games";
const CHIPS = ["All Games", "Minecraft", "Roblox", "Hytale", "Discord"];

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [picks, setPicks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All Games");
  const { addListener } = useWebSocket();

  const load = () => {
    api.get("/mods", { params: { sort: "trending", limit: 30 } }).then((r) => setTrending(r.data));
    api.get("/mods", { params: { staff_pick: true, limit: 4 } }).then((r) => setPicks(r.data));
  };

  useEffect(() => {
    load();
  }, []);

  // Listen for real-time downloads updating count
  useEffect(() => {
    if (!addListener) return;
    const unbind = addListener("downloads_updated", (data) => {
      setTrending((prev) => 
        prev.map((item) => item.id === data.mod_id ? { ...item, downloads: data.downloads } : item)
      );
      setPicks((prev) => 
        prev.map((item) => item.id === data.mod_id ? { ...item, downloads: data.downloads } : item)
      );
    });
    return unbind;
  }, [addListener]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  // Filter items in the grid based on search query and category chips
  const filteredTrending = trending.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeChip === "All Games") return matchesSearch;
    return matchesSearch && item.game_slug === activeChip.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        
        {/* Title row */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-[#92400E]">
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-[#FFF8E1] uppercase tracking-tight">
              Browse All Games
            </h1>
            
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xs">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#24201A] border-2 border-[#92400E] rounded-full pl-4 pr-10 py-2.5 text-sm text-[#FFF8E1] placeholder:text-[#FFF8E1]/50 focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all font-semibold"
              />
              <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FFF8E1] hover:scale-110 transition-transform">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        </Reveal>

        {/* Filters row */}
        <Reveal delay={100}>
          <div className="flex flex-wrap gap-3 mt-8 items-center">
            {CHIPS.map((chip) => {
              const isActive = activeChip === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setActiveChip(chip)}
                  className={`px-5 py-2.5 text-xs font-heading font-extrabold uppercase tracking-wider rounded-full transition-all ${
                    isActive 
                      ? "bg-[#F5C542] text-[#171512] border-2 border-[#92400E] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]" 
                      : "retro-btn-dashed"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 mt-12">
          {filteredTrending.map((item, idx) => (
            <Reveal key={item.id} delay={idx * 60}>
              <GameCard item={item} />
            </Reveal>
          ))}
          <Reveal delay={filteredTrending.length * 60}>
            <PitchUsCard />
          </Reveal>
        </div>
      </main>

      <FeaturesSection />
      <FAQSection />

      <Footer />
    </div>
  );
}

function GameCard({ item }) {
  return (
    <Link to={`/${item.category || "item"}/${item.slug}`} className="group block text-[#FFF8E1]">
      <div className="relative">
        <div className="border-2 border-[#92400E] rounded-3xl overflow-hidden bg-[#24201A] aspect-square relative shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all duration-300 group-hover:-translate-y-1">
          <img src={item.icon} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        
        <div className="mt-3.5 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-extrabold text-lg leading-tight group-hover:underline">{item.title}</h3>
            <span className="font-mono text-[10px] text-[#FFF8E1]/65 font-extrabold uppercase tracking-wider block mt-1">
              BY {item.author_name.toUpperCase()}
            </span>
          </div>
          <span className="bg-[#F5C542] text-[#171512] text-[9px] font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border border-[#92400E]">
            {getCategoryName(item.game_slug, item.category)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function PitchUsCard() {
  return (
    <div className="group block text-[#FFF8E1] cursor-pointer" onClick={() => toast("Contact us at pitch@qiveo.dev!")}>
      <div className="relative">
        <div className="border-2 border-[#92400E] rounded-3xl overflow-hidden bg-[#24201A] aspect-square flex flex-col items-center justify-center p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all duration-300 group-hover:-translate-y-1">
          <div className="w-16 h-16 border-2 border-dashed border-[#92400E]/40 rounded-full flex items-center justify-center text-3xl font-extrabold">+</div>
        </div>

        <div className="mt-3.5 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-extrabold text-lg leading-tight group-hover:underline">Your game here!</h3>
            <span className="font-mono text-[10px] text-[#FFF8E1]/65 font-extrabold uppercase tracking-wider block mt-1">
              BY YOUR STUDIO
            </span>
          </div>

          <span className="bg-[#F5C542] text-[#171512] text-[9px] font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border border-[#92400E]">
            PITCH US
          </span>
        </div>
      </div>
    </div>
  );
}
