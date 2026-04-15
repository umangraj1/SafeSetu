import { Navigation, Clock, Route, Shield, ShieldCheck, ShieldAlert, X, MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const SAFETY_COLORS = {
  Safe: { bg: 'from-emerald-500 to-green-500', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  Moderate: { bg: 'from-amber-500 to-yellow-500', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  Unsafe: { bg: 'from-red-500 to-rose-500', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' },
};

export default function JourneyBar({ route, onEndJourney }) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!route) return null;

  const colors = SAFETY_COLORS[route.safetyLevel] || SAFETY_COLORS.Moderate;
  const ShieldIcon = route.safetyLevel === 'Safe' ? ShieldCheck : route.safetyLevel === 'Unsafe' ? ShieldAlert : Shield;

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="mx-auto max-w-lg w-full px-3 pb-3 pointer-events-auto">
        <div className="journey-bar rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          {/* Top colored accent */}
          <div className={`h-1 bg-linear-to-r ${colors.bg}`} />

          <div className="p-3.5">
            {/* Navigation header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Navigation size={16} className="text-emerald-500" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-gray-900 journey-live-dot" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white tracking-tight">Navigating on {route.label}</p>
                <p className="text-[10px] text-gray-400 font-medium">
                  Stay safe • {formatElapsed(elapsed)} elapsed
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${colors.badge}`}>
                {route.safetyLevel}
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                <Clock size={12} className="text-gray-500 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-white">{route.duration}</p>
                <p className="text-[8px] text-gray-500 font-medium">ETA</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                <Route size={12} className="text-gray-500 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-white">{route.distance}</p>
                <p className="text-[8px] text-gray-500 font-medium">Distance</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                <ShieldIcon size={12} className={`${colors.text} mx-auto mb-1`} />
                <p className="text-[11px] font-bold text-white">{route.overall}%</p>
                <p className="text-[8px] text-gray-500 font-medium">Safety</p>
              </div>
            </div>

            {/* Warnings during journey */}
            {route.warnings && route.warnings.length > 0 && (
              <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-[10px] text-amber-300 font-semibold leading-relaxed">
                  ⚠️ {route.warnings[0]?.message}
                </p>
              </div>
            )}

            {/* End Journey button */}
            <button
              onClick={onEndJourney}
              className="w-full py-2.5 bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-400/30 rounded-xl text-sm font-bold text-gray-300 hover:text-red-300 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <X size={14} />
              End Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
