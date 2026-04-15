const express = require('express');
const cors = require('cors');
const crimeZones = require('./data/crimeZones.json');
const streetlights = require('./data/streetlights.json');
const crowdDensity = require('./data/crowdDensity.json');
const accidentZones = require('./data/accidentZones.json');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ── Pre-compute bounding boxes for all zones once at startup ──
function computeBBox(zone) {
  const latDelta = zone.radius / 111320; // ~metres per degree lat
  const lngDelta = zone.radius / (111320 * Math.cos((zone.center.lat * Math.PI) / 180));
  return {
    minLat: zone.center.lat - latDelta,
    maxLat: zone.center.lat + latDelta,
    minLng: zone.center.lng - lngDelta,
    maxLng: zone.center.lng + lngDelta,
  };
}

const crimeBoxes      = crimeZones.map(computeBBox);
const streetlightBoxes = streetlights.map(computeBBox);
const crowdBoxes      = crowdDensity.map(computeBBox);
const accidentBoxes   = accidentZones.map(computeBBox);

// Pre-compute a stable ETag for the static zones payload
const zonesPayload = JSON.stringify({ crimeZones, streetlights, crowdDensity, accidentZones });
const zonesETag = `"${Buffer.from(zonesPayload).length}-zones"`;

// ── Utility: Haversine distance in meters ──
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Determine time period from hour (0-23) ──
function getTimePeriod(hour) {
  if (hour >= 6 && hour < 17) return 'day';      // 6am–5pm (was: 6–12 + 12–17 as two dead branches)
  if (hour >= 17 && hour < 21) return 'evening'; // 5pm–9pm
  return 'night';                                 // 9pm–6am
}

// ── Check if a point passes the bounding-box pre-filter ──
function inBBox(lat, lng, bbox) {
  return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
}

// ── Check if a point is within a zone (bbox guard + haversine) ──
function isInZone(lat, lng, zone, bbox) {
  return inBBox(lat, lng, bbox) && haversine(lat, lng, zone.center.lat, zone.center.lng) <= zone.radius;
}

// ── Score a single route segment (array of lat/lng points) ──
function scoreRoute(points, hour) {
  const timePeriod = getTimePeriod(hour);

  // Time-based weight adjustments
  const weights = {
    crime: 0.35,
    streetlight: 0.25,
    crowd: 0.25,
    accident: 0.15,
  };

  // Night amplifies crime & streetlight importance
  if (timePeriod === 'night') {
    weights.crime = 0.40;
    weights.streetlight = 0.30;
    weights.crowd = 0.15;
    weights.accident = 0.15;
  } else if (timePeriod === 'evening') {
    weights.crime = 0.38;
    weights.streetlight = 0.27;
    weights.crowd = 0.20;
    weights.accident = 0.15;
  }

  // Sample points along the route (every ~10th point or at least 20 samples)
  const step = Math.max(1, Math.floor(points.length / 30));
  const sampledPoints = [];
  for (let i = 0; i < points.length; i += step) {
    sampledPoints.push(points[i]);
  }
  if (sampledPoints.length === 0 && points.length > 0) {
    sampledPoints.push(points[0]);
  }

  let crimeScore = 100;
  let lightScore = 50; // default: moderate if no data
  let crowdScore = 50;
  let accidentScore = 100;
  const warnings = [];
  const affectedZones = { crime: [], streetlight: [], crowd: [], accident: [] };

  // ── Crime scoring ──
  let crimeHits = 0;
  let totalCrimeSeverity = 0;
  for (const pt of sampledPoints) {
    for (let zi = 0; zi < crimeZones.length; zi++) {
      const zone = crimeZones[zi];
      if (isInZone(pt.lat, pt.lng, zone, crimeBoxes[zi])) {
        crimeHits++;
        totalCrimeSeverity += zone.severity;
        if (!affectedZones.crime.find((z) => z.id === zone.id)) {
          affectedZones.crime.push(zone);
          const nightExtra = timePeriod === 'night' ? ' (HIGH RISK at night)' : '';
          warnings.push({
            type: 'crime',
            severity: zone.severity >= 7 ? 'high' : 'medium',
            message: `⚠️ ${zone.name}: ${zone.description}${nightExtra}`,
          });
        }
      }
    }
  }
  if (crimeHits > 0) {
    const avgSeverity = totalCrimeSeverity / crimeHits;
    const crimePenalty = (crimeHits / sampledPoints.length) * avgSeverity * 10;
    crimeScore = Math.max(0, 100 - crimePenalty);
  }

  // ── Streetlight scoring ──
  let litPoints = 0;
  let totalLightDensity = 0;
  for (const pt of sampledPoints) {
    let bestLight = 0;
    for (let zi = 0; zi < streetlights.length; zi++) {
      const zone = streetlights[zi];
      if (isInZone(pt.lat, pt.lng, zone, streetlightBoxes[zi])) {
        bestLight = Math.max(bestLight, zone.density);
      }
    }
    if (bestLight > 0) {
      litPoints++;
      totalLightDensity += bestLight;
    }
  }
  if (litPoints > 0) {
    lightScore = (totalLightDensity / litPoints) * 10;
    if (litPoints < sampledPoints.length * 0.5) {
      lightScore *= 0.6; // penalty for many unlit stretches
      if (timePeriod === 'night') {
        warnings.push({
          type: 'streetlight',
          severity: 'high',
          message: '🔦 Large sections of this route have poor street lighting',
        });
      }
    }
  } else if (timePeriod === 'night') {
    lightScore = 20;
    warnings.push({
      type: 'streetlight',
      severity: 'high',
      message: '🔦 No streetlight data available — this route may be very dark at night',
    });
  }

  // ── Crowd density scoring ──
  let crowdHits = 0;
  let totalCrowdValue = 0;
  const crowdMap = { high: 10, medium: 6, low: 2 };
  for (const pt of sampledPoints) {
    for (let zi = 0; zi < crowdDensity.length; zi++) {
      const zone = crowdDensity[zi];
      if (isInZone(pt.lat, pt.lng, zone, crowdBoxes[zi])) {
        crowdHits++;
        totalCrowdValue += crowdMap[zone.density[timePeriod]] || 2;
        if (!affectedZones.crowd.find((z) => z.id === zone.id)) {
          affectedZones.crowd.push(zone);
        }
      }
    }
  }
  if (crowdHits > 0) {
    crowdScore = (totalCrowdValue / crowdHits) * 10;
  } else {
    crowdScore = timePeriod === 'night' ? 20 : 50;
  }
  if (crowdScore < 40 && timePeriod === 'night') {
    warnings.push({
      type: 'crowd',
      severity: 'medium',
      message: '👥 Very few people in this area at this hour',
    });
  }

  // ── Accident scoring ──
  let accHits = 0;
  let totalAccFreq = 0;
  for (const pt of sampledPoints) {
    for (let zi = 0; zi < accidentZones.length; zi++) {
      const zone = accidentZones[zi];
      if (isInZone(pt.lat, pt.lng, zone, accidentBoxes[zi])) {
        accHits++;
        totalAccFreq += zone.frequency;
        if (!affectedZones.accident.find((z) => z.id === zone.id)) {
          affectedZones.accident.push(zone);
          warnings.push({
            type: 'accident',
            severity: zone.frequency >= 7 ? 'high' : 'medium',
            message: `🚧 ${zone.name}: ${zone.description}`,
          });
        }
      }
    }
  }
  if (accHits > 0) {
    const avgFreq = totalAccFreq / accHits;
    const accPenalty = (accHits / sampledPoints.length) * avgFreq * 10;
    accidentScore = Math.max(0, 100 - accPenalty);
  }

  // ── Weighted total ──
  const overall = Math.round(
    crimeScore * weights.crime +
      lightScore * weights.streetlight +
      crowdScore * weights.crowd +
      accidentScore * weights.accident
  );

  const safetyLevel =
    overall >= 70 ? 'Safe' : overall >= 45 ? 'Moderate' : 'Unsafe';

  let trafficNote = '';
  if (crowdScore > 70) trafficNote = 'with decent traffic';
  else if (crowdScore > 40) trafficNote = 'with moderate traffic';
  else trafficNote = 'with very low traffic';

  return {
    overall: Math.min(100, Math.max(0, overall)),
    safetyLevel,
    trafficNote,
    breakdown: {
      crime: Math.round(Math.min(100, crimeScore)),
      streetlight: Math.round(Math.min(100, lightScore)),
      crowd: Math.round(Math.min(100, crowdScore)),
      accident: Math.round(Math.min(100, accidentScore)),
    },
    weights,
    warnings,
    timePeriod,
  };
}

// ── API Routes ──

// Get all safety zone data for map overlays (cached)
app.get('/api/zones', (req, res) => {
  const clientETag = req.headers['if-none-match'];
  if (clientETag === zonesETag) {
    return res.status(304).end();
  }
  res.set({
    'Cache-Control': 'public, max-age=600', // cache for 10 minutes
    'ETag': zonesETag,
  });
  res.json({ crimeZones, streetlights, crowdDensity, accidentZones });
});

// Score a route
app.post('/api/route/score', (req, res) => {
  const { routes, hour } = req.body;

  if (!routes || !Array.isArray(routes)) {
    return res.status(400).json({ error: 'routes array is required' });
  }

  // Clamp hour to valid range 0–23
  const rawHour = hour !== undefined ? hour : new Date().getHours();
  const h = Math.max(0, Math.min(23, Math.round(rawHour)));

  const results = routes.map((route, index) => {
    const score = scoreRoute(route.points, h);
    return {
      routeIndex: index,
      label: route.label || `Route ${String.fromCharCode(65 + index)}`,
      ...score,
      distance: route.distance || '',
      duration: route.duration || '',
    };
  });

  // Sort by safety score descending
  results.sort((a, b) => b.overall - a.overall);

  // Mark recommended
  if (results.length > 0) {
    results[0].recommended = true;
    results[0].recommendation = `${results[0].label} is safer (${results[0].overall}% safety score), ${results[0].trafficNote}`;
  }

  res.json({ results, timePeriod: getTimePeriod(h), hour: h });
});

app.listen(PORT, () => {
  console.log(`🛡️  Safe Route Finder API running on port ${PORT}`);
});
