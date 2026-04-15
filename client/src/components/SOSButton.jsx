import { Phone, X, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

const CONTACTS = [
  { label: 'Police', number: '100', color: 'from-red-500 to-red-600', icon: '🚔' },
  { label: 'Emergency Contact', number: '9600008233', color: 'from-pink-500 to-rose-500', icon: '📞' },
  { label: 'Emergency', number: '112', color: 'from-orange-500 to-amber-500', icon: '🚑' },
];

export default function SOSButton({ visible }) {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  return (
    <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end gap-2">
      {/* Emergency contacts panel */}
      <div
        style={{
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
          pointerEvents: expanded ? 'auto' : 'none',
          transformOrigin: 'bottom right',
        }}
        className="glass rounded-2xl shadow-2xl p-3 w-56"
        aria-hidden={!expanded}
      >
        <div className="flex items-center gap-2 mb-3 px-1">
          <ShieldAlert size={14} className="text-red-500" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Emergency</span>
        </div>
        <div className="space-y-2">
          {CONTACTS.map((c) => (
            <a
              key={c.number}
              href={`tel:${c.number}`}
              className={`flex items-center gap-3 px-3 py-2.5 bg-linear-to-r ${c.color} text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all active:scale-[0.97]`}
              tabIndex={expanded ? 0 : -1}
            >
              <span className="text-base">{c.icon}</span>
              <span className="flex-1">{c.label}</span>
              <span className="text-white/80 text-xs font-semibold">{c.number}</span>
            </a>
          ))}
        </div>
      </div>

      {/* SOS button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl ${
          expanded
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-red-600 hover:bg-red-700 sos-pulse'
        }`}
        aria-label={expanded ? 'Close emergency contacts' : 'Open emergency contacts (SOS)'}
        aria-expanded={expanded}
        aria-haspopup="true"
      >
        {expanded ? (
          <X size={22} className="text-white" />
        ) : (
          <div className="flex flex-col items-center">
            <Phone size={16} className="text-white mb-0.5" />
            <span className="text-[10px] font-black text-white tracking-wider">SOS</span>
          </div>
        )}
      </button>
    </div>
  );
}
