import { Navbar } from "@/components/qiveo/Navbar";
import { Footer } from "@/pages/Home";
import { Compass, Users, CheckCircle, ShieldCheck } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-transparent text-[#E9D5FF]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="border-b-2 border-[#E9D5FF] pb-6 mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#8B5CF6] font-bold">// platform manifest</span>
          <h1 className="font-heading text-4xl lg:text-5xl font-black uppercase tracking-tight mt-2">About Qiveo</h1>
          <p className="text-[#E9D5FF]/60 mt-2 font-semibold">The developer-first, secure index for open voxel creations.</p>
        </div>

        {/* Mission Statement */}
        <div className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(139,92,246,0.3)] mb-12">
          <h2 className="font-heading text-2xl font-black uppercase mb-4 text-[#8B5CF6]">Our Mission</h2>
          <p className="leading-relaxed font-semibold text-sm md:text-base text-[#E9D5FF]/95">
            Qiveo was founded on a simple principle: <strong className="text-[#8B5CF6] font-extrabold">creators deserve a secure, clean, and fast ecosystem to share and monetize their work</strong>.
            Traditional mod platforms have become bogged down by intrusive tracking, obfuscated downloads, and copycat clones that steal creator views. Qiveo is a breath of fresh air. Every file uploaded is manually reviewed by a platform trust moderator to guarantee safety, original credit, and seamless game compatibility.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="border-2 border-[#E9D5FF] bg-[#15141E] rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="w-10 h-10 bg-[#8B5CF6]/20 border border-[#8B5CF6] rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <h3 className="font-heading text-lg font-black uppercase mb-2">Zero Malware Vetting</h3>
            <p className="text-xs text-[#E9D5FF]/60 leading-relaxed font-semibold">
              We compile and scan all uploaded assemblies. CSAM hash lists are verified automatically, and manual reviews check for spyware or mining scripts.
            </p>
          </div>

          <div className="border-2 border-[#E9D5FF] bg-[#15141E] rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="w-10 h-10 bg-[#8B5CF6]/20 border border-[#8B5CF6] rounded-xl flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <h3 className="font-heading text-lg font-black uppercase mb-2">Fair Attribution</h3>
            <p className="text-xs text-[#E9D5FF]/60 leading-relaxed font-semibold">
              Ripped or duplicate creations are flagged. Authors are verified via linked Google or Discord channels to protect original intellectual property.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <h2 className="font-heading text-2xl font-black uppercase mb-6 text-[#8B5CF6]">// Frequently Asked Questions</h2>
          
          <div className="border-2 border-[#E9D5FF] bg-[#0A0A0C] rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
            <h4 className="font-heading font-extrabold text-sm uppercase tracking-wide mb-2">Is Qiveo completely free to use?</h4>
            <p className="text-xs text-[#E9D5FF]/70 leading-relaxed font-medium">
              Yes, browsing, searching, and downloading catalog voxel files is entirely free. Creators can opt to list premium licensing tiers if they wish.
            </p>
          </div>

          <div className="border-2 border-[#E9D5FF] bg-[#0A0A0C] rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
            <h4 className="font-heading font-extrabold text-sm uppercase tracking-wide mb-2">How long does the human review take?</h4>
            <p className="text-xs text-[#E9D5FF]/70 leading-relaxed font-medium">
              Our vetting team is active 24/7. Most submissions are scanned, tested, and published to the live browse section within 4 to 12 hours.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
