import { Navbar } from "@/components/qiveo/Navbar";
import { Link } from "react-router-dom";
import { Footer } from "@/pages/Home";

export default function Policy() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
        <h1 className="font-heading text-4xl font-black uppercase tracking-tighter text-warm mb-2">Content &amp; Trust Policy</h1>
        <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-8">// consistent · appealable · public</p>

        <div className="space-y-8 text-warm/80 leading-relaxed">
          <Section title="What's Allowed">
            Original mods, forks with compatible licenses, and modpacks whose contents are all individually allowed. Every file — and every new version — is scanned and reviewed before it goes live.
          </Section>
          <Section title="Strictly Banned (no manual override)">
            CSAM and illegal imagery are hash-scanned on every upload, auto-quarantined, and routed to a mandatory legal reporting pipeline. There is no "approve anyway" path.
          </Section>
          <Section title="Prohibited">
            Malware, spyware, cryptominers, obfuscated exfiltration code, ripped commercial assets, stolen paid mods, phishing links, doxxing, and impersonation of other creators.
          </Section>
          <Section title="DMCA">
            Rights holders may file a takedown via our intake form. Counter-notices are supported. Repeat infringers accrue strikes leading to suspension. Our registered DMCA agent handles all US filings.
          </Section>
          <Section title="Privacy (GDPR / COPPA)">
            Accounts require an age gate at signup. Under-18 accounts get minimal data collection and no targeted ads. Users can export or delete their data at any time.
          </Section>
          <Section title="Accounts & Security">
            Qiveo uses OAuth-only login (Google / Discord) — no passwords stored. Creators must enable 2FA to publish. Staff can revoke sessions if a linked account is compromised.
          </Section>
        </div>

        <Link to="/" className="inline-block mt-10 font-mono text-xs uppercase tracking-widest text-amber hover:underline">← Back to Qiveo</Link>
      </div>
      <Footer />
    </div>
  );
}

const Section = ({ title, children }) => (
  <div className="border-l-2 border-teal pl-4">
    <h2 className="font-heading text-lg font-bold text-warm mb-1.5 uppercase tracking-tight">{title}</h2>
    <p>{children}</p>
  </div>
);
