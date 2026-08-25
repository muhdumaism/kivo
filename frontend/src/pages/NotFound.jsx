import { Link } from "react-router-dom";
import { Navbar } from "@/components/qiveo/Navbar";
import { Footer } from "@/components/qiveo/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="font-pixel text-8xl text-warm text-stroke mb-4">404</h1>
        <h2 className="font-heading font-extrabold text-2xl text-warm mb-8 text-center">Page Not Found</h2>
        <p className="text-warm/70 font-mono mb-8 max-w-md text-center">
          The requested page could not be found. It might have been removed, renamed, or temporarily unavailable.
        </p>
        <Link to="/" className="retro-btn-black px-6 py-3 font-heading font-bold text-lg">
          Return Home
        </Link>
      </main>
      <Footer />
    </div>
  );
}
