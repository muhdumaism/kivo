import { useEffect, useState } from "react";
import { ArrowRight, Download, Server, Sparkles, Box, Shield, Cpu, Zap, Activity, ImageIcon } from "lucide-react";
import { Navbar } from "@/components/qiveo/Navbar";
import { Footer } from "@/components/qiveo/Footer";
import api, { API } from "@/lib/api";

export default function Client() {
  const [gallery, setGallery] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get("/client/gallery").then(res => setGallery(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (gallery.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % gallery.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [gallery]);

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFF8E1] font-sans selection:bg-[#F5C542] selection:text-[#000000]">
      <Navbar />
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background elements (Slideshow) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[#000000]">
          {gallery.length === 0 ? (
            <img 
              src="/qiveo-client-hero.jpg" 
              alt="Default Hero" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          ) : (
            gallery.map((img, index) => (
              <img 
                key={img.id}
                src={`${API.replace("/api", "")}${img.image_url}`}
                alt={`Slide ${index}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${currentSlide === index ? 'opacity-60' : 'opacity-0'}`}
              />
            ))
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/80 to-[#000000]/30"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-transparent to-transparent"></div>
          
          {/* Keep stardust for retro feel */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="flex flex-col items-center justify-center space-y-8 reveal in">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#171512] border-2 border-[#92400E] shadow-[4px_4px_0px_#92400E] text-[#F5C542] font-pixel text-[10px] sm:text-xs uppercase tracking-widest transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
              <div className="w-2 h-2 bg-[#F5C542] animate-pulse"></div>
              <span>Requires Minecraft 26.2+</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black font-heading tracking-tight leading-[1.1]">
              The ultimate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5C542] to-[#FFD84D]">redesign</span> for Minecraft.
            </h1>
            <p className="text-xl text-[#FFF8E1]/70 leading-relaxed max-w-2xl">
              Qiveo Client is an all-in-one client-side mod that completely overhauls your game. Essential features, single-player world hosting, and breathtaking aesthetics—built right in.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a 
                href={`${API.replace("/api", "")}/api/client/download`} 
                className="inline-flex justify-center items-center gap-2 retro-btn-black px-8 py-4 text-lg"
              >
                <Download className="w-5 h-5" />
                Download Mod
              </a>
              <a 
                href="#documentation" 
                className="inline-flex justify-center items-center gap-2 retro-btn-dashed px-8 py-4 text-lg"
              >
                Read Documentation
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 border-y border-[#92400E]/30 bg-[#171512]/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 reveal in">
            <h2 className="text-3xl lg:text-5xl font-black font-heading mb-6">Everything you need. <br/><span className="text-[#F5C542]">Nothing you don't.</span></h2>
            <p className="text-[#FFF8E1]/60 text-lg">We stripped away the clutter and built the ultimate suite of client-side tools directly into one seamless mod.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Box}
              title="Complete Redesign"
              description="A beautiful, unified UI overhaul for menus, HUDs, and inventories that feels modern yet distinctly Minecraft."
              delay="0s"
            />
            <FeatureCard 
              icon={Server}
              title="Single-Player Hosting"
              description="Open your single-player world to friends instantly without dealing with port forwarding or paying for servers."
              delay="0.1s"
            />
            <FeatureCard 
              icon={Zap}
              title="Essential Features"
              description="Built-in zoom, dynamic lights, coordinates, and armor HUD. No need to install 20 different mods anymore."
              delay="0.2s"
            />
            <FeatureCard 
              icon={Shield}
              title="Enhanced Security"
              description="Safe multiplayer interactions, verified player identities, and secure chat filtering out of the box."
              delay="0.3s"
            />
            <FeatureCard 
              icon={Activity}
              title="Live Presence"
              description="Rich Discord integration and in-game Qiveo friends list to see exactly what your friends are playing."
              delay="0.4s"
            />
            <div className="retro-card border-[#92400E]/30 p-8 flex flex-col items-center justify-center text-center reveal in" style={{ transitionDelay: '0.5s' }}>
              <Sparkles className="w-10 h-10 text-[#F5C542] mb-4" />
              <h3 className="text-xl font-heading font-bold mb-2">And much more...</h3>
              <p className="text-[#FFF8E1]/60 text-sm">Download it to experience the full potential.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <div className="py-24 bg-[#000000]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12 reveal in">
              <h2 className="text-3xl lg:text-5xl font-black font-heading mb-6">Gallery</h2>
              <p className="text-[#FFF8E1]/60 text-lg">See the Qiveo Client in action before you download.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((img, i) => (
                <div key={img.id} className="relative group aspect-video rounded-3xl overflow-hidden border-2 border-[#92400E]/30 retro-card-hover reveal in" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <img src={`${API.replace("/api", "")}${img.image_url}`} alt="Qiveo Client Screenshot" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#F5C542]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Documentation / Installation */}
      <div id="documentation" className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12 reveal in">
            <h2 className="text-3xl lg:text-5xl font-black font-heading mb-6">How to install</h2>
            <p className="text-[#FFF8E1]/60 text-lg">Getting started with Qiveo Client is incredibly simple. Just follow these steps to upgrade your game.</p>
          </div>

          <div className="space-y-6">
            <StepCard 
              number="01"
              title="Install Fabric Loader"
              description="Qiveo Client requires the Fabric Mod Loader for Minecraft 26.2+. Download the installer from the official Fabric website and run it for your game version."
              linkText="Download Fabric"
              linkUrl="https://fabricmc.net/use/"
            />
            <StepCard 
              number="02"
              title="Download Qiveo Client"
              description="Grab the latest version of the Qiveo Client mod file (.jar) using the download button at the top of this page."
            />
            <StepCard 
              number="03"
              title="Drop it in your mods folder"
              description="Open your Minecraft directory (usually %appdata%/.minecraft on Windows) and place the downloaded .jar file into the 'mods' folder. If the folder doesn't exist, create it."
            />
            <StepCard 
              number="04"
              title="Launch and Enjoy"
              description="Open the Minecraft Launcher, select your new Fabric profile, and hit Play! The Qiveo Client will automatically initialize."
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <div className="retro-card border-[#92400E]/30 hover:border-[#F5C542] p-8 reveal in group" style={{ transitionDelay: delay }}>
      <div className="w-12 h-12 rounded-xl bg-[#24201A] border border-[#92400E]/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#F5C542] group-hover:text-[#000000] transition-all duration-300 text-[#F5C542]">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-heading font-bold mb-3 text-[#FFF8E1]">{title}</h3>
      <p className="text-[#FFF8E1]/60 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, linkText, linkUrl }) {
  return (
    <div className="relative retro-card border-[#92400E]/30 p-8 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10 items-start reveal in">
      <div className="shrink-0 text-5xl md:text-7xl font-black font-pixel text-[#92400E]/30 select-none">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-2xl font-heading font-bold mb-3 text-[#F5C542]">{title}</h3>
        <p className="text-[#FFF8E1]/70 text-lg leading-relaxed mb-4">{description}</p>
        {linkText && (
          <a 
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#F5C542] hover:text-[#FFD84D] font-bold text-sm uppercase tracking-wider transition-colors"
          >
            {linkText} <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
