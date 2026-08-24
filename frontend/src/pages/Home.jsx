import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Navbar } from "@/components/qiveo/Navbar";
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
    <div className="min-h-screen flex flex-col bg-transparent">
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



export function Footer() {
  const [email, setEmail] = useState("");
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success(`Subscribed ${email} to our newsletter!`);
    setEmail("");
  };
  
  return (
    <footer className="bg-[#050507] text-[#E9D5FF] border-t-2 border-[#E9D5FF] mt-16 pt-16 pb-12 rounded-t-[2.5rem]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-[#E9D5FF]/10">
          <div className="md:col-span-2">
            <span className="font-heading font-black text-5xl tracking-tighter text-[#E9D5FF] block uppercase">QIVEO</span>
            <p className="text-[#E9D5FF]/70 text-sm mt-4 max-w-sm font-medium leading-relaxed">
              Qiveo is a developer-friendly marketplace of indie games, skins, mods, and blocky collectibles. Every drop is human-reviewed.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#E9D5FF] mb-4">Navigation</h4>
            <div className="flex flex-col gap-2.5 text-sm text-[#E9D5FF]/70 font-semibold">
              <Link to="/browse" className="hover:text-[#8B5CF6]">Games</Link>
              <Link to="/news" className="hover:text-[#8B5CF6]">News</Link>
              <Link to="/about" className="hover:text-[#8B5CF6]">About</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#E9D5FF] mb-4">Contact</h4>
            <div className="flex flex-col gap-2.5 text-sm text-[#E9D5FF]/70 font-semibold">
              <Link to="/contact" className="hover:text-[#8B5CF6]">Contact</Link>
              <Link to="/policy" className="hover:text-[#8B5CF6]">Trust Policy</Link>
              <Link to="/policy" className="hover:text-[#8B5CF6]">DMCA Info</Link>
              <Link to="/policy" className="hover:text-[#8B5CF6]">Privacy Policy</Link>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-10">
          <form onSubmit={handleSubscribe} className="relative w-full max-w-md bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-full p-1 flex items-center shadow-[3px_3px_0px_0px_rgba(139,92,246,0.3)]">
            <input 
              type="email" 
              placeholder="Join our spam-free, low-volume newsletter" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent text-[#E9D5FF] placeholder:text-[#E9D5FF]/50 text-xs px-4 py-2 flex-1 outline-none border-0 focus:ring-0"
            />
            <button type="submit" className="bg-[#E9D5FF] text-[#0A0A0C] text-xs font-heading font-extrabold px-5 py-2.5 rounded-full hover:bg-neutral-800 transition-colors">
              Subscribe
            </button>
          </form>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-[#E9D5FF]/50 font-mono">
            <span>© 2026 QIVEO GAMES INC.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#8B5CF6]">TWITTER</a>
              <a href="#" className="hover:text-[#8B5CF6]">DISCORD</a>
              <a href="#" className="hover:text-[#8B5CF6]">GITHUB</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
