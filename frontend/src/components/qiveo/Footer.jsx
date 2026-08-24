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
    <footer className="mt-auto bg-[#050507] text-[#FFF8E1] border-t-2 border-[#92400E] pt-8 pb-6 rounded-t-3xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-[#92400E]/10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <img src="/qiveo-logo-nobg-.png" alt="QIVEO" className="h-12" />
              <span className="font-heading font-black text-5xl tracking-tighter text-[#FFF8E1] uppercase">QIVEO.dev</span>
            </div>
            <p className="text-[#FFF8E1]/70 text-sm mt-4 max-w-sm font-medium leading-relaxed">
              Qiveo is a developer-friendly marketplace of indie games, skins, mods, and blocky collectibles. Every drop is human-reviewed.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#FFF8E1] mb-4">Navigation</h4>
            <div className="flex flex-col gap-2.5 text-sm text-[#FFF8E1]/70 font-semibold">
              <Link to="/browse" className="hover:text-[#92400E] transition-colors">Games</Link>
              <Link to="/news" className="hover:text-[#92400E] transition-colors">News</Link>
              <Link to="/about" className="hover:text-[#92400E] transition-colors">About</Link>
              <Link to="/contact" className="hover:text-[#92400E] transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#FFF8E1] mb-4">Legal</h4>
            <div className="flex flex-col gap-2.5 text-sm text-[#FFF8E1]/70 font-semibold">
              <Link to="/policy" className="hover:text-[#92400E] transition-colors">Trust Policy</Link>
              <Link to="/policy" className="hover:text-[#92400E] transition-colors">Privacy Policy</Link>
              <Link to="/policy" className="hover:text-[#92400E] transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-8">
          <form onSubmit={handleSubscribe} className="relative w-full max-w-md bg-[#171512] border-2 border-[#92400E] rounded-full p-1 flex items-center shadow-[3px_3px_0px_0px_rgba(139,92,246,0.3)]">
            <input
              type="email"
              placeholder="Join our spam-free, low-volume newsletter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent text-[#FFF8E1] placeholder:text-[#FFF8E1]/50 text-xs px-4 py-2 flex-1 outline-none border-0 focus:ring-0"
            />
            <button type="submit" className="bg-[#F5C542] text-[#171512] text-xs font-heading font-extrabold px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-colors">
              Subscribe
            </button>
          </form>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-[#FFF8E1]/50 font-mono">
            <span>© 2026 QIVEO GAMES INC.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#92400E] transition-colors">TWITTER</a>
              <a href="#" className="hover:text-[#92400E] transition-colors">DISCORD</a>
              <a href="#" className="hover:text-[#92400E] transition-colors">GITHUB</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
