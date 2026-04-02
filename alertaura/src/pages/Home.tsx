import { motion } from "motion/react";
import { Shield, Bell, Map, Brain, ChevronRight, Star, Users, Lock, Zap, Mic, Phone, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Celestial Mapping",
    description: "Live location tracking with AI-powered area safety insights.",
    icon: Map,
    color: "bg-blue-500/20 text-blue-400",
    link: "/map"
  },
  {
    title: "AI Intelligence",
    description: "Neural analysis of threats and situational awareness feed.",
    icon: Brain,
    color: "bg-purple-500/20 text-purple-400",
    link: "/ai"
  },
  {
    title: "Emergency SOS",
    description: "One-tap manual trigger and automatic threat detection.",
    icon: Bell,
    color: "bg-red-500/20 text-red-400",
    link: "/sos"
  },
  {
    title: "Safe Navigation",
    description: "Optimized routes based on real-time safety data.",
    icon: Shield,
    color: "bg-emerald-500/20 text-emerald-400",
    link: "/map"
  }
];

const steps = [
  {
    title: "Detection",
    description: "AI monitors your aura and surroundings for anomalies.",
    icon: Zap
  },
  {
    title: "Analysis",
    description: "Neural engine evaluates the threat level instantly.",
    icon: Brain
  },
  {
    title: "Intervention",
    description: "Seamless alerts sent to emergency contacts and authorities.",
    icon: Shield
  }
];

export function Home() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-cosmic-glow/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-cosmic-purple/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-cosmic-glow mb-8"
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Trusted by 50,000+ users worldwide</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-bold tracking-tighter mb-8 leading-[0.9]"
          >
            Your Celestial <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cosmic-glow via-white to-cosmic-purple">
              Guardian Powered by AI
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            AlertAura provides seamless situational awareness and emergency response, ensuring your safety in an unpredictable world.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/sos" className="w-full sm:w-auto px-8 py-4 rounded-full cosmic-gradient text-lg font-bold glow-button flex items-center justify-center gap-2">
              Get Started Now
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Unique Features Section */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">Unique Features</h2>
          <p className="text-slate-400 max-w-xl mx-auto">AlertAura isn't just an app; it's an intelligent system designed to predict and prevent danger.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Neural Aura Scan",
              desc: "AI-driven analysis of your surroundings via camera and text to detect hidden risks and suspicious patterns.",
              icon: Brain,
              color: "bg-purple-500/20 text-purple-400"
            },
            {
              title: "Automated Voice SOS",
              desc: "Continuous background monitoring for distress keywords like 'Help' or 'Save me'. Triggers SOS instantly.",
              icon: Mic,
              color: "bg-red-500/20 text-red-400"
            },
            {
              title: "SafeRoute Navigation",
              desc: "Intelligent navigation that prioritizes well-lit and secure paths by analyzing real-time crime data.",
              icon: Map,
              color: "bg-emerald-500/20 text-emerald-400"
            },
            {
              title: "AI Fake Call",
              desc: "Simulate a realistic incoming call to deter unwanted attention when you feel uncomfortable in public.",
              icon: Phone,
              color: "bg-blue-500/20 text-blue-400"
            },
            {
              title: "Smart SOS Trigger",
              desc: "Manual and automated triggers that send live location and audio recordings to emergency contacts.",
              icon: Zap,
              color: "bg-orange-500/20 text-orange-400"
            },
            {
              title: "Aura Modulation",
              desc: "Adjust the sensitivity of AI detection based on your comfort level and current environment.",
              icon: Activity,
              color: "bg-cyan-500/20 text-cyan-400"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="glass-card p-8 flex flex-col gap-6 group"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Requirements Section */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="glass-card p-12 md:p-24 flex flex-col items-center text-center">
          <div className="flex flex-col gap-8 max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-tight">
              Our <br />
              <span className="text-cosmic-glow">Requirements</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              To provide the best protection, AlertAura requires a few simple permissions and setup steps to ensure the AI can act effectively.
            </p>
            <div className="flex flex-col gap-6 text-left">
              {[
                { title: "Location Access", desc: "For real-time tracking and SafeRoute navigation." },
                { title: "Microphone Access", desc: "For automated voice distress keyword detection." },
                { title: "Camera Access", desc: "For Neural Aura scanning and threat analysis." },
                { title: "Emergency Contacts", desc: "To notify your loved ones instantly when danger is detected." }
              ].map((req, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-cosmic-glow/20 flex items-center justify-center text-cosmic-glow font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-display font-bold text-white">{req.title}</h4>
                    <p className="text-sm text-slate-400">{req.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
