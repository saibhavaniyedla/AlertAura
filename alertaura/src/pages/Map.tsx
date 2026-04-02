import { motion, AnimatePresence } from "motion/react";
import { Map as MapIcon, Navigation, Search, Shield, Info, Star, Clock, Zap, ChevronRight, MapPin, Target, Layers, Plus, X, Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../App";
import { db } from "../firebase";
import { collection, query, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader, setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { GoogleGenAI } from "@google/genai";

export function Map() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'map' | 'route'>('map');
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [safePoints, setSafePoints] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [safetyAnalysis, setSafetyAnalysis] = useState<string | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "users", user.uid, "safepoints"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const points = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSafePoints(points);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    (setOptions as any)({
      apiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["places"]
    });

    Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("places"),
      importLibrary("geometry")
    ]).then(() => {
      if (mapRef.current && !googleMapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 40.7128, lng: -74.0060 }, // Default NYC
          zoom: 13,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
            { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
            { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
            { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
            { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
            { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
            { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
          ],
          disableDefaultUI: true
        });

        googleMapRef.current = map;
        directionsServiceRef.current = new google.maps.DirectionsService();
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#3b82f6",
            strokeWeight: 6,
            strokeOpacity: 0.8
          }
        });

        // Get live location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentLocation(pos);
            map.setCenter(pos);
            map.setZoom(15);

            userMarkerRef.current = new google.maps.Marker({
              position: pos,
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff"
              },
              title: "Your Location"
            });
            
            // Set default origin to current location
            setOrigin("Current Location");
          });
        }
      }
    }).catch(err => {
      console.error("Error loading Google Maps:", err);
    });
  }, []);

  const findRoute = async () => {
    if (!origin || !destination || !directionsServiceRef.current || !directionsRendererRef.current) return;

    const originQuery = origin === "Current Location" && currentLocation ? currentLocation : origin;

    directionsServiceRef.current.route(
      {
        origin: originQuery,
        destination: destination,
        travelMode: google.maps.TravelMode.WALKING
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
          const route = result.routes[0].legs[0];
          setRouteInfo({
            distance: route.distance?.text,
            duration: route.duration?.text,
            steps: route.steps
          });
          analyzeRouteSafety(route.steps);
        } else {
          alert("Could not find route. Please check your locations.");
        }
      }
    );
  };

  const analyzeRouteSafety = async (steps: google.maps.DirectionsStep[]) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const stepTexts = steps.map(s => s.instructions).join(", ");
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the safety of this walking route based on these directions: ${stepTexts}. Provide a concise safety summary and a safety score out of 100. Focus on well-lit areas and public spaces.`,
      });

      setSafetyAnalysis(response.text);
    } catch (error) {
      console.error("Safety analysis failed:", error);
      setSafetyAnalysis("Safety analysis currently unavailable. Please stay alert.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addSafePoint = async () => {
    if (!user || !currentLocation) return;
    try {
      await addDoc(collection(db, "users", user.uid, "safepoints"), {
        uid: user.uid,
        name: destination || "New SafePoint",
        location: currentLocation,
        type: "shelter",
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding SafePoint:", error);
    }
  };

  return (
    <div className="w-full px-2 pt-20 pb-2 grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-80px)]">
      {/* Left Column: Controls & Insights */}
      <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {/* Tabs */}
        <div className="glass-card p-2 flex gap-2">
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'map' ? 'bg-cosmic-glow text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Mapping
          </button>
          <button 
            onClick={() => setActiveTab('route')}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'route' ? 'bg-cosmic-glow text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Navigation
          </button>
        </div>

        {activeTab === 'map' ? (
          <>
            {/* Search */}
            <div className="glass-card p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Search className="text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search areas..."
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 font-medium"
                />
              </div>
            </div>

            {/* SafePoints List */}
            <div className="glass-card p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="text-cosmic-safe w-5 h-5" />
                  <h3 className="text-xl font-display font-bold text-white">Your SafePoints</h3>
                </div>
                <button onClick={addSafePoint} className="p-2 rounded-lg bg-cosmic-safe/20 text-cosmic-safe hover:bg-cosmic-safe/40 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {safePoints.length > 0 ? safePoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-cosmic-safe/20 flex items-center justify-center text-cosmic-safe">
                      <Star className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <span className="text-white font-bold">{point.name}</span>
                      <span className="text-xs text-slate-500">{point.type}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-slate-500 text-sm italic">No SafePoints added yet.</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Route Inputs */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Origin</label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Target className="w-4 h-4 text-cosmic-glow" />
                  <input 
                    type="text" 
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Enter start location..."
                    className="bg-transparent border-none outline-none text-white w-full text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination</label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <MapPin className="w-4 h-4 text-cosmic-danger" />
                  <input 
                    type="text" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination..."
                    className="bg-transparent border-none outline-none text-white w-full text-sm"
                  />
                </div>
              </div>
              <button 
                onClick={findRoute}
                className="w-full py-4 rounded-2xl cosmic-gradient text-white font-bold glow-button mt-2"
              >
                Find Safest Route
              </button>
            </div>

            {/* Route Stats */}
            {routeInfo && (
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 flex flex-col gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold text-[10px]">Distance</span>
                  <span className="text-xl font-display font-bold text-white">{routeInfo.distance}</span>
                </div>
                <div className="glass-card p-4 flex flex-col gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold text-[10px]">Est. Time</span>
                  <span className="text-xl font-display font-bold text-white">{routeInfo.duration}</span>
                </div>
              </div>
            )}

            {/* Safety Analysis */}
            <AnimatePresence>
              {(isAnalyzing || safetyAnalysis) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 border-cosmic-glow/30 bg-cosmic-glow/5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="text-cosmic-glow w-5 h-5" />
                    <h3 className="text-lg font-display font-bold text-white">Safe Route Analysis</h3>
                  </div>
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3 text-slate-400 italic text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI is analyzing route safety...
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {safetyAnalysis}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Steps */}
            {routeInfo && (
              <div className="glass-card p-6 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <Clock className="text-slate-500 w-5 h-5" />
                  <h3 className="text-xl font-display font-bold text-white">Route Steps</h3>
                </div>
                <div className="flex flex-col gap-6 relative">
                  <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-white/10" />
                  {routeInfo.steps.map((step: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-slate-400">
                        <span className="text-xs font-bold">{i + 1}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div 
                          className="text-white text-sm font-medium"
                          dangerouslySetInnerHTML={{ __html: step.instructions }}
                        />
                        <span className="text-[10px] text-slate-500 uppercase font-bold">{step.distance.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Column: Map Interface */}
      <div className="lg:col-span-8 relative min-h-[400px] lg:min-h-0">
        <div ref={mapRef} className="w-full h-full glass-card overflow-hidden relative bg-cosmic-deep">
          {!(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY && (
            <div className="absolute inset-0 flex items-center justify-center bg-cosmic-black/80 z-50 text-center p-8">
              <div className="flex flex-col gap-4 items-center">
                <AlertTriangle className="w-12 h-12 text-cosmic-danger" />
                <h3 className="text-xl font-display font-bold text-white">Google Maps API Key Required</h3>
                <p className="text-slate-400 text-sm max-w-xs">
                  Please add your Google Maps API key to the .env file to enable live mapping and navigation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Map Overlay Info */}
        <div className="absolute bottom-6 left-6 right-6 z-20 flex items-end justify-between gap-4 pointer-events-none">
          <div className="glass-card p-4 flex items-center gap-4 max-w-xs pointer-events-auto">
            <div className="w-12 h-12 rounded-xl bg-cosmic-safe/20 flex items-center justify-center text-cosmic-safe shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm">Safe Zone Tracking</span>
              <span className="text-xs text-slate-400">Real-time safety monitoring active.</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 items-end pointer-events-auto">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cosmic-safe animate-pulse" />
              <span className="text-xs font-bold text-white">LIVE GPS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
