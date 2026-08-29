import { useState } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { ArrowRightLeft, Map } from 'lucide-react';

export default function CoordinateCalculator() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(64);
  const [z, setZ] = useState(0);
  const [dimension, setDimension] = useState('overworld'); // 'overworld' or 'nether'

  const parsedX = parseFloat(x) || 0;
  const parsedY = parseFloat(y) || 0;
  const parsedZ = parseFloat(z) || 0;

  // Conversions
  const convertedX = dimension === 'overworld' ? Math.floor(parsedX / 8) : parsedX * 8;
  const convertedZ = dimension === 'overworld' ? Math.floor(parsedZ / 8) : parsedZ * 8;
  const targetDimension = dimension === 'overworld' ? 'Nether' : 'Overworld';

  // Chunk Coords (÷16)
  const chunkX = Math.floor(parsedX / 16);
  const chunkZ = Math.floor(parsedZ / 16);

  // Region Coords (÷512)
  const regionX = Math.floor(parsedX / 512);
  const regionZ = Math.floor(parsedZ / 512);

  // Distance to origin (0,0,0)
  const distanceToOrigin = Math.sqrt(parsedX * parsedX + parsedY * parsedY + parsedZ * parsedZ).toFixed(2);

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#24201A] rounded-xl flex items-center justify-center">
              <Map className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Coordinate Calculator</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Convert coordinates between the Overworld and the Nether, and calculate chunk and region file locations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 md:p-8 space-y-6">
            <div>
              <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-3">Dimension</label>
              <div className="flex bg-[#171512] rounded-xl p-1 border border-[#92400E]">
                <button
                  onClick={() => setDimension('overworld')}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${dimension === 'overworld' ? 'bg-[#F5C542] text-[#171512]' : 'text-[#FFF8E1]/60 hover:text-[#FFF8E1]'}`}
                >
                  Overworld
                </button>
                <button
                  onClick={() => setDimension('nether')}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${dimension === 'nether' ? 'bg-red-500 text-white' : 'text-[#FFF8E1]/60 hover:text-[#FFF8E1]'}`}
                >
                  Nether
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">X Coordinate</label>
                <input
                  type="number"
                  value={x}
                  onChange={(e) => setX(e.target.value)}
                  className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Y (Height)</label>
                <input
                  type="number"
                  value={y}
                  onChange={(e) => setY(e.target.value)}
                  className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Z Coordinate</label>
                <input
                  type="number"
                  value={z}
                  onChange={(e) => setZ(e.target.value)}
                  className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-[#171512] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                {targetDimension} Coordinates
              </h3>
              <div className="text-3xl font-heading font-black text-[#F5C542] tracking-wider">
                {convertedX}, {parsedY}, {convertedZ}
              </div>
              <p className="text-[#FFF8E1]/40 font-mono text-xs mt-2">
                {dimension === 'overworld' ? 'Divide X and Z by 8' : 'Multiply X and Z by 8'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#24201A] border border-[#92400E]/50 rounded-2xl p-5">
                <h4 className="text-[10px] font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-1">Chunk</h4>
                <div className="text-xl font-mono font-bold text-[#FFF8E1]">
                  {chunkX}, {chunkZ}
                </div>
              </div>
              <div className="bg-[#24201A] border border-[#92400E]/50 rounded-2xl p-5">
                <h4 className="text-[10px] font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-1">Region File</h4>
                <div className="text-xl font-mono font-bold text-[#FFF8E1]">
                  r.{regionX}.{regionZ}.mca
                </div>
              </div>
            </div>

            <div className="bg-[#24201A] border border-[#92400E]/50 rounded-2xl p-5">
              <h4 className="text-[10px] font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-1">Distance to Origin (0,0)</h4>
              <div className="text-xl font-mono font-bold text-[#FFF8E1]">
                {distanceToOrigin} blocks
              </div>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
