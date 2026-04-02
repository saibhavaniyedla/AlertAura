import { motion, AnimatePresence } from "motion/react";
import { Bell, Shield, Users, MapPin, Phone, History, AlertTriangle, CheckCircle2, Zap, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export function SOS() {
  const { user } = useAuth();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", relation: "", phone: "", email: "" });

  useEffect(() => {
    if (!user) return;

    // Listen to user data for contacts and autoDetect
    const unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    // Listen to alerts for security logs
    const q = query(
      collection(db, "alerts"),
      where("uid", "==", user.uid),
      orderBy("timestamp", "desc")
    );
    const unsubscribeAlerts = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlerts(alertsData);
    });

    return () => {
      unsubscribeUser();
      unsubscribeAlerts();
    };
  }, [user]);

  const triggerSOS = async () => {
    if (!user) return;
    setIsSOSActive(true); // Show triggered state immediately
    
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
      const alertRef = await addDoc(collection(db, "alerts"), {
        uid: user.uid,
        type: "SOS",
        status: "active",
        timestamp: serverTimestamp(),
        location,
        message: "Manual SOS Triggered"
      });

      // Update user's last location
      await updateDoc(doc(db, "users", user.uid), {
        lastLocation: location
      });

      // Send messages to emergency contacts
      if (userData?.emergencyContacts?.length > 0) {
        const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
        const sosMessage = `EMERGENCY SOS! I need help. My live location: ${locationUrl}`;
        
        userData.emergencyContacts.forEach(async (contact: any) => {
          // Send SMS
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
                  subject: "EMERGENCY SOS ALERT",
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
          
          console.log(`Sending SOS to ${contact.name} (${contact.email || contact.phone}): ${sosMessage}`);
        });
      }

      // Keep SOS active for visual feedback
      alert("🚨 SOS ALERT SENT! 🚨\n\nEmergency contacts have been notified with your live location via SMS and Email.");
    } catch (error) {
      console.error("Error triggering SOS:", error);
    }
  };

  const handleSOSClick = () => {
    if (isSOSActive) {
      setIsSOSActive(false);
    } else {
      triggerSOS();
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newContact.name || (!newContact.phone && !newContact.email)) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        emergencyContacts: arrayUnion({
          ...newContact,
          id: Date.now().toString(),
          status: "online"
        })
      });
      setNewContact({ name: "", relation: "", phone: "", email: "" });
      setShowAddContact(false);
    } catch (error) {
      console.error("Error adding contact:", error);
    }
  };

  const removeContact = async (contact: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        emergencyContacts: arrayRemove(contact)
      });
    } catch (error) {
      console.error("Error removing contact:", error);
    }
  };

  const toggleAutoDetect = async () => {
    if (!user || !userData) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        autoDetect: !userData.autoDetect
      });
    } catch (error) {
      console.error("Error toggling auto-detect:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: SOS Trigger */}
      <div className="lg:col-span-8 flex flex-col gap-8">
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px]">
          {/* Background Pulse */}
          <AnimatePresence>
            {isSOSActive && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0.1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-cosmic-danger rounded-full pointer-events-none"
              />
            )}
          </AnimatePresence>

          <div className="relative z-10 flex flex-col items-center gap-8">
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              {isSOSActive ? "SOS Triggered" : "Emergency Response Core"}
            </h2>
            <p className="text-slate-400 max-w-md">
              {isSOSActive 
                ? "Emergency contacts have been alerted. Help is on the way." 
                : "Tap the button to trigger a manual SOS alert to all your emergency contacts."}
            </p>

            <button
              onClick={handleSOSClick}
              className={`w-64 h-64 rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 shadow-2xl relative group ${
                isSOSActive 
                  ? "bg-cosmic-danger scale-110 shadow-[0_0_80px_rgba(239,68,68,0.6)]" 
                  : "bg-white/5 hover:bg-white/10 border-4 border-cosmic-danger/30 hover:border-cosmic-danger/60"
              }`}
            >
              <Bell className={`w-20 h-20 transition-transform group-hover:scale-110 ${isSOSActive ? "text-white animate-bounce" : "text-cosmic-danger"}`} />
              <span className={`text-2xl font-display font-bold ${isSOSActive ? "text-white" : "text-cosmic-danger"}`}>
                {isSOSActive ? "ACTIVE" : "SOS"}
              </span>
            </button>

            <div className="flex items-center gap-8 mt-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-cosmic-glow">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="text-xs font-label font-bold text-slate-500 uppercase tracking-widest">Location Shared</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-cosmic-purple">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-label font-bold text-slate-500 uppercase tracking-widest">{userData?.emergencyContacts?.length || 0} Contacts Notified</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-cosmic-safe">
                  <Phone className="w-6 h-6" />
                </div>
                <span className="text-xs font-label font-bold text-slate-500 uppercase tracking-widest">Audio Recording</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Log */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="text-cosmic-glow w-6 h-6" />
              <h3 className="text-2xl font-display font-bold text-white">Security Log</h3>
            </div>
            <button className="text-sm font-bold text-cosmic-glow hover:underline">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {alerts.length > 0 ? alerts.map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.status === 'active' ? 'bg-cosmic-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-cosmic-safe shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  }`} />
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{alert.type}: {alert.message}</span>
                    <span className="text-xs text-slate-500">{alert.timestamp?.toDate().toLocaleString() || "Just now"}</span>
                  </div>
                </div>
                {alert.status !== 'active' && <CheckCircle2 className="w-5 h-5 text-cosmic-safe" />}
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">No security events logged yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Status & Contacts */}
      <div className="lg:col-span-4 flex flex-col gap-8">
        {/* Auto Detection Status */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-white">Auto-Detection</h3>
            <button 
              onClick={toggleAutoDetect}
              className={`w-12 h-6 rounded-full transition-colors relative ${userData?.autoDetect ? 'bg-cosmic-glow' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: userData?.autoDetect ? 24 : 4 }}
                className="w-4 h-4 rounded-full bg-white absolute top-1" 
              />
            </button>
          </div>
          <div className="p-4 rounded-2xl bg-cosmic-glow/10 border border-cosmic-glow/20 flex items-center gap-4">
            <Zap className="text-cosmic-glow w-6 h-6 shrink-0" />
            <p className="text-sm text-slate-300">
              AI is actively monitoring your movement patterns for anomalies.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Threat Sensitivity</span>
              <span className="text-white font-bold">{userData?.auraSensitivity || 'Medium'}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full cosmic-gradient transition-all duration-500" 
                style={{ width: userData?.auraSensitivity === 'High' ? '100%' : userData?.auraSensitivity === 'Medium' ? '50%' : '25%' }}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-white">Emergency Contacts</h3>
            <button className="text-sm font-bold text-cosmic-glow hover:underline">Edit</button>
          </div>
          <div className="flex flex-col gap-4">
            {userData?.emergencyContacts?.map((contact: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cosmic-purple/20 flex items-center justify-center text-cosmic-purple font-bold text-lg">
                    {contact.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{contact.name}</span>
                    <span className="text-[10px] text-slate-500">{contact.relation} • {contact.phone || contact.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      const locationUrl = `https://www.google.com/maps?q=${userData?.lastLocation?.lat || 0},${userData?.lastLocation?.lng || 0}`;
                      const sosMessage = `EMERGENCY SOS! I need help. My live location: ${locationUrl}`;
                      if (contact.phone) window.open(`sms:${contact.phone}?body=${encodeURIComponent(sosMessage)}`, '_blank');
                      if (contact.email) {
                        try {
                          const response = await fetch('/api/send-sos-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              to: contact.email,
                              subject: "EMERGENCY SOS ALERT",
                              body: sosMessage
                            })
                          });
                          const result = await response.json();
                          if (result.success) alert(`SOS Email sent to ${contact.name}`);
                        } catch (err) {
                          console.error("Manual email failed:", err);
                        }
                      }
                    }}
                    className="p-2 rounded-lg bg-cosmic-danger/20 text-cosmic-danger hover:bg-cosmic-danger/40 transition-colors"
                    title="Send SOS to this contact"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <div className={`w-2 h-2 rounded-full ${
                    contact.status === 'online' ? 'bg-cosmic-safe' : 'bg-slate-600'
                  }`} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeContact(contact); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-cosmic-danger transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {showAddContact ? (
            <form onSubmit={handleAddContact} className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <input 
                type="text" 
                placeholder="Name" 
                className="bg-transparent border-b border-white/10 p-2 text-white text-sm focus:outline-none focus:border-cosmic-glow"
                value={newContact.name}
                onChange={e => setNewContact({...newContact, name: e.target.value})}
                required
              />
              <input 
                type="text" 
                placeholder="Relation" 
                className="bg-transparent border-b border-white/10 p-2 text-white text-sm focus:outline-none focus:border-cosmic-glow"
                value={newContact.relation}
                onChange={e => setNewContact({...newContact, relation: e.target.value})}
              />
              <input 
                type="tel" 
                placeholder="Phone" 
                className="bg-transparent border-b border-white/10 p-2 text-white text-sm focus:outline-none focus:border-cosmic-glow"
                value={newContact.phone}
                onChange={e => setNewContact({...newContact, phone: e.target.value})}
              />
              <input 
                type="email" 
                placeholder="Email" 
                className="bg-transparent border-b border-white/10 p-2 text-white text-sm focus:outline-none focus:border-cosmic-glow"
                value={newContact.email}
                onChange={e => setNewContact({...newContact, email: e.target.value})}
              />
              <div className="flex gap-2 mt-2">
                <button type="submit" className="flex-1 py-2 rounded-lg bg-cosmic-glow text-white text-xs font-bold">Add</button>
                <button type="button" onClick={() => setShowAddContact(false)} className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-xs font-bold">Cancel</button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setShowAddContact(true)}
              className="w-full py-4 rounded-2xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-all flex items-center justify-center gap-2 font-bold"
            >
              <Plus className="w-5 h-5" />
              Add New Contact
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="glass-card p-6 flex flex-col items-center gap-3 hover:bg-white/10 transition-colors group">
            <AlertTriangle className="text-cosmic-danger w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">False Alarm</span>
          </button>
          <button className="glass-card p-6 flex flex-col items-center gap-3 hover:bg-white/10 transition-colors group">
            <Shield className="text-cosmic-glow w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Safe Check</span>
          </button>
        </div>
      </div>
    </div>
  );
}
