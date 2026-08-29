import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { PenTool, Download, UploadCloud, Eraser, Image as ImageIcon } from 'lucide-react';
import { SkinPreview3D } from '@/components/qiveo/SkinPreview3D';

export default function CapeEditor() {
  const [color, setColor] = useState('#92400E');
  const [tool, setTool] = useState('brush');
  const [capeDataUrl, setCapeDataUrl] = useState('');
  
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  // Initialize empty transparent 64x32 canvas for cape
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 64, 32);
    updatePreview();
  }, []);

  const updatePreview = () => {
    if (canvasRef.current) {
      setCapeDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const drawPixel = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate pixel coordinates (canvas is 64x32)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext('2d');
    
    if (tool === 'brush') {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    } else if (tool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
    }
  };

  const handlePointerDown = (e) => {
    isDrawing.current = true;
    drawPixel(e);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current) return;
    drawPixel(e);
  };

  const handlePointerUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      updatePreview();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, 64, 32);
          ctx.drawImage(img, 0, 0, 64, 32);
          updatePreview();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const downloadCape = () => {
    if (!capeDataUrl) return;
    const a = document.createElement('a');
    a.href = capeDataUrl;
    a.download = 'custom_cape.png';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#171512] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-16 w-full">
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#24201A] rounded-xl flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Cape Editor</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Paint directly on the 2D cape texture map and see it update instantly on the 3D model.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Tools & Palette */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">Tools</h3>
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setTool('brush')}
                  className={`flex-1 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors ${tool === 'brush' ? 'bg-[#F5C542] text-[#171512]' : 'bg-[#171512] text-[#FFF8E1]/60 border border-[#92400E]/30 hover:text-[#FFF8E1]'}`}
                >
                  <PenTool className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase">Brush</span>
                </button>
                <button 
                  onClick={() => setTool('eraser')}
                  className={`flex-1 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors ${tool === 'eraser' ? 'bg-[#F5C542] text-[#171512]' : 'bg-[#171512] text-[#FFF8E1]/60 border border-[#92400E]/30 hover:text-[#FFF8E1]'}`}
                >
                  <Eraser className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase">Eraser</span>
                </button>
              </div>

              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">Color</h3>
              <div className="flex gap-4 items-center">
                <input 
                  type="color" 
                  value={color} 
                  onChange={e => setColor(e.target.value)} 
                  className="w-16 h-16 rounded-xl cursor-pointer border-2 border-[#92400E]/50 p-1 bg-[#171512]"
                />
                <input 
                  type="text" 
                  value={color} 
                  onChange={e => setColor(e.target.value)} 
                  className="flex-1 bg-[#171512] border border-[#92400E]/50 rounded-xl px-3 py-2 text-[#FFF8E1] font-mono text-sm focus:outline-none focus:border-[#F5C542]"
                />
              </div>
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">File Actions</h3>
              <button 
                onClick={() => document.getElementById('cape-upload').click()}
                className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-3 bg-[#171512] border border-[#92400E]/50 text-[#FFF8E1] rounded-xl hover:bg-[#F5C542] hover:text-[#171512] transition-colors text-sm font-bold"
              >
                <UploadCloud className="w-4 h-4" /> Load Cape PNG
              </button>
              <input id="cape-upload" type="file" accept="image/png" className="hidden" onChange={handleFileUpload} />
              
              <button 
                onClick={downloadCape}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F5C542] text-[#171512] rounded-xl hover:bg-[#FFD84D] transition-colors text-sm font-bold"
              >
                <Download className="w-4 h-4" /> Export Cape
              </button>
            </div>
          </div>

          {/* 2D Canvas Editor */}
          <div className="lg:col-span-5 bg-[#171512] border border-[#92400E]/50 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <h3 className="absolute top-6 left-6 text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 z-10">2D Texture (64x32)</h3>
            <div className="absolute inset-0 bg-[url('https://minecraft.wiki/images/Stone_Bricks.png')] opacity-5 bg-repeat"></div>
            
            <div className="relative bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wB9/6YVQAAAAASUVORK5CYII=')] bg-repeat shadow-[0_0_0_1px_rgba(245,197,66,0.3)] touch-none select-none" style={{ backgroundSize: '16px 16px' }}>
              <canvas
                ref={canvasRef}
                width={64}
                height={32}
                className="w-[400px] h-[200px] [image-rendering:pixelated] cursor-crosshair opacity-90 hover:opacity-100 relative z-10"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]" style={{ backgroundSize: '6.25px 6.25px' }}></div>
            </div>
            
            <p className="text-[#FFF8E1]/40 font-mono text-[10px] mt-8 relative z-10 text-center max-w-[300px]">
              Use standard Minecraft cape mapping layout. 64x32 pixels.
            </p>
          </div>

          {/* 3D Preview */}
          <div className="lg:col-span-4 bg-[#24201A] border border-[#92400E] rounded-3xl p-6 flex flex-col relative overflow-hidden">
            <h3 className="absolute top-6 left-6 text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 z-10">Live 3D Preview</h3>
            <div className="flex-1 flex items-center justify-center relative mt-8 z-10">
              <SkinPreview3D 
                capeUrl={capeDataUrl}
                skinUrl="https://textures.minecraft.net/texture/414e8b3986d38e2171542f7d307dcafb2d7168c4d21e89bd22822a16d51c7091" // Default Steve to show the cape on
                model="classic"
                width={300}
                height={400}
                autoRotate={false}
                controls={true}
                onReady={(viewer) => {
                  // Position camera behind the player to see the cape
                  viewer.camera.position.set(0, 15, -40);
                  viewer.camera.lookAt(0, 10, 0);
                }}
              />
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
