import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ShaderBackground } from "@/components/qiveo/ShaderBackground";
import { Footer } from "@/pages/Home";

export default function Login() {
  const [params] = useSearchParams();
  const { demo, refresh } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      setBusy("oauth");
      localStorage.setItem("qiveo_token", token);
      refresh()
        .then((user) => {
          toast.success(`Welcome back, ${user.name}!`);
          nav(user.role === "super_admin" || user.role === "ts_moderator" ? "/admin" : "/");
        })
        .catch(() => {
          setErr("Authentication failed during profile sync.");
          setBusy("");
        });
    }
  }, [params, refresh, nav]);

  const handleGoogleLogin = () => {
    setBusy("google");
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    window.location.href = `${backendUrl}/api/auth/google/login`;
  };

  const handleDiscordLogin = () => {
    setBusy("discord");
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    window.location.href = `${backendUrl}/api/auth/discord/login`;
  };

  const handleDemoLogin = async (provider) => {
    setBusy(provider);
    setErr("");
    try {
      await demo(provider);
      toast.success(`Demo sign-in successful!`);
      nav(provider === "staff" ? "/admin" : "/");
    } catch (e) {
      setErr(apiError(e.response?.data?.detail) || e.message);
      setBusy("");
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-between relative">
      <ShaderBackground />
      {/* Brand Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b-2 border-[#E9D5FF]">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading font-black text-2xl tracking-tighter text-[#E9D5FF] uppercase">QIVEO</span>
        </Link>
        <p className="font-mono text-xs text-[#E9D5FF]/40 font-bold">// authentication portal</p>
      </header>

      {/* Main Login Box */}
      <div className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="w-full max-w-md bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-3xl p-8 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] text-[#E9D5FF]">
          <h1 className="font-heading text-3xl font-black uppercase text-center tracking-tight">Connect to Qiveo</h1>
          <p className="text-[#E9D5FF]/60 text-center mt-2 text-sm font-semibold">Choose a secure provider to authenticate</p>

          <div className="space-y-4 mt-8">
            <button 
              data-testid="google-login-btn" 
              onClick={handleGoogleLogin} 
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 bg-[#0A0A0C] text-[#E9D5FF] border-2 border-[#E9D5FF] py-3.5 rounded-full font-heading font-extrabold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:bg-[#E9D5FF]/5 transition-all disabled:opacity-60"
            >
              {busy === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />} 
              Continue with Google
            </button>
            
            <button 
              data-testid="discord-login-btn" 
              onClick={handleDiscordLogin} 
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 bg-[#5865F2] text-white border-2 border-[#E9D5FF] py-3.5 rounded-full font-heading font-extrabold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:opacity-95 transition-all disabled:opacity-60"
            >
              {busy === "discord" ? <Loader2 className="w-5 h-5 animate-spin" /> : <DiscordIcon />} 
              Continue with Discord
            </button>
          </div>

          {err && <p data-testid="auth-error" className="text-red-600 text-sm text-center mt-5 font-mono font-bold">{err}</p>}



          <p className="text-center mt-8">
            <Link to="/" className="text-[#E9D5FF]/50 hover:text-[#E9D5FF] text-sm font-semibold">← Back home</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}
