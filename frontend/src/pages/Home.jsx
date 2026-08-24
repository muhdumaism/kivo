import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Navbar } from "@/components/qiveo/Navbar";
import { Footer } from "@/components/qiveo/Footer";
import { Reveal } from "@/components/qiveo/Reveal";
import { Search, ArrowRight, Download } from "lucide-react";
import { toast } from "sonner";
import { useWebSocket } from "@/context/WebSocketContext";

const CHIPS = ["All Games", "Roguelite", "Turn-Based Strategy", "FPS", "RPG"];

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
    if (activeChip === "Roguelite") return matchesSearch && (item.tags?.includes("stealth") || item.tags?.includes("adventure"));
    if (activeChip === "RPG") return matchesSearch && item.tags?.includes("rpg");
    if (activeChip === "Turn-Based Strategy") return matchesSearch && item.item_type === "Mod";
    if (activeChip === "FPS") return matchesSearch && item.item_type === "World";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        
        {/* Title row */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-[#E9D5FF]">
            <h1 className="font-heading font-black text-4xl sm:text-5xl text-[#E9D5FF] uppercase tracking-tight">
              Browse All Games
            </h1>
            
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xs">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#15141E] border-2 border-[#E9D5FF] rounded-full pl-4 pr-10 py-2.5 text-sm text-[#E9D5FF] placeholder:text-[#E9D5FF]/50 focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all font-semibold"
              />
              <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#E9D5FF] hover:scale-110 transition-transform">
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
                      ? "bg-[#E9D5FF] text-[#0A0A0C] border-2 border-[#E9D5FF] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]" 
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

      <Footer />
    </div>
  );
}

function GameCard({ item }) {
  return (
    <Link to={`/item/${item.slug}`} className="group block text-[#E9D5FF]">
      <div className="relative">
        <div className="border-2 border-[#E9D5FF] rounded-3xl overflow-hidden bg-[#15141E] aspect-square relative shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all duration-300 group-hover:-translate-y-1">
          <img src={item.icon} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        
        <div className="mt-3.5 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-extrabold text-lg leading-tight group-hover:underline">{item.title}</h3>
            <span className="font-mono text-[10px] text-[#E9D5FF]/65 font-extrabold uppercase tracking-wider block mt-1">
              BY {item.author_name.toUpperCase()}
            </span>
          </div>
          
          <span className="bg-[#E9D5FF] text-[#0A0A0C] text-[9px] font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border border-[#E9D5FF]">
            {item.item_type}
          </span>
        </div>
      </div>
    </Link>
  );
}

function PitchUsCard() {
  return (
    <div className="group block text-[#E9D5FF] cursor-pointer" onClick={() => toast("Contact us at pitch@qiveo.dev!")}>
      <div className="relative">
        <div className="border-2 border-[#E9D5FF] rounded-3xl overflow-hidden bg-[#15141E] aspect-square flex flex-col items-center justify-center p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all duration-300 group-hover:-translate-y-1">
          <div className="w-16 h-16 border-2 border-dashed border-[#E9D5FF]/40 rounded-full flex items-center justify-center text-3xl font-extrabold">+</div>
        </div>

        <div className="mt-3.5 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-extrabold text-lg leading-tight group-hover:underline">Your game here!</h3>
            <span className="font-mono text-[10px] text-[#E9D5FF]/65 font-extrabold uppercase tracking-wider block mt-1">
              BY YOUR STUDIO
            </span>
          </div>

          <span className="bg-[#E9D5FF] text-[#0A0A0C] text-[9px] font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border border-[#E9D5FF]">
            PITCH US
          </span>
        </div>
      </div>
    </div>
  );
}
