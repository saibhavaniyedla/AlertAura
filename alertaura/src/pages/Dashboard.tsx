import { motion } from "motion/react";
import { Shield, AlertTriangle, History, Phone, User, Activity, MapPin, ChevronRight, Zap, Info } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const scenarioRisks: Record<string, "Low" | "Medium" | "High"> = {
  "Walking alone at night": "High",
  "In a crowded public transport": "Low",
  "Meeting a stranger": "Medium",
  "Unfamiliar neighborhood": "High",
  "Late night work shift": "Medium",
  "Traveling in a taxi/cab": "High",
  "Walking through a park": "Medium",
  "Waiting at a bus stop": "Low",
  "Attending a large event": "Low",
  "Returning from a party": "Medium"
};

export function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [scenario, setScenario] = useState("Walking alone at night");
  const [isCalling, setIsCalling] = useState(false);

  const currentRiskLevel = useMemo(() => scenarioRisks[scenario] || "Low", [scenario]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "alerts"),
      where("uid", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setHistory(data);
    });
  }, [user]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!user || !scenario) return;
    logActivity("Scenario Change", `User shifted focus to: ${scenario}`, "info");
  }, [scenario]);

  const safetyScore = useMemo(() => {
    let score = 100;
    history.forEach(alert => {
      if (alert.status === 'danger') score -= 15;
      else if (alert.status === 'warning' || alert.status === 'active') score -= 5;
    });
    return Math.max(0, score);
  }, [history]);

  const logActivity = async (type: string, message: string, status: string = "info") => {
    if (!user) return;
    
    const getLocation = (): Promise<{ lat: number; lng: number }> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ lat: 0, lng: 0 });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            resolve({ lat: 0, lng: 0 });
          },
          { timeout: 5000 }
        );
      });
    };

    try {
      const location = await getLocation();
      await addDoc(collection(db, "alerts"), {
        uid: user.uid,
        type,
        message,
        status,
        timestamp: serverTimestamp(),
        location
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const handleCheckIn = () => {
    logActivity("Safe Check-in", "User confirmed they are safe at their current location", "safe");
    alert("Check-in successful! Your location has been logged.");
  };

  const startFakeCall = () => {
    setIsCalling(true);
    logActivity("AI Fake Call", "User initiated a fake safety call", "info");
    
    const callWindow = window.open('/voice.html', '_blank');
    
    if (!callWindow) {
      alert("Please allow popups to start the AI Fake Call.");
    }

    setTimeout(() => setIsCalling(false), 5000);
  };

  const analyzeScenario = () => {
    logActivity("Scenario Analysis", `Analyzed scenario: ${scenario}`, "info");
    alert(`AI Analysis complete for: ${scenario}. Current Risk: ${currentRiskLevel}. Stay alert.`);
  };

  const dynamicChartData = useMemo(() => {
    // Generate different chart data patterns based on risk level
    const base = [
      { time: "10:00", risk: 20, aura: 40 },
      { time: "11:00", risk: 35, aura: 30 },
      { time: "12:00", risk: 25, aura: 50 },
      { time: "13:00", risk: 45, aura: 45 },
      { time: "14:00", risk: 30, aura: 60 },
      { time: "15:00", risk: 55, aura: 40 },
      { time: "16:00", risk: 40, aura: 70 },
    ];

    if (currentRiskLevel === "High") {
      return base.map(d => ({ ...d, risk: d.risk + 30, aura: d.aura - 10 }));
    } else if (currentRiskLevel === "Medium") {
      return base.map(d => ({ ...d, risk: d.risk + 10 }));
    }
    return base;
  }, [currentRiskLevel]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Risk Level Visualization */}
      <div className="lg:col-span-8 flex flex-col gap-8">
        <div className={`glass-card p-8 flex flex-col gap-8 relative overflow-hidden transition-all duration-500 border-2 ${
          currentRiskLevel === 'High' ? 'border-cosmic-danger/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]' :
          currentRiskLevel === 'Medium' ? 'border-cosmic-glow/30 shadow-[0_0_50px_rgba(34,211,238,0.1)]' :
          'border-cosmic-safe/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]'
        }`}>
          {/* Animated Background Glow */}
          <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[120px] transition-colors duration-1000 ${
            currentRiskLevel === 'High' ? 'bg-cosmic-danger/20' :
            currentRiskLevel === 'Medium' ? 'bg-cosmic-glow/20' :
            'bg-cosmic-safe/20'
          }`} />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-display font-bold">Safety Dashboard</h2>
              <p className="text-slate-400 text-sm">
                {currentRiskLevel === 'High' ? 'Critical monitoring active. Stay in well-lit areas.' :
                 currentRiskLevel === 'Medium' ? 'Heightened awareness recommended for this scenario.' :
                 'Environment appears stable. Continue with normal precautions.'}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm uppercase tracking-widest transition-colors duration-500 ${
              currentRiskLevel === 'High' ? 'bg-cosmic-danger/20 text-cosmic-danger' :
              currentRiskLevel === 'Medium' ? 'bg-cosmic-glow/20 text-cosmic-glow' :
              'bg-cosmic-safe/20 text-cosmic-safe'
            }`}>
              {currentRiskLevel} Risk Scenario
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 group hover:bg-white/10 transition-colors">
              <Activity className={`w-8 h-8 transition-colors ${
                currentRiskLevel === 'High' ? 'text-cosmic-danger' : 'text-cosmic-glow'
              }`} />
              <div className="text-center">
                <div className="text-2xl font-bold">{safetyScore}%</div>
                <div className="text-xs text-slate-500 uppercase font-bold">Safety Score</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 group hover:bg-white/10 transition-colors">
              <MapPin className="w-8 h-8 text-cosmic-safe" />
              <div className="text-center">
                <div className="text-2xl font-bold">{currentRiskLevel === 'High' ? '5' : '12'}</div>
                <div className="text-xs text-slate-500 uppercase font-bold">SafePoints Nearby</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 group hover:bg-white/10 transition-colors">
              <Shield className={`w-8 h-8 transition-colors ${
                currentRiskLevel === 'High' ? 'text-cosmic-danger animate-pulse' : 'text-cosmic-purple'
              }`} />
              <div className="text-center">
                <div className="text-2xl font-bold">{currentRiskLevel === 'High' ? 'CRITICAL' : 'Active'}</div>
                <div className="text-xs text-slate-500 uppercase font-bold">Neural Link</div>
              </div>
            </div>
          </div>

          {/* Stacked Area/Line Chart */}
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Info className="w-4 h-4" />
              <span>Real-time Risk & Aura Modulation for {scenario}</span>
            </div>
            <div className="h-64 w-full bg-white/5 rounded-2xl border border-white/10 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicChartData}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentRiskLevel === 'High' ? "#ef4444" : "#f59e0b"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={currentRiskLevel === 'High' ? "#ef4444" : "#f59e0b"} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAura" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="risk" stroke={currentRiskLevel === 'High' ? "#ef4444" : "#f59e0b"} fillOpacity={1} fill="url(#colorRisk)" stackId="1" />
                  <Area type="monotone" dataKey="aura" stroke="#22d3ee" fillOpacity={1} fill="url(#colorAura)" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Fake Call Assistance */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-display font-bold">AI Fake Call Assistance</h3>
              <p className="text-slate-400 text-sm">Feeling uncomfortable? Trigger a realistic AI call to deter threats.</p>
            </div>
            <button 
              onClick={startFakeCall}
              className={`p-4 rounded-2xl transition-all ${
                isCalling ? 'bg-cosmic-danger text-white animate-pulse' : 'bg-cosmic-glow text-white hover:scale-105'
              }`}
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
          {isCalling && (
            <div className="p-4 rounded-xl bg-cosmic-danger/10 border border-cosmic-danger/20 text-cosmic-danger text-center font-bold">
              AI Safety Call Initiated... Check your new window.
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={handleCheckIn}
            className="glass-card p-6 flex items-center gap-4 hover:bg-white/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-cosmic-safe/20 flex items-center justify-center text-cosmic-safe group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-white">Safe Check-in</div>
              <div className="text-xs text-slate-500">Log your current location</div>
            </div>
          </button>
          <button 
            onClick={() => logActivity("Route Check", "User verified their current route", "info")}
            className="glass-card p-6 flex items-center gap-4 hover:bg-white/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-cosmic-purple/20 flex items-center justify-center text-cosmic-purple group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-white">Route Verify</div>
              <div className="text-xs text-slate-500">Confirm route safety</div>
            </div>
          </button>
        </div>
      </div>

      {/* Right Column: Scenarios & History */}
      <div className="lg:col-span-4 flex flex-col gap-8">
        {/* Scenario Selection */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <h3 className="text-xl font-display font-bold">Current Scenario</h3>
          <div className="relative">
            <select 
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-cosmic-glow appearance-none cursor-pointer"
            >
              {Object.keys(scenarioRisks).map(s => (
                <option key={s} value={s} className="bg-black text-white">{s}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 rotate-90 pointer-events-none" />
          </div>
          <button 
            onClick={analyzeScenario}
            className="w-full py-4 rounded-xl cosmic-gradient text-white font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
          >
            <Zap className="w-5 h-5" />
            Analyze Scenario
          </button>
        </div>
      </div>
    </div>
  );
}

