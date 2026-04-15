import { useState, useEffect, useRef, useCallback } from 'react';
import { LocateFixed } from 'lucide-react';
import SearchPanel from './components/SearchPanel';
import RouteResults from './components/RouteResults';
import JourneyBar from './components/JourneyBar';
import SOSButton from './components/SOSButton';
import OverlayToggle from './components/OverlayToggle';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 };

const ROUTE_COLORS = ['#22c55e', '#eab308', '#ef4444', '#8b5cf6'];
const ROUTE_COLORS_FADED = ['#86efac', '#fde047', '#fca5a5', '#c4b5fd'];

function App() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const routeRenderersRef = useRef([]);
  const directionsResultRef = useRef(null);
  const scoredResultsRef = useRef([]);
  const overlayCirclesRef = useRef([]);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const trafficLayerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [journeyActive, setJourneyActive] = useState(false);
  const [journeyRoute, setJourneyRoute] = useState(null);
  const [zones, setZones] = useState(null);
  const [activeOverlays, setActiveOverlays] = useState({
    crime: true,
    streetlight: false,
    crowd: false,
    accident: false,
    traffic: false,
  });
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(true);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setMapsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;

    let mounted = true;
    window.initMap = () => {
      if (mounted) setMapsLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      mounted = false;
      delete window.initMap;
    };
  }, []);

  // Initialize map once script loads
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: BANGALORE_CENTER,
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
      ],
    });

    mapInstanceRef.current = map;
    directionsServiceRef.current = new window.google.maps.DirectionsService();

    // Fetch safety zones
    fetch('/api/zones')
      .then((r) => r.json())
      .then((data) => {
        setZones(data);
        drawOverlays(map, data, { crime: true, streetlight: false, crowd: false, accident: false });
      })
      .catch(console.error);
  }, [mapsLoaded]);

  // Redraw overlays when toggle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !zones) return;
    drawOverlays(mapInstanceRef.current, zones, activeOverlays);
  }, [activeOverlays, zones]);

  // Toggle Google Maps Traffic Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new window.google.maps.TrafficLayer();
    }
    trafficLayerRef.current.setMap(activeOverlays.traffic ? mapInstanceRef.current : null);
  }, [activeOverlays.traffic, mapsLoaded]);

  const drawOverlays = useCallback((map, zoneData, active) => {
    // Clear existing
    overlayCirclesRef.current.forEach((c) => c.setMap(null));
    overlayCirclesRef.current = [];

    if (active.crime) {
      zoneData.crimeZones.forEach((z) => {
        const circle = new window.google.maps.Circle({
          map,
          center: z.center,
          radius: z.radius,
          fillColor: '#ef4444',
          fillOpacity: 0.15 + z.severity * 0.03,
          strokeColor: '#ef4444',
          strokeOpacity: 0.6,
          strokeWeight: 1,
          clickable: true,
        });
        const info = new window.google.maps.InfoWindow({
          content: `<div style="font-family:sans-serif;font-size:13px;max-width:200px">
            <strong style="color:#ef4444">⚠ ${z.name}</strong><br/>
            <span style="color:#666">Severity: ${z.severity}/10</span><br/>
            <span style="color:#666">${z.description}</span>
          </div>`,
        });
        circle.addListener('click', (e) => {
          info.setPosition(e.latLng);
          info.open(map);
        });
        overlayCirclesRef.current.push(circle);
      });
    }

    if (active.streetlight) {
      zoneData.streetlights.forEach((z) => {
        const opacity = z.density / 10;
        const circle = new window.google.maps.Circle({
          map,
          center: z.center,
          radius: z.radius,
          fillColor: z.density >= 7 ? '#facc15' : z.density >= 4 ? '#f97316' : '#78716c',
          fillOpacity: opacity * 0.3,
          strokeColor: z.density >= 7 ? '#facc15' : '#f97316',
          strokeOpacity: 0.5,
          strokeWeight: 1,
        });
        overlayCirclesRef.current.push(circle);
      });
    }

    if (active.crowd) {
      const hour = new Date().getHours();
      const period = hour >= 6 && hour < 17 ? 'day' : hour < 21 ? 'evening' : 'night';
      const crowdColorMap = { high: '#3b82f6', medium: '#93c5fd', low: '#dbeafe' };
      zoneData.crowdDensity.forEach((z) => {
        const level = z.density[period];
        const circle = new window.google.maps.Circle({
          map,
          center: z.center,
          radius: z.radius,
          fillColor: crowdColorMap[level],
          fillOpacity: level === 'high' ? 0.3 : level === 'medium' ? 0.2 : 0.1,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.4,
          strokeWeight: 1,
        });
        overlayCirclesRef.current.push(circle);
      });
    }

    if (active.accident) {
      zoneData.accidentZones.forEach((z) => {
        const circle = new window.google.maps.Circle({
          map,
          center: z.center,
          radius: z.radius,
          fillColor: '#f97316',
          fillOpacity: 0.1 + z.frequency * 0.02,
          strokeColor: '#f97316',
          strokeOpacity: 0.6,
          strokeWeight: 1,
        });
        const marker = new window.google.maps.Marker({
          map,
          position: z.center,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#f97316',
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          title: z.name,
        });
        overlayCirclesRef.current.push(circle);
        overlayCirclesRef.current.push(marker);
      });
    }
  }, []);

  // Live location tracking
  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;

    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (!userMarkerRef.current) {
          userMarkerRef.current = new window.google.maps.Marker({
            map: mapInstanceRef.current,
            position: loc,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#6366f1',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            },
            title: 'You are here',
            zIndex: 999,
          });
        } else {
          userMarkerRef.current.setPosition(loc);
        }
      },
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (mapsLoaded && mapInstanceRef.current) {
      startLiveTracking();
    }
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [mapsLoaded, startLiveTracking]);

  const handleUseMyLocation = useCallback((callback) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: pos.coords.latitude, lng: pos.coords.longitude } },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              callback(results[0].formatted_address);
            } else {
              callback(`${pos.coords.latitude}, ${pos.coords.longitude}`);
            }
          }
        );
      },
      () => setError('Unable to get your location. Please allow location access.')
    );
  }, []);

  const handleSearch = useCallback(async (origin, destination, hour) => {
    setLoading(true);
    setResults(null);
    setError(null);
    setJourneyStarted(false);

    // Clear existing routes
    routeRenderersRef.current.forEach((r) => r.setMap(null));
    routeRenderersRef.current = [];

    try {
      const directionsResult = await new Promise((resolve, reject) => {
        directionsServiceRef.current.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            region: 'in',
          },
          (result, status) => {
            if (status === 'OK') resolve(result);
            else reject(new Error(`Directions failed: ${status}`));
          }
        );
      });

      // Extract route points for scoring
      const routeData = directionsResult.routes.map((route, i) => {
        const leg = route.legs[0];
        const points = route.overview_path.map((p) => ({
          lat: p.lat(),
          lng: p.lng(),
        }));
        return {
          label: `Route ${String.fromCharCode(65 + i)}`,
          points,
          distance: leg.distance.text,
          duration: leg.duration.text,
        };
      });

      // Score routes via backend
      const scoreRes = await fetch('/api/route/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes: routeData, hour }),
      });
      const scoreData = await scoreRes.json();

      // Store results for re-rendering on route selection
      directionsResultRef.current = directionsResult;
      scoredResultsRef.current = scoreData.results;

      // Render routes on map (selected = 0 initially)
      renderRoutesOnMap(directionsResult, scoreData.results, 0);

      setResults(scoreData.results);
      setSelectedRoute(0);
      setJourneyStarted(true);
    } catch (err) {
      console.error(err);
      setError('Could not find routes. Please check your origin and destination.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper to render all routes on the map with a given selected index
  const renderRoutesOnMap = useCallback((directionsResult, scoredResults, selectedIndex) => {
    // Clear existing renderers
    routeRenderersRef.current.forEach((r) => r.setMap(null));
    routeRenderersRef.current = [];

    // Draw non-selected routes first (so they appear behind)
    scoredResults.forEach((scored, i) => {
      if (i === selectedIndex) return; // skip selected, draw it last
      const routeIdx = scored.routeIndex;
      const renderer = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        directions: directionsResult,
        routeIndex: routeIdx,
        polylineOptions: {
          strokeColor: ROUTE_COLORS_FADED[Math.min(i, 3)],
          strokeWeight: 4,
          strokeOpacity: 0.45,
          zIndex: 1,
        },
        suppressMarkers: true,
        preserveViewport: true,
      });
      routeRenderersRef.current.push(renderer);
    });

    // Draw selected route last (on top)
    const selectedScored = scoredResults[selectedIndex];
    if (selectedScored) {
      const renderer = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        directions: directionsResult,
        routeIndex: selectedScored.routeIndex,
        polylineOptions: {
          strokeColor: ROUTE_COLORS[0],
          strokeWeight: 6,
          strokeOpacity: 0.9,
          zIndex: 10,
        },
        suppressMarkers: false,
        preserveViewport: false,
      });
      routeRenderersRef.current.push(renderer);
    }
  }, []);

  const handleSelectRoute = useCallback((index) => {
    setSelectedRoute(index);

    const directionsResult = directionsResultRef.current;
    const scoredResults = scoredResultsRef.current;
    if (!directionsResult || !scoredResults.length) return;

    renderRoutesOnMap(directionsResult, scoredResults, index);
  }, [renderRoutesOnMap]);

  // Start Journey — show only the selected route, enter navigation mode
  const handleStartJourney = useCallback((index) => {
    const scoredResults = scoredResultsRef.current;
    const directionsResult = directionsResultRef.current;
    if (!scoredResults.length || !directionsResult) return;

    const chosenRoute = scoredResults[index];
    setJourneyRoute(chosenRoute);
    setJourneyActive(true);

    // Clear all renderers, show only selected route
    routeRenderersRef.current.forEach((r) => r.setMap(null));
    routeRenderersRef.current = [];

    const renderer = new window.google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      directions: directionsResult,
      routeIndex: chosenRoute.routeIndex,
      polylineOptions: {
        strokeColor: '#22c55e',
        strokeWeight: 7,
        strokeOpacity: 0.9,
        zIndex: 10,
      },
      suppressMarkers: false,
      preserveViewport: false,
    });
    routeRenderersRef.current.push(renderer);

    // Follow user location with closer zoom
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          mapInstanceRef.current.panTo(loc);
          mapInstanceRef.current.setZoom(16);
        },
        () => {} // silently fail
      );
    }
  }, []);

  // End Journey — return to route results view
  const handleEndJourney = useCallback(() => {
    setJourneyActive(false);
    setJourneyRoute(null);

    // Re-render all routes
    const directionsResult = directionsResultRef.current;
    const scoredResults = scoredResultsRef.current;
    if (directionsResult && scoredResults.length) {
      renderRoutesOnMap(directionsResult, scoredResults, selectedRoute);
    }
  }, [renderRoutesOnMap, selectedRoute]);

  const handleClear = useCallback(() => {
    routeRenderersRef.current.forEach((r) => r.setMap(null));
    routeRenderersRef.current = [];
    directionsResultRef.current = null;
    scoredResultsRef.current = [];
    setResults(null);
    setError(null);
    setJourneyStarted(false);
    setJourneyActive(false);
    setJourneyRoute(null);
    setSelectedRoute(0);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(BANGALORE_CENTER);
      mapInstanceRef.current.setZoom(12);
    }
  }, []);

  const handleToggleOverlay = useCallback((key) => {
    setActiveOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <main id="main-content" className="relative h-full w-full" role="main" aria-label="SafeSetu Route Finder">
      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0" role="img" aria-label="Interactive map of Bangalore showing safety zones and routes" />

      {/* Loading overlay */}
      {!mapsLoaded && (
        <div className="absolute inset-0 bg-linear-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center z-50" role="status" aria-live="polite" aria-label="Loading map">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto" aria-hidden="true">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-transparent border-b-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">SafeSetu</h1>
              <p className="text-sm text-gray-400 mt-1">Loading your map...</p>
            </div>
          </div>
        </div>
      )}

      {/* Inline error banner */}
      {error && (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none animate-slide-up" role="alert" aria-live="assertive">
          <div className="pointer-events-auto flex items-center gap-3 bg-red-600 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl max-w-md w-full">
            <span className="flex-1">⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-white/80 hover:text-white font-bold text-lg leading-none"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Search Panel — hidden during active journey */}
      {!journeyActive && (
        <SearchPanel
          onSearch={handleSearch}
          loading={loading}
          onUseMyLocation={handleUseMyLocation}
          hasResults={!!results}
          onClear={handleClear}
          mapsLoaded={mapsLoaded}
          expanded={searchExpanded}
          onExpandedChange={setSearchExpanded}
        />
      )}

      {/* Overlay Toggle — positioned dynamically below the search panel */}
      {!journeyActive && (
        <div
          className="absolute right-3 z-30"
          style={{
            top: searchExpanded ? 263 : 76,
            transition: 'top 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <OverlayToggle
            activeOverlays={activeOverlays}
            onToggle={handleToggleOverlay}
          />
        </div>
      )}

      {/* Recenter button — positioned dynamically below overlay toggle */}
      {mapsLoaded && (
        <button
          onClick={() => {
            if (!navigator.geolocation || !mapInstanceRef.current) return;
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                mapInstanceRef.current.panTo(loc);
                mapInstanceRef.current.setZoom(15);
              },
              () => {}
            );
          }}
          className="absolute right-3 z-20 w-11 h-11 glass rounded-2xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-90"
          style={{
            top: journeyActive ? 16 : searchExpanded ? 318 : 131,
            transition: 'top 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          title="Center on my location"
          aria-label="Center map on my current location"
        >
          <LocateFixed size={17} className="text-gray-700" />
        </button>
      )}

      {/* Route Results or Journey Bar */}
      {journeyActive ? (
        <JourneyBar
          route={journeyRoute}
          onEndJourney={handleEndJourney}
        />
      ) : (
        <RouteResults
          results={results}
          selectedRoute={selectedRoute}
          onSelectRoute={handleSelectRoute}
          onStartJourney={handleStartJourney}
        />
      )}

      {/* SOS Button */}
      <SOSButton visible={journeyActive || journeyStarted} />
    </main>
  );
}

export default App;
