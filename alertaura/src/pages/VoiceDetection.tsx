import { motion, AnimatePresence } from "motion/react";
import { Mic, Shield, AlertTriangle, Zap, Activity, Volume2, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, onSnapshot, updateDoc } from "firebase/firestore";

export function VoiceDetection() {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  const [isSOSTriggered, setIsSOSTriggered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const lastTriggerTime = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const keywords = ["help", "hepl", "save me", "danger", "please help me", "stop", "emergency", "sos", "help me", "i am in danger", "call for help"];

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });
    return () => unsubscribe();
  }, [user]);

  const startVolumeAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setVolume(average);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.error("Error accessing microphone for volume analysis:", err);
    }
  };

  const stopVolumeAnalysis = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    setVolume(0);
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.results.length - 1;
        const transcriptText = event.results[current][0].transcript.toLowerCase().trim();
        setTranscript(transcriptText);
        
        // Check for keywords in the current transcript
        const found = keywords.filter(k => transcriptText.includes(k));
        if (found.length > 0) {
          setDetectedKeywords(prev => Array.from(new Set([...prev, ...found])));
          const now = Date.now();
          if (!isSOSTriggered && (now - lastTriggerTime.current > 15000)) { // 15 second cooldown
            lastTriggerTime.current = now;
            triggerAutoSOS(transcriptText);
            // Clear transcript after trigger to avoid repeated alerts
            setTranscript("");
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please enable it to use voice detection.");
        }
        setIsListening(false);
        stopVolumeAnalysis();
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          try {
            setTimeout(() => {
              if (isListening) {
                try {
                  recognitionRef.current.start();
                } catch (e) {}
              }
            }, 300);
          } catch (e) {}
        }
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      stopVolumeAnalysis();
    };
  }, [isListening]);

  const toggleListening = async () => {
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      stopVolumeAnalysis();
    } else {
      try {
        await recognitionRef.current.start();
        setIsListening(true);
        startVolumeAnalysis();
      } catch (e) {
        console.error("Manual start failed:", e);
        alert("Could not start microphone. Please check permissions.");
      }
    }
  };

  const triggerAutoSOS = async (message: string) => {
    if (!user) return;
    setIsSOSTriggered(true);
    setShowPopup(true);

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
        type: "Automated Voice SOS",
        status: "danger",
        timestamp: serverTimestamp(),
        message: `Voice keywords detected: ${message}`,
        location
      });

      // Update user's last location
      await updateDoc(doc(db, "users", user.uid), {
        lastLocation: location
      });

      // Send messages to emergency contacts
      if (userData?.emergencyContacts?.length > 0) {
        const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
        const sosMessage = `AUTOMATED VOICE SOS! Danger keywords detected. My live location: ${locationUrl}`;
        
        userData.emergencyContacts.forEach(async (contact: any) => {
          // Send SMS (still using sms: protocol as it's client-side)
          if (contact.phone) {
            const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(sosMessage)}`;
            if (userData.emergencyContacts.indexOf(contact) === 0) {
              window.open(smsUrl, '_blank');
            }
          }

          // Send Email via SMTP Backend
          if (contact.email) {
            try {
              const response = await fetch('/api/send-sos-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: contact.email,
                  subject: "AUTOMATED EMERGENCY SOS ALERT",
                  body: sosMessage
                })
              });
              const result = await response.json();
              if (result.success) {
                console.log(`Email sent successfully to ${contact.email}`);
              } else {
                console.error(`Failed to send email to ${contact.email}:`, result.error);
              }
            } catch (err) {
              console.error(`Error calling email API for ${contact.email}:`, err);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error triggering SOS:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-32 pb-24 flex flex-col gap-8">
      {/* SOS Status Banner */}
      <AnimatePresence>
        {isSOSTriggered && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className="w-full bg-cosmic-danger/20 border-2 border-cosmic-danger rounded-2xl p-6 flex items-center justify-between shadow-[0_0_30px_rgba(239,68,68,0.3)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-cosmic-danger/10 animate-pulse pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-cosmic-danger flex items-center justify-center animate-bounce">
                <AlertTriangle className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-display font-bold text-cosmic-danger uppercase tracking-tighter">SOS Active</h3>
                <p className="text-sm text-slate-300">Emergency contacts have been notified with your live location.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsSOSTriggered(false);
                setShowPopup(false);
              }}
              className="px-6 py-2 rounded-xl bg-cosmic-danger text-white font-bold text-sm hover:bg-cosmic-danger-strong transition-colors relative z-10"
            >
              Cancel Alert
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom SOS Popup */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card max-w-md w-full p-8 flex flex-col items-center text-center gap-6 border-2 border-cosmic-danger shadow-[0_0_50px_rgba(239,68,68,0.4)]"
            >
              <div className="w-20 h-20 rounded-full bg-cosmic-danger flex items-center justify-center animate-pulse">
                <AlertTriangle className="text-white w-10 h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-display font-bold text-cosmic-danger uppercase tracking-tighter">SOS TRIGGERED</h2>
                <p className="text-slate-300">
                  Danger keywords detected. Emergency contacts have been notified with your live location via SMS and Email.
                </p>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="w-full py-4 rounded-2xl bg-cosmic-danger text-white font-bold hover:bg-cosmic-danger-strong transition-all shadow-lg"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-8 relative overflow-hidden">
        <div className={`absolute inset-0 opacity-10 pointer-events-none transition-all duration-500 ${
          isListening ? 'bg-cosmic-glow animate-pulse' : 'bg-transparent'
        }`} />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl cosmic-gradient flex items-center justify-center shadow-lg">
              <Mic className="text-white w-7 h-7" />
            </div>
            <div className="flex flex-col items-start">
              <h2 className="text-4xl font-display font-bold tracking-tight">Voice Detection</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isSOSTriggered ? 'bg-cosmic-danger animate-pulse' : 'bg-cosmic-safe'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isSOSTriggered ? 'text-cosmic-danger' : 'text-cosmic-safe'}`}>
                  SOS System: {isSOSTriggered ? 'Triggered' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-slate-400 max-w-xl mx-auto">
            AlertAura continuously monitors for distress keywords. If you say "Help" or "Save me", an SOS is triggered automatically.
          </p>

          <div className="flex flex-col items-center gap-8 w-full">
            <button
              onClick={toggleListening}
              className={`w-48 h-48 rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 shadow-2xl relative ${
                isListening 
                  ? "bg-cosmic-glow text-white scale-110" 
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5 + (volume / 50), opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 rounded-full bg-cosmic-glow/30"
                  />
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-cosmic-glow/20"
                    style={{ transform: `scale(${1 + (volume / 100)})` }}
                  />
                </>
              )}
              <Mic className={`w-12 h-12 ${isListening ? 'animate-bounce' : ''}`} />
              <span className="font-bold uppercase tracking-widest text-xs">
                {isListening ? "Listening..." : "Start Monitoring"}
              </span>
              {isListening && (
                <div className="absolute -bottom-12 w-full flex flex-col items-center gap-2">
                  <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-cosmic-glow"
                      animate={{ width: `${Math.min(100, volume * 2)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mic Input</span>
                </div>
              )}
            </button>

            <div className="w-full flex flex-col gap-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Keywords Monitored</div>
              <div className="flex flex-wrap justify-center gap-3">
                {keywords.map((k) => (
                  <span 
                    key={k} 
                    className={`px-4 py-2 rounded-full border transition-all ${
                      detectedKeywords.includes(k) 
                        ? 'bg-cosmic-danger/20 border-cosmic-danger text-cosmic-danger scale-110' 
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Transcript */}
      <div className="glass-card p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-bold">Live Transcript</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-cosmic-glow animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-bold text-slate-500 uppercase">{isListening ? 'Active' : 'Idle'}</span>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 min-h-[150px] text-slate-300 italic">
          {transcript || "Speak to see live analysis..."}
        </div>
      </div>

      {/* AI Analysis Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center gap-3">
          <Activity className="w-6 h-6 text-cosmic-glow" />
          <div className="text-xs font-bold text-slate-500 uppercase">Neural Load</div>
          <div className="text-xl font-bold">Low</div>
        </div>
        <div className="glass-card p-6 flex flex-col items-center gap-3">
          <Volume2 className="w-6 h-6 text-cosmic-safe" />
          <div className="text-xs font-bold text-slate-500 uppercase">Ambient Noise</div>
          <div className="text-xl font-bold">32dB</div>
        </div>
        <div className={`glass-card p-6 flex flex-col items-center gap-3 border-2 transition-all duration-500 ${
          isSOSTriggered 
            ? 'border-cosmic-danger bg-cosmic-danger/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
            : 'border-transparent'
        }`}>
          <div className="relative">
            <Shield className={`w-6 h-6 transition-colors ${isSOSTriggered ? 'text-cosmic-danger' : 'text-cosmic-purple'}`} />
            {isSOSTriggered && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-cosmic-danger rounded-full"
              />
            )}
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">SOS Status</div>
          <div className={`text-xl font-bold transition-colors ${isSOSTriggered ? 'text-cosmic-danger animate-pulse' : 'text-white'}`}>
            {isSOSTriggered ? 'TRIGGERED' : 'Ready'}
          </div>
        </div>
      </div>
    </div>
  );
}
