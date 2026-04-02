import { motion } from "motion/react";
import { Brain, Zap, Shield, AlertTriangle, History, Search, ChevronRight, Info, Star, Lock, Activity, Eye, MessageSquare, Mic, Camera, Upload, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { analyzeSafety } from "../services/gemini";

export function Intelligence() {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'camera'>('text');
  const [situation, setSituation] = useState("");
  const [scans, setScans] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanResults, setScanResults] = useState([
    { label: "Aura Stability", value: "98%", status: "safe" },
    { label: "Surrounding Threats", value: "None", status: "safe" },
    { label: "Neural Load", value: "Low", status: "safe" },
    { label: "SafePoints Nearby", value: "12", status: "info" }
  ]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "scans"),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScans(scansData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    if (!user) return;
    setIsScanning(true);
    setAnalysisResult(null);
    
    try {
      const result = await analyzeSafety({
        user_input: situation || "General environment scan",
        scenario: "Manual Neural Scan",
        location: "Current GPS Location (Mocked)",
        image: selectedImage ? {
          data: selectedImage.split(',')[1],
          mimeType: "image/jpeg"
        } : undefined
      });

      if (result) {
        setAnalysisResult(result);
        await addDoc(collection(db, "users", user.uid, "scans"), {
          uid: user.uid,
          type: "Neural Aura Scan",
          result: result.riskLevel,
          score: result.riskLevel === 'Low' ? 95 : result.riskLevel === 'Medium' ? 60 : 20,
          timestamp: serverTimestamp(),
          details: result.reason,
          observedRisks: result.observedRisks,
          advice: result.advice,
          immediateAction: result.immediateAction
        });

        if (result.shouldTriggerSOS) {
          await addDoc(collection(db, "alerts"), {
            uid: user.uid,
            type: "AI Triggered SOS",
            status: "danger",
            timestamp: serverTimestamp(),
            message: `AI detected high risk: ${result.reason}`,
          });
          alert("AI DETECTED HIGH RISK! SOS TRIGGERED.");
        }
      }
    } catch (error) {
      console.error("Error during scan:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const submitAnalysis = async () => {
    if (!user || !situation) return;
    startScan(); // Use the same scan logic for submission
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Neural Analysis */}
      <div className="lg:col-span-8 flex flex-col gap-8">
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[450px]">
          {/* Background Neural Network Effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/10 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-cosmic-glow" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl cosmic-gradient flex items-center justify-center shadow-lg">
                <Brain className="text-white w-7 h-7" />
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">AI Intelligence</h2>
            </div>
            
            <p className="text-slate-400 max-w-xl mx-auto">
              Neural analysis of your surroundings and personal aura to detect potential threats before they manifest.
            </p>

            {analysisResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full p-6 rounded-2xl border-2 text-left flex flex-col gap-4 ${
                  analysisResult.riskLevel === 'High' ? 'bg-cosmic-danger/10 border-cosmic-danger' :
                  analysisResult.riskLevel === 'Medium' ? 'bg-cosmic-glow/10 border-cosmic-glow' :
                  'bg-cosmic-safe/10 border-cosmic-safe'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold uppercase tracking-widest">{analysisResult.riskLevel} Risk</span>
                  <Shield className={analysisResult.riskLevel === 'High' ? 'text-cosmic-danger' : 'text-cosmic-safe'} />
                </div>
                <p className="text-white font-medium">{analysisResult.reason}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Advice</h4>
                    <ul className="text-sm text-slate-300 list-disc pl-4">
                      {analysisResult.advice.map((a: string, i: number) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Immediate Action</h4>
                    <p className="text-sm text-white font-bold">{analysisResult.immediateAction}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {scanResults.map((result, i) => (
                <div key={i} className="glass-card p-6 flex flex-col items-center gap-2 group hover:bg-white/10 transition-all">
                  <span className="text-xs font-label font-bold text-slate-500 uppercase tracking-widest">{result.label}</span>
                  <span className={`text-2xl font-display font-bold ${
                    result.status === 'safe' ? 'text-cosmic-safe' : 'text-cosmic-glow'
                  }`}>
                    {result.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={startScan}
              disabled={isScanning}
              className={`mt-8 px-12 py-5 rounded-full font-bold text-xl transition-all duration-500 flex items-center gap-3 ${
                isScanning 
                  ? "bg-white/5 text-slate-400 cursor-not-allowed" 
                  : "cosmic-gradient text-white glow-button"
              }`}
            >
              {isScanning ? (
                <>
                  <Activity className="w-6 h-6 animate-pulse" />
                  Analyzing Neural Patterns...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  Initiate Neural Scan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input Feed */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display font-bold text-white">Situation Analysis Feed</h3>
            <div className="flex gap-2">
              {[
                { id: 'text', icon: MessageSquare },
                { id: 'voice', icon: Mic },
                { id: 'camera', icon: Camera }
              ].map((mode) => (
                <button 
                  key={mode.id}
                  onClick={() => {
                    setInputMode(mode.id as any);
                    if (mode.id === 'camera') fileInputRef.current?.click();
                  }}
                  className={`p-3 rounded-xl transition-all ${
                    inputMode === mode.id ? 'bg-cosmic-glow text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <mode.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload}
          />

          {selectedImage && (
            <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-white/10">
              <img src={selectedImage} alt="Selected" className="w-full h-auto" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="relative">
            <textarea 
              placeholder={
                inputMode === 'text' ? "Describe your current situation or surroundings..." :
                inputMode === 'voice' ? "Listening for situation description..." :
                "Analyzing camera feed for threats..."
              }
              value={situation}
              onChange={e => setSituation(e.target.value)}
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder:text-slate-500 focus:outline-none focus:border-cosmic-glow transition-all resize-none"
            />
            <button 
              onClick={submitAnalysis}
              disabled={isScanning}
              className="absolute bottom-4 right-4 p-3 rounded-xl bg-cosmic-glow text-white hover:bg-cosmic-glow/80 transition-colors shadow-lg disabled:opacity-50"
            >
              <Zap className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {["Suspicious Person", "Poor Lighting", "Crowded Area", "Unfamiliar Path"].map((tag) => (
              <button 
                key={tag} 
                onClick={() => setSituation(prev => prev + (prev ? ", " : "") + tag)}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:border-white/30 transition-all"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Insights & Logs */}
      <div className="lg:col-span-4 flex flex-col gap-8">
        {/* Threat Level */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-white">Global Threat Level</h3>
            <Info className="text-slate-500 w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Circular Progress Mockup */}
              <svg className="w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" className="text-white/5" />
                <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="502" strokeDashoffset={analysisResult?.riskLevel === 'High' ? '100' : analysisResult?.riskLevel === 'Medium' ? '300' : '450'} className={analysisResult?.riskLevel === 'High' ? 'text-cosmic-danger' : 'text-cosmic-safe'} />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-display font-bold text-white">{analysisResult?.riskLevel || 'Low'}</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Aura Status</span>
              </div>
            </div>
            <div className="flex gap-4 w-full">
              <div className="flex-1 p-3 rounded-xl bg-white/5 text-center">
                <div className="text-lg font-bold text-white">12%</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Anomaly</div>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-white/5 text-center">
                <div className="text-lg font-bold text-white">98%</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Confidence</div>
              </div>
            </div>
          </div>
        </div>

        {/* Threat Logs */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-white">Threat Logs</h3>
            <History className="text-slate-500 w-5 h-5" />
          </div>
          <div className="flex flex-col gap-4">
            {scans.length > 0 ? scans.map((scan, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  scan.result === 'Low' ? 'bg-cosmic-safe/20 text-cosmic-safe' : 'bg-cosmic-glow/20 text-cosmic-glow'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">{scan.type}: {scan.result}</span>
                    <span className="text-[10px] text-slate-500">{scan.timestamp?.toDate().toLocaleTimeString() || "Just now"}</span>
                  </div>
                  <span className="text-xs text-slate-500 line-clamp-1">{scan.details}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-4 text-slate-500 text-sm italic">No threat logs available.</div>
            )}
          </div>
          <button className="w-full py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-colors">
            Clear Logs
          </button>
        </div>

        {/* AI Capabilities */}
        <div className="glass-card p-8 flex flex-col gap-4">
          <h3 className="text-xl font-display font-bold text-white">Active Neural Links</h3>
          {[
            { name: "Visual Recognition", icon: Eye, status: "Active" },
            { name: "Audio Analysis", icon: Mic, status: "Active" },
            { name: "Biometric Sync", icon: Activity, status: "Active" }
          ].map((cap, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <cap.icon className="w-4 h-4 text-cosmic-glow" />
                <span className="text-sm font-medium text-slate-300">{cap.name}</span>
              </div>
              <span className="text-[10px] font-bold text-cosmic-safe uppercase tracking-widest">{cap.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
