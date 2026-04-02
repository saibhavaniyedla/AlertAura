import { motion, AnimatePresence } from "motion/react";
import { User, Shield, Phone, Mail, Plus, X, LogOut, Edit2, Check, Camera, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { db, auth } from "../firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "", relation: "" });

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        setNewName(data.displayName || user.displayName || "");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: newName.trim()
      });
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
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
      setNewContact({ name: "", phone: "", email: "", relation: "" });
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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-black">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-cosmic-glow border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-32 pb-24 flex flex-col gap-8">
      {/* User Details Section */}
      <div className="glass-card p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cosmic-glow/10 to-transparent" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-cosmic-glow p-1 overflow-hidden">
              <img 
                src={userData?.photoURL || user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button className="absolute bottom-0 right-0 p-2 rounded-full bg-cosmic-glow text-white border-4 border-cosmic-black hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-center md:justify-start gap-3">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-white/5 border border-cosmic-glow rounded-lg px-3 py-1 text-2xl font-display font-bold text-white focus:outline-none"
                      autoFocus
                    />
                    <button onClick={handleUpdateName} className="p-2 rounded-lg bg-cosmic-safe/20 text-cosmic-safe hover:bg-cosmic-safe/40">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-display font-bold text-white">{userData?.displayName || user?.displayName || "User"}</h2>
                    <button onClick={() => setIsEditingName(true)} className="p-2 rounded-lg text-slate-500 hover:text-cosmic-glow transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-cosmic-glow uppercase tracking-widest">
                Celestial Guardian
              </div>
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-cosmic-safe uppercase tracking-widest">
                Verified Account
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 text-cosmic-danger hover:bg-cosmic-danger/10 transition-all"
            title="Logout"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Emergency Contacts Section */}
      <div className="glass-card p-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-cosmic-glow w-6 h-6" />
            <h3 className="text-2xl font-display font-bold text-white">Emergency Contacts</h3>
          </div>
          <button 
            onClick={() => setShowAddContact(!showAddContact)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              showAddContact ? 'bg-white/10 text-white' : 'bg-cosmic-glow text-white shadow-lg shadow-cosmic-glow/20 hover:scale-105'
            }`}
          >
            {showAddContact ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddContact ? 'Cancel' : 'Add Contact'}
          </button>
        </div>

        <AnimatePresence>
          {showAddContact && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddContact}
              className="flex flex-col gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cosmic-glow"
                    value={newContact.name}
                    onChange={e => setNewContact({...newContact, name: e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Relationship</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Spouse, Parent"
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cosmic-glow"
                    value={newContact.relation}
                    onChange={e => setNewContact({...newContact, relation: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000"
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cosmic-glow"
                    value={newContact.phone}
                    onChange={e => setNewContact({...newContact, phone: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="contact@example.com"
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cosmic-glow"
                    value={newContact.email}
                    onChange={e => setNewContact({...newContact, email: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="mt-2 py-4 rounded-xl bg-cosmic-glow text-white font-bold hover:bg-cosmic-glow/80 transition-all shadow-lg"
              >
                Save Emergency Contact
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userData?.emergencyContacts?.length > 0 ? (
            userData.emergencyContacts.map((contact: any) => (
              <motion.div 
                layout
                key={contact.id}
                className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cosmic-glow/20 flex items-center justify-center text-cosmic-glow font-bold text-xl">
                    {contact.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{contact.name}</span>
                    <span className="text-xs text-slate-500">{contact.relation || 'Emergency Contact'}</span>
                    <div className="flex items-center gap-3 mt-1">
                      {contact.phone && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {contact.phone}
                        </span>
                      )}
                      {contact.email && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeContact(contact)}
                  className="p-2 rounded-lg text-slate-600 hover:text-cosmic-danger hover:bg-cosmic-danger/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Remove Contact"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 py-12 flex flex-col items-center justify-center gap-4 text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
              <Users className="w-12 h-12 opacity-20" />
              <p className="font-medium text-sm">No emergency contacts added yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
