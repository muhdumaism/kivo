import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success(`Subscribed ${email} to our newsletter!`);
    setEmail("");
  };

  return (
    <footer className="mt-auto bg-[#050507] text-[#E9D5FF] border-t-2 border-[#E9D5FF] pt-8 pb-6 rounded-t-3xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-[#E9D5FF]/10">
          <div className="md:col-span-2">
            <span className="font-heading font-black text-5xl tracking-tighter text-[#E9D5FF] block uppercase">QIVEO</span>
            <p className="text-[#E9D5FF]/70 text-sm mt-4 max-w-sm font-medium leading-relaxed">
              Qiveo is a developer-friendly marketplace of indie games, skins, mods, and blocky collectibles. Every drop is human-reviewed.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#E9D5FF] mb-4">Navigation</h4>
            <div className="flex flex-col gap-2.5 text-sm text-[#E9D5FF]/70 font-semibold">
              <Link to="/browse" className="hover:text-[#8B5CF6] transition-colors">Games</Link>
              <Link to="/news" className="hover:text-[#8B5CF6] transition-colors">News</Link>
              <Link to="/about" className="hover:text-[#8B5CF6] transition-colors">About</Link>
              <Link to="/contact" className="hover:text-[#8B5CF6] transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#E9D5FF] mb-4">Legal</h4>
            <div className="flex flex-col gap-2.5 text-sm text-[#E9D5FF]/70 font-semibold">
              <Link to="/policy" className="hover:text-[#8B5CF6] transition-colors">Trust Policy</Link>
              <Link to="/policy" className="hover:text-[#8B5CF6] transition-colors">Privacy Policy</Link>
              <Link to="/policy" className="hover:text-[#8B5CF6] transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-8">
          <form onSubmit={handleSubscribe} className="relative w-full max-w-md bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-full p-1 flex items-center shadow-[3px_3px_0px_0px_rgba(139,92,246,0.3)]">
            <input
              type="email"
              placeholder="Join our spam-free, low-volume newsletter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent text-[#E9D5FF] placeholder:text-[#E9D5FF]/50 text-xs px-4 py-2 flex-1 outline-none border-0 focus:ring-0"
            />
            <button type="submit" className="bg-[#E9D5FF] text-[#0A0A0C] text-xs font-heading font-extrabold px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-colors">
              Subscribe
            </button>
          </form>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-[#E9D5FF]/50 font-mono">
            <span>© 2026 QIVEO GAMES INC.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#8B5CF6] transition-colors">TWITTER</a>
              <a href="#" className="hover:text-[#8B5CF6] transition-colors">DISCORD</a>
              <a href="#" className="hover:text-[#8B5CF6] transition-colors">GITHUB</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
