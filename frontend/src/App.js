import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth, isStaff } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import BackgroundPixelStars from "@/components/qiveo/BackgroundPixelStars";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import ProductDetail from "@/pages/ProductDetail";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import CreatorDashboard from "@/pages/CreatorDashboard";
import NewMod from "@/pages/NewMod";
import ProjectEdit from "@/pages/ProjectEdit";
import Collections from "@/pages/Collections";
import Policy from "@/pages/Policy";
import News from "@/pages/News";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import ReviewQueue from "@/pages/admin/ReviewQueue";
import Reports from "@/pages/admin/Reports";
import UsersTrust from "@/pages/admin/UsersTrust";
import AdminNews from "@/pages/admin/AdminNews";
import AdminContact from "@/pages/admin/AdminContact";
import AuditLog from "@/pages/admin/AuditLog";
import Anomaly from "@/pages/admin/Anomaly";

function Gate({ children, staff }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen bg-[#0A0A0C] grid place-items-center"><span className="font-pixel text-[#E9D5FF]/50 text-xl animate-pulse">loading qiveo...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (staff && !isStaff(user)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Toaster position="bottom-right" theme="light" toastOptions={{ style: { background: "#0A0A0C", border: "2px solid #E9D5FF", color: "#E9D5FF", fontFamily: "Plus Jakarta Sans", fontSize: "13px", borderRadius: "14px" } }} />
        <BrowserRouter>
          <BackgroundPixelStars />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/item/:slug" element={<ProductDetail />} />
            <Route path="/mod/:slug" element={<ProductDetail />} />
            <Route path="/game/:slug" element={<Navigate to="/browse" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/news" element={<News />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Gate><Profile /></Gate>} />
            <Route path="/collections" element={<Gate><Collections /></Gate>} />
            <Route path="/project/:slug/edit" element={<Gate><ProjectEdit /></Gate>} />
            <Route path="/creator" element={<Gate><CreatorDashboard /></Gate>} />
            <Route path="/creator/new" element={<Gate><NewMod /></Gate>} />
            <Route path="/admin" element={<Gate staff><AdminLayout /></Gate>}>
              <Route index element={<AdminOverview />} />
              <Route path="queue" element={<ReviewQueue />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<UsersTrust />} />
              <Route path="news" element={<AdminNews />} />
              <Route path="contact" element={<AdminContact />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="anomalies" element={<Anomaly />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;

