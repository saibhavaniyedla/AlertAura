/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { SOS } from "./pages/SOS";
import { Map } from "./pages/Map";
import { Intelligence } from "./pages/Intelligence";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { VoiceDetection } from "./pages/VoiceDetection";
import { StarsBackground } from "./components/StarsBackground";

const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cosmic-black text-white">Loading Aura...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isMapPage = location.pathname === "/map";
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col selection:bg-cosmic-glow/30 selection:text-white relative">
      <StarsBackground />
      {!isLoginPage && <Navbar />}
      <main className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/sos" element={<ProtectedRoute><SOS /></ProtectedRoute>} />
          <Route path="/voice" element={<ProtectedRoute><VoiceDetection /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><Intelligence /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </main>
      {!isLoginPage && !isMapPage && <Footer />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <Router>
        <ScrollToTop />
        <AppLayout />
      </Router>
    </AuthContext.Provider>
  );
}
