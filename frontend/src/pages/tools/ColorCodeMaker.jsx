import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { Type, Copy, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const MC_COLORS = [
  { code: '0', hex: '#000000', name: 'Black' },
  { code: '1', hex: '#0000AA', name: 'Dark Blue' },
  { code: '2', hex: '#00AA00', name: 'Dark Green' },
  { code: '3', hex: '#00AAAA', name: 'Dark Aqua' },
  { code: '4', hex: '#AA0000', name: 'Dark Red' },
  { code: '5', hex: '#AA00AA', name: 'Dark Purple' },
  { code: '6', hex: '#FFAA00', name: 'Gold' },
  { code: '7', hex: '#AAAAAA', name: 'Gray' },
  { code: '8', hex: '#555555', name: 'Dark Gray' },
  { code: '9', hex: '#5555FF', name: 'Blue' },
  { code: 'a', hex: '#55FF55', name: 'Green' },
  { code: 'b', hex: '#55FFFF', name: 'Aqua' },
  { code: 'c', hex: '#FF5555', name: 'Red' },
  { code: 'd', hex: '#FF55FF', name: 'Light Purple' },
  { code: 'e', hex: '#FFFF55', name: 'Yellow' },
  { code: 'f', hex: '#FFFFFF', name: 'White' },
];

const MC_FORMATS = [
  { code: 'l', key: 'bold', name: 'Bold' },
  { code: 'o', key: 'italic', name: 'Italic' },
  { code: 'n', key: 'underlined', name: 'Underline' },
  { code: 'm', key: 'strikethrough', name: 'Strike' },
  { code: 'k', key: 'obfuscated', name: 'Magic' },
];

export default function ColorCodeMaker() {
  const [segments, setSegments] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [currentColor, setCurrentColor] = useState('f');
  const [currentFormats, setCurrentFormats] = useState({});

  const addSegment = () => {
    if (!currentText.trim()) return;
    setSegments([...segments, {
      text: currentText,
      color: currentColor,
      formats: { ...currentFormats }
    }]);
    setCurrentText('');
  };

  const removeSegment = (index) => {
    const newSegs = [...segments];
    newSegs.splice(index, 1);
    setSegments(newSegs);
  };

  const clearAll = () => {
    setSegments([]);
    setCurrentText('');
  };

  const toggleFormat = (key) => {
    setCurrentFormats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate strings
  const generateLegacy = () => {
    let result = '';
    const allSegs = currentText ? [...segments, { text: currentText, color: currentColor, formats: currentFormats }] : segments;
    
    allSegs.forEach(seg => {
      let part = `§${seg.color}`;
      if (seg.formats.bold) part += `§l`;
      if (seg.formats.italic) part += `§o`;
      if (seg.formats.underlined) part += `§n`;
      if (seg.formats.strikethrough) part += `§m`;
      if (seg.formats.obfuscated) part += `§k`;
      part += seg.text;
      result += part;
    });
    return result;
  };

  const generateJson = () => {
    const allSegs = currentText ? [...segments, { text: currentText, color: currentColor, formats: currentFormats }] : segments;
    
    const arr = allSegs.map(seg => {
      const colorName = MC_COLORS.find(c => c.code === seg.color)?.name.toLowerCase().replace(' ', '_');
      const obj = { text: seg.text, color: colorName };
      if (seg.formats.bold) obj.bold = true;
      if (seg.formats.italic) obj.italic = true;
      if (seg.formats.underlined) obj.underlined = true;
      if (seg.formats.strikethrough) obj.strikethrough = true;
      if (seg.formats.obfuscated) obj.obfuscated = true;
      return obj;
    });
    
    return JSON.stringify(["", ...arr], null, 2);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const allPreviewSegments = currentText ? [...segments, { text: currentText, color: currentColor, formats: currentFormats, isTyping: true }] : segments;

  return (
    <div className="min-h-screen bg-[#171512] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#24201A] rounded-xl flex items-center justify-center">
              <Type className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Color Code Maker</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Create rich Minecraft text and export to legacy section codes or modern JSON text components.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Builder */}
          <div className="space-y-6">
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              
              <div className="mb-6">
                <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-3">Color</label>
                <div className="grid grid-cols-8 gap-2">
                  {MC_COLORS.map(c => (
                    <button
                      key={c.code}
                      onClick={() => setCurrentColor(c.code)}
                      title={c.name}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${currentColor === c.code ? 'border-[#F5C542] scale-110 shadow-lg' : 'border-transparent hover:border-white/20'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-3">Formatting</label>
                <div className="flex flex-wrap gap-2">
                  {MC_FORMATS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => toggleFormat(f.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold font-mono transition-colors ${currentFormats[f.key] ? 'bg-[#F5C542] text-[#171512]' : 'bg-[#171512] text-[#FFF8E1]/60 border border-[#92400E] hover:text-[#FFF8E1]'}`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-3">Add Text</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSegment()}
                    placeholder="Type here..."
                    className="flex-1 bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542] transition-colors"
                  />
                  <button
                    onClick={addSegment}
                    disabled={!currentText.trim()}
                    className="px-4 py-3 bg-[#F5C542] text-[#171512] rounded-xl font-bold hover:bg-[#FFD84D] disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>

            <div className="bg-[#171512] border border-[#92400E]/50 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50">Segments</h3>
                <button onClick={clearAll} className="text-rose-500 hover:text-rose-400 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              
              {segments.length === 0 ? (
                <p className="text-[#FFF8E1]/30 font-mono text-sm text-center py-4">No segments added yet.</p>
              ) : (
                <div className="space-y-2">
                  {segments.map((seg, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#24201A] p-3 rounded-xl border border-[#92400E]/30">
                      <span className="font-pixel text-sm truncate" style={{ 
                        color: MC_COLORS.find(c => c.code === seg.color)?.hex,
                        fontWeight: seg.formats.bold ? 'bold' : 'normal',
                        fontStyle: seg.formats.italic ? 'italic' : 'normal',
                        textDecoration: `${seg.formats.underlined ? 'underline ' : ''}${seg.formats.strikethrough ? 'line-through' : ''}`.trim() || 'none'
                      }}>
                        {seg.text}
                      </span>
                      <button onClick={() => removeSegment(i)} className="p-2 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Preview & Output */}
          <div className="space-y-6 flex flex-col">
            
            <div className="bg-[url('https://minecraft.wiki/images/Stone_Bricks.png')] bg-repeat border-4 border-[#92400E] rounded-3xl p-6 min-h-[160px] flex items-center justify-center relative overflow-hidden group shadow-inner">
              <div className="absolute inset-0 bg-black/60"></div>
              <div className="relative z-10 w-full text-center break-words bg-black/40 p-4 rounded-xl shadow-[0_0_0_2px_rgba(255,255,255,0.1)_inset]">
                {allPreviewSegments.length === 0 ? (
                  <span className="font-pixel text-[#FFF8E1]/30 animate-pulse">Preview</span>
                ) : (
                  allPreviewSegments.map((seg, i) => (
                    <span key={i} className="font-pixel text-xl leading-relaxed shadow-md" style={{ 
                      color: MC_COLORS.find(c => c.code === seg.color)?.hex,
                      fontWeight: seg.formats.bold ? 'bold' : 'normal',
                      fontStyle: seg.formats.italic ? 'italic' : 'normal',
                      textDecoration: `${seg.formats.underlined ? 'underline ' : ''}${seg.formats.strikethrough ? 'line-through' : ''}`.trim() || 'none',
                      textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
                    }}>
                      {seg.formats.obfuscated ? seg.text.replace(/./g, 'X') : seg.text}
                      {seg.isTyping && <span className="animate-pulse border-r-2 border-white ml-[1px]"></span>}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 flex-1 flex flex-col">
              <div className="mb-6 flex-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50">Legacy String (§)</label>
                  <button onClick={() => copyToClipboard(generateLegacy())} className="text-[#F5C542] hover:text-[#FFF8E1] flex items-center gap-1 text-xs font-bold">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="bg-[#171512] p-4 rounded-xl border border-[#92400E]/50 font-mono text-sm text-[#FFF8E1] break-all max-h-[120px] overflow-y-auto">
                  {generateLegacy() || <span className="text-white/20">...</span>}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50">JSON Text Component</label>
                  <button onClick={() => copyToClipboard(generateJson())} className="text-[#F5C542] hover:text-[#FFF8E1] flex items-center gap-1 text-xs font-bold">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="bg-[#171512] p-4 rounded-xl border border-[#92400E]/50 font-mono text-sm text-[#FFF8E1] whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                  {currentText || segments.length > 0 ? generateJson() : <span className="text-white/20">...</span>}
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
