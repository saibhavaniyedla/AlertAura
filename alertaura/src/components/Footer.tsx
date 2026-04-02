import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="w-full bg-cosmic-black/80 backdrop-blur-md border-t border-white/5 py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 cosmic-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              AlertAura
            </span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Your celestial guardian in the digital and physical world. Powered by advanced AI to keep you safe, everywhere.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="font-display font-bold text-white tracking-tight uppercase text-xs">Product</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/sos" className="text-slate-400 hover:text-white transition-colors text-sm">Emergency SOS</Link></li>
            <li><Link to="/map" className="text-slate-400 hover:text-white transition-colors text-sm">Celestial Mapping</Link></li>
            <li><Link to="/ai" className="text-slate-400 hover:text-white transition-colors text-sm">AI Intelligence</Link></li>
            <li><Link to="/profile" className="text-slate-400 hover:text-white transition-colors text-sm">Safe Navigation</Link></li>
          </ul>
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="font-display font-bold text-white tracking-tight uppercase text-xs">Company</h4>
          <ul className="flex flex-col gap-3">
            <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">About Us</a></li>
            <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
            <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
            <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Contact Support</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-slate-500 text-xs">
          © 2026 AlertAura Technologies. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-slate-500 hover:text-white text-xs transition-colors">Privacy</a>
          <a href="#" className="text-slate-500 hover:text-white text-xs transition-colors">Terms</a>
          <a href="#" className="text-slate-500 hover:text-white text-xs transition-colors">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
