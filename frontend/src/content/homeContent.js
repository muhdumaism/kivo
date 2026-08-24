import { ShieldCheck, Coins, Sparkles, LayoutTemplate, Rocket, HeartHandshake } from "lucide-react";

export const FEATURES = [
  {
    id: "f1",
    title: "Developer First",
    description: "Built by creators, for creators. Generous revenue splits and a robust API to automate your workflow.",
    icon: Rocket
  },
  {
    id: "f2",
    title: "Curated Drops",
    description: "Every item is human-reviewed. No spam, no low-effort cash grabs, just high-quality content.",
    icon: ShieldCheck
  },
  {
    id: "f3",
    title: "Instant Payouts",
    description: "Get paid instantly. Seamless integration with Stripe means the money goes straight to your account.",
    icon: Coins
  },
  {
    id: "f4",
    title: "Premium Aesthetics",
    description: "Your work deserves a beautiful showcase. Our platform is designed to make your drops look their best.",
    icon: Sparkles
  },
  {
    id: "f5",
    title: "Easy Management",
    description: "Manage versions, changelogs, and supported game loaders with an intuitive creator dashboard.",
    icon: LayoutTemplate
  },
  {
    id: "f6",
    title: "Community Driven",
    description: "Connect with players, gather feedback, and grow your audience in a non-toxic, supportive environment.",
    icon: HeartHandshake
  }
];

export const FAQS = [
  {
    id: "q1",
    question: "How do I upload a drop to Qiveo?",
    answer: "Simply sign in with Discord, navigate to the Creator Dashboard, and click 'New Drop'. You can fill out the details and upload your artifact in just a few clicks."
  },
  {
    id: "q2",
    question: "What platforms and games do you support?",
    answer: "We currently support Minecraft (Plugins, Server Setups, Builds, Textures), Roblox, Hytale, and Discord bots. We are always looking to expand our supported platforms!"
  },
  {
    id: "q3",
    question: "How does the revenue split work?",
    answer: "We take a flat, minimal platform fee to cover server costs and payment processing. The vast majority of the revenue goes directly to you, the creator."
  },
  {
    id: "q4",
    question: "Is there an approval process for new projects?",
    answer: "Yes, to maintain a high-quality marketplace, all new drops are human-reviewed before they go live. Verified creators skip this queue."
  },
  {
    id: "q5",
    question: "Can I offer free downloads alongside paid ones?",
    answer: "Absolutely! You can choose to list your project for free, or set a price. We believe in supporting both open-source and commercial creators."
  }
];
