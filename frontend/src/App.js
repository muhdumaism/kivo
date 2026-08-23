import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth, isStaff } from "@/context/AuthContext";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import ProductDetail from "@/pages/ProductDetail";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import CreatorDashboard from "@/pages/CreatorDashboard";
import NewMod from "@/pages/NewMod";
import Policy from "@/pages/Policy";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import ReviewQueue from "@/pages/admin/ReviewQueue";
import Reports from "@/pages/admin/Reports";
import UsersTrust from "@/pages/admin/UsersTrust";
import AuditLog from "@/pages/admin/AuditLog";
import Anomaly from "@/pages/admin/Anomaly";

function Gate({ children, staff }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen bg-ink grid place-items-center"><span className="font-pixel text-lavender2/50 text-xl animate-pulse">loading kivo...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (staff && !isStaff(user)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" theme="dark" toastOptions={{ style: { background: "#191233", border: "1px solid #2E2456", color: "#ECE8FF", fontFamily: "Plus Jakarta Sans", fontSize: "13px", borderRadius: "14px" } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/item/:slug" element={<ProductDetail />} />
          <Route path="/mod/:slug" element={<ProductDetail />} />
          <Route path="/game/:slug" element={<Navigate to="/browse" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/profile" element={<Gate><Profile /></Gate>} />
          <Route path="/creator" element={<Gate><CreatorDashboard /></Gate>} />
          <Route path="/creator/new" element={<Gate><NewMod /></Gate>} />
          <Route path="/admin" element={<Gate staff><AdminLayout /></Gate>}>
            <Route index element={<AdminOverview />} />
            <Route path="queue" element={<ReviewQueue />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<UsersTrust />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="anomalies" element={<Anomaly />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
