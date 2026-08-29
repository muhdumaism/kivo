import { toolsRegistry, TOOLS_CATEGORIES } from '@/lib/tools.config';
import { ToolCard } from '@/components/qiveo/ToolCard';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';

export default function ToolsHub() {
  const createTools = toolsRegistry.filter(t => t.category === TOOLS_CATEGORIES.CREATE);
  const generalTools = toolsRegistry.filter(t => t.category === TOOLS_CATEGORIES.TOOLS);

  return (
    <div className="min-h-screen bg-[#171512] flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-heading font-black text-[#FFF8E1] mb-6 uppercase tracking-tight">
            Minecraft <span className="text-[#F5C542]">Tools</span>
          </h1>
          <p className="text-[#FFF8E1]/60 font-mono text-lg max-w-2xl mx-auto">
            A complete suite of utilities for creators, mapmakers, and server owners. 
            Everything you need to customize your Minecraft experience, right in your browser.
          </p>
        </div>

        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8 border-b border-[#92400E]/30 pb-4">
            <h2 className="text-3xl font-heading font-black text-[#FFF8E1] uppercase">Create</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-[#92400E]/50 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {createTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-8 border-b border-[#92400E]/30 pb-4">
            <h2 className="text-3xl font-heading font-black text-[#FFF8E1] uppercase">Tools & Utilities</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-[#92400E]/50 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {generalTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
        
        <div className="text-center mt-20 pt-8 border-t border-[#92400E]/30">
          <p className="text-[#FFF8E1]/40 font-mono text-xs max-w-xl mx-auto">
            Qiveo Tools is a community project and is not affiliated with, endorsed, or sponsored by Mojang AB or Microsoft Corporation. "Minecraft" is a trademark of Mojang AB.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
