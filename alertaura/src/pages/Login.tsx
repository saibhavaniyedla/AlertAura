import { motion, AnimatePresence } from "motion/react";
import { Shield, Mail, Lock, ChevronRight, Github, Chrome, Apple, AlertCircle, User, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const getFriendlyErrorMessage = (error: any) => {
    const code = error.code || "";
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Try logging in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters long.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/popup-closed-by-user":
        return "Login cancelled. Please try again.";
      case "auth/operation-not-allowed":
        return "Email/Password sign-in is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      default:
        return error.message || "An unexpected error occurred. Please try again.";
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        try {
          await setDoc(doc(db, "users", result.user.uid), {
            uid: result.user.uid,
            displayName: name,
            email: result.user.email,
            photoURL: null,
            role: "user",
            auraSensitivity: "Medium",
            autoDetect: true,
            emergencyContacts: []
          });
        } catch (firestoreErr) {
          console.error("Firestore setup failed:", firestoreErr);
          // We don't necessarily want to block the user if only Firestore fails, 
          // but they might have issues later. Let's at least log it.
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: "user",
          auraSensitivity: "Medium",
          autoDetect: true,
          emergencyContacts: []
        });
      }
      navigate("/");
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full glass-card p-12 flex flex-col gap-8 relative z-10"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 cosmic-gradient rounded-2xl flex items-center justify-center shadow-2xl mb-2">
            <Shield className="text-white w-10 h-10" />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "login"}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-2"
            >
              <h1 className="text-4xl font-display font-bold tracking-tighter text-white">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-slate-400 text-sm">
                {isSignUp ? "Join the AlertAura guardian network." : "Enter your credentials to access your celestial guardian."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-cosmic-danger/10 border border-cosmic-danger/20 flex items-center gap-3 text-cosmic-danger text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form className="flex flex-col gap-4" onSubmit={handleAuth}>
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                <label className="text-xs font-label font-bold text-slate-500 uppercase tracking-widest px-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cosmic-glow transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-label font-bold text-slate-500 uppercase tracking-widest px-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cosmic-glow transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2">
              <label className="text-xs font-label font-bold text-slate-500 uppercase tracking-widest">Password</label>
              {!isSignUp && <a href="#" className="text-xs font-bold text-cosmic-glow hover:underline">Forgot?</a>}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cosmic-glow transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl cosmic-gradient text-white font-bold text-lg glow-button mt-4 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isSignUp ? "Create Account" : "Login to AlertAura"}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="glass-card p-4 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-6 h-6 text-cosmic-glow animate-spin" />
            ) : (
              <Chrome className="w-6 h-6 text-slate-300" />
            )}
          </button>
          <button className="glass-card p-4 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Apple className="w-6 h-6 text-slate-300" />
          </button>
          <button className="glass-card p-4 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Github className="w-6 h-6 text-slate-300" />
          </button>
        </div>

        <p className="text-center text-sm text-slate-500">
          {isSignUp ? "Already have an account?" : "Don't have an account?"} 
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-cosmic-glow font-bold hover:underline ml-1"
          >
            {isSignUp ? "Login" : "Sign up for free"}
          </button>
        </p>

        <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
          <Lock className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
        </div>
      </motion.div>
    </div>
  );
}
