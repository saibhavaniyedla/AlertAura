import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Map, Brain, User, Bell, Menu, X, LogOut, Activity, Mic, Home as HomeIcon } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../App";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const navItems = [
  { name: "Home", path: "/", icon: HomeIcon },
  { name: "Dashboard", path: "/dashboard", icon: Activity },
  { name: "SOS", path: "/sos", icon: Bell },
  { name: "Voice", path: "/voice", icon: Mic },
  { name: "Map", path: "/map", icon: Map },
  { name: "Intelligence", path: "/ai", icon: Brain },
  { name: "Profile", path: "/profile", icon: User },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="max-w-7xl mx-auto glass-card px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 cosmic-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Shield className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            AlertAura
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-cosmic-glow ${
                  isActive ? "text-cosmic-glow" : "text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-white leading-none">{user.displayName || user.email?.split('@')[0]}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Guardian</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-xl bg-white/5 hover:bg-cosmic-danger/10 hover:text-cosmic-danger transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden md:block px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
                Login
              </Link>
              <Link to="/login" className="px-5 py-2 rounded-full cosmic-gradient text-sm font-bold glow-button">
                Try Free
              </Link>
            </>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-4 right-4 md:hidden glass-card p-6 flex flex-col gap-4 shadow-2xl"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 text-lg font-medium p-3 rounded-xl transition-colors ${
                    isActive ? "bg-cosmic-glow/10 text-cosmic-glow" : "hover:bg-white/5 text-slate-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
            <hr className="border-white/10 my-2" />
            {user ? (
              <button 
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="text-center p-3 rounded-xl bg-cosmic-danger/10 text-cosmic-danger font-bold"
              >
                Logout
              </button>
            ) : (
              <Link 
                to="/login" 
                className="text-center p-3 rounded-xl bg-white/10 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
