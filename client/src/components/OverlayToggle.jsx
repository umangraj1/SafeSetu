import { Layers, X } from 'lucide-react';
import { useState } from 'react';

const OVERLAYS = [
  { key: 'crime', label: 'Crime', color: 'bg-red-500', activeColor: 'bg-red-50 border-red-300 text-red-700', icon: '🔴' },
  { key: 'streetlight', label: 'Lights', color: 'bg-yellow-400', activeColor: 'bg-amber-50 border-amber-300 text-amber-700', icon: '💡' },
  { key: 'crowd', label: 'Crowd', color: 'bg-blue-500', activeColor: 'bg-blue-50 border-blue-300 text-blue-700', icon: '👥' },
  { key: 'accident', label: 'Accidents', color: 'bg-orange-500', activeColor: 'bg-orange-50 border-orange-300 text-orange-700', icon: '🚧' },
  { key: 'traffic', label: 'Traffic', color: 'bg-green-500', activeColor: 'bg-green-50 border-green-300 text-green-700', icon: '🚦' },
];

export default function OverlayToggle({ activeOverlays, onToggle }) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(activeOverlays).filter(Boolean).length;

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-11 h-11 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
          open ? 'bg-purple-600 hover:bg-purple-700' : 'glass hover:shadow-xl'
        }`}
        title="Toggle safety overlays"
      >
        {open ? (
          <X size={17} className="text-white" />
        ) : (
          <div className="relative">
            <Layers size={17} className="text-gray-700" />
            {activeCount > 0 && (
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">{activeCount}</span>
              </div>
            )}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 glass rounded-2xl shadow-2xl p-2.5 w-44 animate-fade-in">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1.5 mb-2">
            Safety Layers
          </p>
          <div className="space-y-1.5">
            {OVERLAYS.map((ov) => {
              const isActive = activeOverlays[ov.key];
              return (
                <button
                  key={ov.key}
                  onClick={() => onToggle(ov.key)}
                  className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    isActive
                      ? `${ov.activeColor} shadow-sm`
                      : 'border-transparent text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">{ov.icon}</span>
                  <span className="flex-1 text-left">{ov.label}</span>
                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${
                    isActive ? 'bg-purple-500' : 'bg-gray-200'
                  }`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      isActive ? 'translate-x-3.5' : 'translate-x-0'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
