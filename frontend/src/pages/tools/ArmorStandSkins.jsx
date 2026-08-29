import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/qiveo/Navbar';
import { Footer } from '@/components/qiveo/Footer';
import { UserSquare2, Search, UploadCloud, Copy, Check } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { SkinPreview3D } from '@/components/qiveo/SkinPreview3D';

const POSE_PARTS = [
  { id: 'Head', label: 'Head', path: 'head' },
  { id: 'Body', label: 'Body', path: 'body' },
  { id: 'RightArm', label: 'Right Arm', path: 'rightArm' },
  { id: 'LeftArm', label: 'Left Arm', path: 'leftArm' },
  { id: 'RightLeg', label: 'Right Leg', path: 'rightLeg' },
  { id: 'LeftLeg', label: 'Left Leg', path: 'leftLeg' }
];

export default function ArmorStandSkins() {
  const [username, setUsername] = useState('');
  const [skinUrl, setSkinUrl] = useState('');
  const [modelType, setModelType] = useState('classic');
  const [loading, setLoading] = useState(false);
  
  const [showArms, setShowArms] = useState(true);
  const [noBasePlate, setNoBasePlate] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  
  // Rotations in degrees [pitch, yaw, roll] -> [x, y, z]
  const [pose, setPose] = useState({
    Head: [0, 0, 0],
    Body: [0, 0, 0],
    RightArm: [0, 0, 0],
    LeftArm: [0, 0, 0],
    RightLeg: [0, 0, 0],
    LeftLeg: [0, 0, 0]
  });

  const [copied, setCopied] = useState(false);
  const viewerRef = useRef(null);

  const fetchProfile = async (e) => {
    e?.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      const { data } = await api.get(`/minecraft/profile/${username.trim()}`);
      const texUrl = data.skin.url;
      const textureId = texUrl.split('/').pop();
      setSkinUrl(`${api.defaults.baseURL || '/api'}/minecraft/download/${textureId}`);
      setModelType(data.skin.model || 'classic');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Player not found");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSkinUrl(url);
      setUsername('Custom_Skin'); // For the head NBT
    }
  };

  const handlePoseChange = (partId, axisIndex, value) => {
    setPose(prev => {
      const newPose = { ...prev };
      newPose[partId] = [...newPose[partId]];
      newPose[partId][axisIndex] = parseFloat(value) || 0;
      return newPose;
    });
  };

  // Sync 3D preview with pose
  useEffect(() => {
    const viewer = viewerRef.current?.getViewer();
    if (viewer && viewer.playerObject) {
      // Helper to convert deg to rad
      const r = (deg) => deg * (Math.PI / 180);
      
      const p = viewer.playerObject;
      p.skin.head.rotation.set(r(pose.Head[0]), r(pose.Head[1]), r(pose.Head[2]));
      p.skin.body.rotation.set(r(pose.Body[0]), r(pose.Body[1]), r(pose.Body[2]));
      p.skin.rightArm.rotation.set(r(pose.RightArm[0]), r(pose.RightArm[1]), r(pose.RightArm[2]));
      p.skin.leftArm.rotation.set(r(pose.LeftArm[0]), r(pose.LeftArm[1]), r(pose.LeftArm[2]));
      p.skin.rightLeg.rotation.set(r(pose.RightLeg[0]), r(pose.RightLeg[1]), r(pose.RightLeg[2]));
      p.skin.leftLeg.rotation.set(r(pose.LeftLeg[0]), r(pose.LeftLeg[1]), r(pose.LeftLeg[2]));
    }
  }, [pose, skinUrl]); // Re-run if skinUrl changes (viewer loads new playerObject)

  const generateCommand = () => {
    const p = pose;
    const poseNbt = `Pose:{Head:[${p.Head.join('f,')}f],Body:[${p.Body.join('f,')}f],LeftArm:[${p.LeftArm.join('f,')}f],RightArm:[${p.RightArm.join('f,')}f],LeftLeg:[${p.LeftLeg.join('f,')}f],RightLeg:[${p.RightLeg.join('f,')}f]}`;
    
    // Modern 1.20.5+ component syntax for the head
    const headNbt = username ? `id:"minecraft:player_head",Count:1,components:{"minecraft:profile":"${username}"}` : '';
    const armorItems = headNbt ? `ArmorItems:[{},{},{},{${headNbt}}]` : '';
    
    const tags = [];
    if (showArms) tags.push('ShowArms:1b');
    if (noBasePlate) tags.push('NoBasePlate:1b');
    if (isSmall) tags.push('Small:1b');
    if (armorItems) tags.push(armorItems);
    tags.push(poseNbt);

    return `/summon minecraft:armor_stand ~ ~ ~ {${tags.join(',')}}`;
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(generateCommand());
    setCopied(true);
    toast.success("Command copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#171512] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-16 w-full">
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#24201A] rounded-xl flex items-center justify-center">
              <UserSquare2 className="w-6 h-6 text-[#F5C542]" />
            </div>
            <h1 className="text-4xl font-heading font-black text-[#FFF8E1] uppercase tracking-tight">Armor Stand Skins</h1>
          </div>
          <p className="text-[#FFF8E1]/60 font-mono text-lg">
            Generate `/summon` commands for armor stands with custom poses and player heads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">1. Skin & Head</h3>
              <div className="space-y-4">
                <form onSubmit={fetchProfile} className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Username"
                    className="flex-1 bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] font-mono focus:outline-none focus:border-[#F5C542]"
                  />
                  <button type="submit" disabled={loading} className="px-4 bg-[#F5C542] text-[#171512] rounded-xl font-bold hover:bg-[#FFD84D]">
                    <Search className="w-5 h-5" />
                  </button>
                </form>
                <button
                  onClick={() => document.getElementById('skin-upload').click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#171512] border border-[#92400E]/50 text-[#FFF8E1] rounded-xl hover:bg-[#24201A] transition-colors"
                >
                  <UploadCloud className="w-5 h-5" />
                  Upload Skin File
                </button>
                <input id="skin-upload" type="file" accept=".png" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">2. Armor Stand Settings</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-[#FFF8E1] font-mono text-sm cursor-pointer">
                  <input type="checkbox" checked={showArms} onChange={e => setShowArms(e.target.checked)} className="accent-[#F5C542] w-4 h-4" />
                  Show Arms
                </label>
                <label className="flex items-center gap-2 text-[#FFF8E1] font-mono text-sm cursor-pointer">
                  <input type="checkbox" checked={noBasePlate} onChange={e => setNoBasePlate(e.target.checked)} className="accent-[#F5C542] w-4 h-4" />
                  No Base Plate
                </label>
                <label className="flex items-center gap-2 text-[#FFF8E1] font-mono text-sm cursor-pointer">
                  <input type="checkbox" checked={isSmall} onChange={e => setIsSmall(e.target.checked)} className="accent-[#F5C542] w-4 h-4" />
                  Small
                </label>
              </div>
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-4">3. Pose (Degrees)</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {POSE_PARTS.map(part => (
                  <div key={part.id} className="bg-[#171512] p-3 rounded-xl border border-[#92400E]/30">
                    <div className="text-[10px] font-bold font-mono uppercase text-[#FFF8E1]/60 mb-2">{part.label}</div>
                    <div className="flex gap-2">
                      {['X (Pitch)', 'Y (Yaw)', 'Z (Roll)'].map((lbl, idx) => (
                        <div key={idx} className="flex-1">
                          <input 
                            type="number" 
                            value={pose[part.id][idx]}
                            onChange={e => handlePoseChange(part.id, idx, e.target.value)}
                            className="w-full bg-[#24201A] border border-[#92400E]/50 rounded-lg px-2 py-1.5 text-[#FFF8E1] text-xs font-mono text-center focus:border-[#F5C542] focus:outline-none"
                            title={lbl}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>

          {/* Preview & Output */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            <div className="bg-[#171512] border border-[#92400E]/50 rounded-3xl p-6 flex-1 min-h-[400px] flex items-center justify-center relative shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://minecraft.wiki/images/Stone_Bricks.png')] opacity-10 bg-repeat"></div>
              <div className="relative z-10">
                <SkinPreview3D 
                  ref={viewerRef}
                  skinUrl={skinUrl || "https://textures.minecraft.net/texture/414e8b3986d38e2171542f7d307dcafb2d7168c4d21e89bd22822a16d51c7091"}
                  model={modelType}
                  width={300}
                  height={400}
                  controls={true}
                />
              </div>
            </div>

            <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
              <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Summon Command (1.20.5+)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generateCommand()}
                  className="flex-1 bg-[#171512] border border-[#92400E]/50 rounded-xl px-4 py-3 text-[#F5C542] font-mono text-[10px] focus:outline-none overflow-x-auto"
                />
                <button
                  onClick={copyCommand}
                  className="px-6 bg-[#171512] border border-[#92400E]/50 text-[#FFF8E1] rounded-xl hover:bg-[#F5C542] hover:text-[#171512] transition-colors flex items-center justify-center font-bold text-sm gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
              </div>
            </div>

          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}
