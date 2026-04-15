import { useState, useRef, useEffect } from 'react';
import { Navigation, Clock, Search, X, LocateFixed, ArrowUpDown, Shield, ChevronDown, Sun, Sunset, Moon, Coffee } from 'lucide-react';

const TIME_OPTIONS = [
  { label: 'Now', value: 'now', icon: Clock },
  { label: 'Morning', value: 'morning', hour: 9, icon: Coffee },
  { label: 'Afternoon', value: 'afternoon', hour: 14, icon: Sun },
  { label: 'Evening', value: 'evening', hour: 19, icon: Sunset },
  { label: 'Night', value: 'night', hour: 23, icon: Moon },
];

export default function SearchPanel({
  onSearch,
  loading,
  onUseMyLocation,
  hasResults,
  onClear,
  mapsLoaded,
  expanded,
  onExpandedChange,
}) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [timeOption, setTimeOption] = useState('now');
  const originRef = useRef(null);
  const destRef = useRef(null);
  const originAutoRef = useRef(null);
  const destAutoRef = useRef(null);

  useEffect(() => {
    if (!mapsLoaded || !window.google?.maps?.places) return;

    const bangaloreBounds = new window.google.maps.LatLngBounds(
      { lat: 12.7, lng: 77.4 },
      { lat: 13.2, lng: 77.85 }
    );

    const options = {
      bounds: bangaloreBounds,
      componentRestrictions: { country: 'in' },
      fields: ['geometry', 'name', 'formatted_address'],
    };

    if (originRef.current && !originAutoRef.current) {
      originAutoRef.current = new window.google.maps.places.Autocomplete(
        originRef.current,
        options
      );
      originAutoRef.current.addListener('place_changed', () => {
        const place = originAutoRef.current.getPlace();
        if (place?.formatted_address) setOrigin(place.formatted_address);
        else if (place?.name) setOrigin(place.name);
      });
    }

    if (destRef.current && !destAutoRef.current) {
      destAutoRef.current = new window.google.maps.places.Autocomplete(
        destRef.current,
        options
      );
      destAutoRef.current.addListener('place_changed', () => {
        const place = destAutoRef.current.getPlace();
        if (place?.formatted_address) setDestination(place.formatted_address);
        else if (place?.name) setDestination(place.name);
      });
    }
  }, [mapsLoaded]);

  const handleSearch = () => {
    if (!origin || !destination) return;
    const selected = TIME_OPTIONS.find((t) => t.value === timeOption);
    const hour =
      timeOption === 'now' ? new Date().getHours() : selected?.hour ?? 9;
    onSearch(origin, destination, hour);
    onExpandedChange(false);
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
    onExpandedChange(true);
    onClear();
  };

  const handleUseLocation = () => {
    onUseMyLocation((address) => {
      setOrigin(address);
    });
  };

  const swapLocations = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  // Collapsed mini bar
  if (!expanded && hasResults) {
    return (
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="mx-auto max-w-lg w-full px-3 pt-3 pointer-events-auto">
          <div
            className="glass rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => onExpandedChange(true)}
          >
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-600 to-pink-500 flex items-center justify-center shrink-0">
              <Shield size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{origin}</p>
              <p className="text-xs text-gray-500 truncate">to {destination}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Clear route"
            >
              <X size={14} className="text-gray-400" />
            </button>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="mx-auto max-w-lg w-full px-3 pt-3 pointer-events-auto">
        <div className="glass rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-4 py-2 bg-linear-to-r from-purple-600 via-purple-500 to-pink-500">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Navigation size={15} className="text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-sm font-bold text-white tracking-tight">SafeSetu</h1>
                <p className="text-[10px] text-white/70 font-medium">Find the safest way to your destination</p>
              </div>
              {hasResults && (
                <button
                  onClick={handleClear}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Clear route"
                >
                  <X size={15} className="text-white" />
                </button>
              )}
            </div>
          </div>

          <div className="p-3 space-y-2">
            {/* Origin + Destination with swap */}
            <div className="flex gap-2">
              {/* Route dots */}
              <div className="flex flex-col items-center pt-3 pb-3 gap-0.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-[3px] border-emerald-200" />
                <div className="flex-1 w-px bg-linear-to-b from-emerald-300 via-gray-300 to-red-300 min-h-6" />
                <div className="w-3 h-3 rounded-full bg-red-500 border-[3px] border-red-200" />
              </div>

              <div className="flex-1 space-y-2">
                {/* Origin input */}
                <div className="relative group">
                  <input
                    ref={originRef}
                    id="origin-input"
                    type="text"
                    placeholder="Where are you?"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 pr-8 py-2.5 text-sm bg-gray-50/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 focus:bg-white placeholder:text-gray-400 transition-all"
                  />
                  <button
                    onClick={handleUseLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-purple-600 transition-colors"
                    title="Use my location"
                    aria-label="Use my current location"
                  >
                    <LocateFixed size={15} />
                  </button>
                </div>

                {/* Destination input */}
                <div className="relative">
                  <input
                    ref={destRef}
                    id="destination-input"
                    type="text"
                    placeholder="Where to?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 focus:bg-white placeholder:text-gray-400 transition-all"
                  />
                </div>
              </div>

              {/* Swap button */}
              <div className="flex items-center">
                <button
                  onClick={swapLocations}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-gray-400 hover:text-purple-600 transition-all active:scale-90"
                  title="Swap locations"
                  aria-label="Swap origin and destination"
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Time selector */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Travel Time</p>
              <div className="flex gap-1.5">
                {TIME_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = timeOption === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTimeOption(opt.value)}
                      className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              disabled={!origin || !destination || loading}
              className="w-full py-2.5 bg-linear-to-r from-purple-600 via-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-[0.98] relative overflow-hidden group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing safety...</span>
                </>
              ) : (
                <>
                  <Search size={16} strokeWidth={2.5} />
                  <span>Find Safest Route</span>
                </>
              )}
              {!loading && (
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
