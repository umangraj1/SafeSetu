import { Shield, ShieldAlert, ShieldCheck, ChevronUp, ChevronDown, Clock, Route, AlertTriangle, Zap, Navigation } from 'lucide-react';
import { useState } from 'react';

const SAFETY_STYLES = {
  Safe: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    ringColor: '#22c55e',
    glow: 'shadow-emerald-100',
  },
  Moderate: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    ringColor: '#eab308',
    glow: 'shadow-amber-100',
  },
  Unsafe: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    ringColor: '#ef4444',
    glow: 'shadow-red-100',
  },
};

const FACTORS = [
  { key: 'crime', label: 'Crime Safety', gradient: 'from-red-400 to-red-500', icon: '🔴' },
  { key: 'streetlight', label: 'Street Lighting', gradient: 'from-amber-400 to-yellow-400', icon: '💡' },
  { key: 'crowd', label: 'Crowd Presence', gradient: 'from-blue-400 to-blue-500', icon: '👥' },
  { key: 'accident', label: 'Road Safety', gradient: 'from-orange-400 to-orange-500', icon: '🚧' },
];

function ScoreBar({ factor, score }) {
  const capped = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm" aria-hidden="true">{factor.icon}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-[11px] text-gray-600 font-medium">{factor.label}</span>
          <span className="text-[11px] font-bold text-gray-700">{capped}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={capped} aria-valuemin={0} aria-valuemax={100} aria-label={`${factor.label}: ${capped}%`}>
          <div
            className={`h-full rounded-full bg-linear-to-r ${factor.gradient} transition-all duration-700 ease-out`}
            style={{ width: `${capped}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score, size = 56, strokeWidth = 4, safetyLevel }) {
  const style = SAFETY_STYLES[safetyLevel];
  const capped = Math.min(100, Math.max(0, score));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        <circle
          cx="18" cy="18" r="15.5"
          fill="none"
          stroke={style.ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${capped}, 100`}
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-extrabold text-gray-800 leading-none">{capped}</span>
        <span className="text-[8px] font-medium text-gray-400 -mt-0.5">%</span>
      </div>
    </div>
  );
}

function RouteCard({ route, index, isSelected, onSelect }) {
  const [showDetails, setShowDetails] = useState(false);
  const style = SAFETY_STYLES[route.safetyLevel];
  const ShieldIcon = route.safetyLevel === 'Safe' ? ShieldCheck : route.safetyLevel === 'Unsafe' ? ShieldAlert : Shield;

  return (
    <div
      className={`rounded-2xl border-2 transition-all cursor-pointer ${
        isSelected
          ? `${style.border} ${style.bg} shadow-lg ${style.glow}`
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
      }`}
      onClick={() => onSelect(index)}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`${route.label}: ${route.overall}% safety score, ${route.safetyLevel}, ${route.duration}, ${route.distance}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(index); } }}
    >
      <div className="p-3.5">
        {/* Top row: label + badge */}
        <div className="flex items-center gap-2 mb-3">
          <ShieldIcon size={18} className={style.text} />
          <span className="font-bold text-sm text-gray-800 flex-1">{route.label}</span>
          {route.recommended && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-linear-to-r from-emerald-500 to-green-500 text-white shadow-sm">
              <Zap size={9} />
              Safest
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
            route.safetyLevel === 'Safe' ? 'bg-emerald-100 text-emerald-700' :
            route.safetyLevel === 'Moderate' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {route.safetyLevel}
          </span>
        </div>

        {/* Score + meta row */}
        <div className="flex items-center gap-4">
          <ScoreRing score={route.overall} safetyLevel={route.safetyLevel} />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-2 text-center">
              <Clock size={13} className="text-gray-400 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-gray-800">{route.duration}</p>
              <p className="text-[9px] text-gray-400 font-medium">Duration</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2 text-center">
              <Route size={13} className="text-gray-400 mx-auto mb-0.5" />
              <p className="text-xs font-bold text-gray-800">{route.distance}</p>
              <p className="text-[9px] text-gray-400 font-medium">Distance</p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {route.recommended && (
          <div className="mt-3 p-2.5 bg-linear-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
            <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
              👉 {route.recommendation}
            </p>
          </div>
        )}

        {/* Details toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }}
          className="flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-3 hover:text-purple-800 transition-colors"
          aria-expanded={showDetails}
        >
          {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showDetails ? 'Hide breakdown' : 'View safety breakdown'}
        </button>

        {showDetails && (
          <div className="mt-3 space-y-3 animate-fade-in">
            {/* Factor bars */}
            <div className="space-y-2.5 p-3 bg-gray-50/50 rounded-xl">
              {FACTORS.map((f) => (
                <ScoreBar key={f.key} factor={f} score={route.breakdown[f.key]} />
              ))}
            </div>

            {/* Warnings */}
            {route.warnings.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Alerts</p>
                {route.warnings.map((w, i) => (
                  <div
                    key={`${route.routeIndex}-warning-${i}`}
                    className={`text-[11px] p-2 rounded-xl flex items-start gap-2 ${
                      w.severity === 'high'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    <span className="font-medium leading-relaxed">{w.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RouteResults({ results, selectedRoute, onSelectRoute, onStartJourney }) {
  if (!results || results.length === 0) return null;

  const periodLabels = { day: 'Daytime', evening: 'Evening', night: 'Nighttime' };
  const period = results[0]?.timePeriod;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="mx-auto max-w-lg w-full px-3 pb-3 pointer-events-auto">
        <div className="glass rounded-2xl shadow-2xl p-3 max-h-[55vh] overflow-y-auto space-y-2.5 animate-slide-up" role="region" aria-label="Route analysis results" aria-live="polite">
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                {results.length} Routes Analyzed
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              period === 'night' ? 'bg-indigo-100 text-indigo-700' :
              period === 'evening' ? 'bg-orange-100 text-orange-700' :
              'bg-sky-100 text-sky-700'
            }`}>
              {periodLabels[period] || period} Analysis
            </span>
          </div>

          {results.map((route, i) => (
            <RouteCard
              key={route.routeIndex}
              route={route}
              index={i}
              isSelected={selectedRoute === i}
              onSelect={onSelectRoute}
            />
          ))}

          {/* Start Journey Button */}
          <button
            onClick={() => onStartJourney && onStartJourney(selectedRoute)}
            className="w-full py-3 bg-linear-to-r from-emerald-500 via-green-500 to-teal-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-[0.98] relative overflow-hidden group"
          >
            <Navigation size={16} strokeWidth={2.5} />
            <span>Start Journey on {results[selectedRoute]?.label || 'Selected Route'}</span>
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          </button>
        </div>
      </div>
    </div>
  );
}

