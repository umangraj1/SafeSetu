import '@testing-library/jest-dom';

// Mock Google Maps API — use function() constructors so `new` works
function MockMap() {
  this.setCenter = vi.fn();
  this.setZoom = vi.fn();
  this.panTo = vi.fn();
}

function MockCircle() {
  this.setMap = vi.fn();
  this.addListener = vi.fn();
}

function MockMarker() {
  this.setMap = vi.fn();
  this.setPosition = vi.fn();
}

function MockInfoWindow() {
  this.setPosition = vi.fn();
  this.open = vi.fn();
}

function MockDirectionsService() {
  this.route = vi.fn();
}

function MockDirectionsRenderer() {
  this.setMap = vi.fn();
}

function MockTrafficLayer() {
  this.setMap = vi.fn();
}

function MockGeocoder() {
  this.geocode = vi.fn();
}

function MockLatLngBounds() {}

function MockAutocomplete() {
  this.addListener = vi.fn();
  this.getPlace = vi.fn(() => ({ formatted_address: 'Test Address', name: 'Test' }));
}

window.google = {
  maps: {
    Map: MockMap,
    Circle: MockCircle,
    Marker: MockMarker,
    InfoWindow: MockInfoWindow,
    DirectionsService: MockDirectionsService,
    DirectionsRenderer: MockDirectionsRenderer,
    TrafficLayer: MockTrafficLayer,
    Geocoder: MockGeocoder,
    LatLngBounds: MockLatLngBounds,
    SymbolPath: { CIRCLE: 0 },
    ControlPosition: { RIGHT_CENTER: 8 },
    TravelMode: { DRIVING: 'DRIVING' },
    places: {
      Autocomplete: MockAutocomplete,
    },
    geometry: {},
  },
};

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) =>
    success({ coords: { latitude: 12.9716, longitude: 77.5946 } })
  ),
  watchPosition: vi.fn(() => 1),
  clearWatch: vi.fn(),
};

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        crimeZones: [],
        streetlights: [],
        crowdDensity: [],
        accidentZones: [],
      }),
    ok: true,
  })
);
