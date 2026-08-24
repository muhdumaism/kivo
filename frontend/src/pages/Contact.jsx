import { useState } from "react";
import { Navbar } from "@/components/qiveo/Navbar";
import { Footer } from "@/pages/Home";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/contact", form);
      toast.success("Message dispatched successfully!");
      setSubmitted(true);
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#E9D5FF]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="border-b-2 border-[#E9D5FF] pb-6 mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#8B5CF6] font-bold">// contact channel</span>
          <h1 className="font-heading text-4xl lg:text-5xl font-black uppercase tracking-tight mt-2">Get in Touch</h1>
          <p className="text-[#E9D5FF]/60 mt-2 font-semibold">Have questions, feedback, or need moderation assistance? Drop us a message.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Details */}
          <div className="space-y-8">
            <div className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#8B5CF6]/20 border border-[#8B5CF6] rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm uppercase tracking-wider">Email Channels</h3>
                  <p className="text-xs text-[#E9D5FF]/60 mt-1 font-mono">support@qiveo.dev</p>
                  <p className="text-xs text-[#E9D5FF]/60 font-mono">moderation@qiveo.dev</p>
                </div>
              </div>
            </div>

            <div className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#8B5CF6]/20 border border-[#8B5CF6] rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm uppercase tracking-wider">Community Chat</h3>
                  <p className="text-xs text-[#E9D5FF]/70 mt-1 font-semibold">
                    Join our Discord guild to chat with other voxel creators, request features, or get instant help.
                  </p>
                  <a href="#" className="inline-block mt-3 text-xs font-mono font-black text-[#8B5CF6] hover:underline">JOIN DISCORD →</a>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl p-8 text-center shadow-[6px_6px_0px_0px_rgba(139,92,246,0.3)]">
                <div className="w-12 h-12 bg-[#8B5CF6]/20 border-2 border-[#8B5CF6] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Send className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <h3 className="font-heading text-2xl font-black uppercase mb-2">Message Dispatched!</h3>
                <p className="text-xs text-[#E9D5FF]/70 font-semibold mb-6">
                  Thank you for writing. A developer or moderation team member will reply to you within 24 hours.
                </p>
                <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="retro-btn-black px-5 py-2 text-xs font-heading font-extrabold uppercase">
                  Write Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Your Name *</label>
                    <input 
                      type="text" 
                      placeholder="Steve Blockson"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Your Email Address *</label>
                    <input 
                      type="email" 
                      placeholder="steve@blockworld.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold"
                      required
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Subject</label>
                  <input 
                    type="text" 
                    placeholder="Vetting feedback / Moderation inquiry"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold"
                    disabled={busy}
                  />
                </div>

                <div>
                  <label className="block font-heading text-xs uppercase tracking-wider text-[#E9D5FF]/80 mb-2 font-extrabold">Your Message *</label>
                  <textarea 
                    rows={5}
                    placeholder="Write details of your feedback or question here..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:border-[#8B5CF6] font-semibold leading-relaxed"
                    required
                    disabled={busy}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-2 bg-[#E9D5FF] text-[#0A0A0C] border-2 border-[#E9D5FF] py-3.5 rounded-2xl font-heading font-black shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:bg-[#8B5CF6] hover:text-[#0A0A0C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {busy ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
