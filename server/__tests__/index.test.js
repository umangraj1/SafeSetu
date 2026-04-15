const request = require('supertest');
const { app, haversine, getTimePeriod, computeBBox, inBBox, isInZone, scoreRoute } = require('../index');

// ─── Unit Tests: haversine ───────────────────────────────────────────────────
describe('haversine()', () => {
  test('returns 0 for identical points', () => {
    expect(haversine(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0);
  });

  test('computes correct distance between two known Bangalore landmarks', () => {
    // MG Road (12.9756, 77.6064) to Cubbon Park (12.9763, 77.5929)
    const distance = haversine(12.9756, 77.6064, 12.9763, 77.5929);
    // Approximately 1.4 km
    expect(distance).toBeGreaterThan(1200);
    expect(distance).toBeLessThan(1700);
  });

  test('returns a positive value for distinct points', () => {
    const distance = haversine(12.9, 77.5, 13.0, 77.6);
    expect(distance).toBeGreaterThan(0);
  });

  test('is symmetric (A→B same distance as B→A)', () => {
    const d1 = haversine(12.9716, 77.5946, 13.0358, 77.5970);
    const d2 = haversine(13.0358, 77.5970, 12.9716, 77.5946);
    expect(d1).toBeCloseTo(d2, 5);
  });

  test('handles antipodal-like large distances', () => {
    const distance = haversine(0, 0, 0, 180);
    // Half the circumference of the Earth: ~20,015 km
    expect(distance).toBeGreaterThan(20_000_000);
    expect(distance).toBeLessThan(20_100_000);
  });

  test('handles negative coordinates', () => {
    const distance = haversine(-33.8688, 151.2093, -37.8136, 144.9631);
    // Sydney to Melbourne ~714 km
    expect(distance).toBeGreaterThan(700_000);
    expect(distance).toBeLessThan(730_000);
  });
});

// ─── Unit Tests: getTimePeriod ───────────────────────────────────────────────
describe('getTimePeriod()', () => {
  test('returns "day" for morning hours (6-16)', () => {
    expect(getTimePeriod(6)).toBe('day');
    expect(getTimePeriod(9)).toBe('day');
    expect(getTimePeriod(12)).toBe('day');
    expect(getTimePeriod(16)).toBe('day');
  });

  test('returns "evening" for hours 17-20', () => {
    expect(getTimePeriod(17)).toBe('evening');
    expect(getTimePeriod(19)).toBe('evening');
    expect(getTimePeriod(20)).toBe('evening');
  });

  test('returns "night" for hours 21-5', () => {
    expect(getTimePeriod(21)).toBe('night');
    expect(getTimePeriod(23)).toBe('night');
    expect(getTimePeriod(0)).toBe('night');
    expect(getTimePeriod(3)).toBe('night');
    expect(getTimePeriod(5)).toBe('night');
  });

  test('boundary: hour 6 is day, hour 5 is night', () => {
    expect(getTimePeriod(5)).toBe('night');
    expect(getTimePeriod(6)).toBe('day');
  });

  test('boundary: hour 16 is day, hour 17 is evening', () => {
    expect(getTimePeriod(16)).toBe('day');
    expect(getTimePeriod(17)).toBe('evening');
  });

  test('boundary: hour 20 is evening, hour 21 is night', () => {
    expect(getTimePeriod(20)).toBe('evening');
    expect(getTimePeriod(21)).toBe('night');
  });
});

// ─── Unit Tests: computeBBox ─────────────────────────────────────────────────
describe('computeBBox()', () => {
  test('returns a bounding box object with minLat, maxLat, minLng, maxLng', () => {
    const zone = { center: { lat: 12.9716, lng: 77.5946 }, radius: 500 };
    const bbox = computeBBox(zone);
    expect(bbox).toHaveProperty('minLat');
    expect(bbox).toHaveProperty('maxLat');
    expect(bbox).toHaveProperty('minLng');
    expect(bbox).toHaveProperty('maxLng');
  });

  test('center point is inside the bounding box', () => {
    const zone = { center: { lat: 12.9716, lng: 77.5946 }, radius: 500 };
    const bbox = computeBBox(zone);
    expect(bbox.minLat).toBeLessThan(12.9716);
    expect(bbox.maxLat).toBeGreaterThan(12.9716);
    expect(bbox.minLng).toBeLessThan(77.5946);
    expect(bbox.maxLng).toBeGreaterThan(77.5946);
  });

  test('larger radius produces larger bounding box', () => {
    const zone1 = { center: { lat: 12.9716, lng: 77.5946 }, radius: 500 };
    const zone2 = { center: { lat: 12.9716, lng: 77.5946 }, radius: 1000 };
    const bbox1 = computeBBox(zone1);
    const bbox2 = computeBBox(zone2);
    expect(bbox2.maxLat - bbox2.minLat).toBeGreaterThan(bbox1.maxLat - bbox1.minLat);
    expect(bbox2.maxLng - bbox2.minLng).toBeGreaterThan(bbox1.maxLng - bbox1.minLng);
  });

  test('bounding box is symmetric around center', () => {
    const zone = { center: { lat: 12.9716, lng: 77.5946 }, radius: 500 };
    const bbox = computeBBox(zone);
    const latRange = bbox.maxLat - bbox.minLat;
    const centerLat = (bbox.maxLat + bbox.minLat) / 2;
    expect(centerLat).toBeCloseTo(12.9716, 4);
  });
});

// ─── Unit Tests: inBBox ──────────────────────────────────────────────────────
describe('inBBox()', () => {
  const bbox = { minLat: 12.97, maxLat: 12.98, minLng: 77.59, maxLng: 77.60 };

  test('returns true for point inside bounding box', () => {
    expect(inBBox(12.975, 77.595, bbox)).toBe(true);
  });

  test('returns false for point outside bounding box', () => {
    expect(inBBox(12.96, 77.595, bbox)).toBe(false);
    expect(inBBox(12.975, 77.61, bbox)).toBe(false);
  });

  test('returns true for point on boundary edge', () => {
    expect(inBBox(12.97, 77.59, bbox)).toBe(true);
    expect(inBBox(12.98, 77.60, bbox)).toBe(true);
  });

  test('returns false for point completely outside', () => {
    expect(inBBox(0, 0, bbox)).toBe(false);
  });
});

// ─── Unit Tests: isInZone ────────────────────────────────────────────────────
describe('isInZone()', () => {
  const zone = { center: { lat: 12.9716, lng: 77.5946 }, radius: 500 };
  const bbox = computeBBox(zone);

  test('returns true for a point at the center of the zone', () => {
    expect(isInZone(12.9716, 77.5946, zone, bbox)).toBe(true);
  });

  test('returns false for a point far outside the zone', () => {
    expect(isInZone(13.5, 78.0, zone, bbox)).toBe(false);
  });

  test('returns false for a point just outside the radius', () => {
    // Move ~600m north (more than 500m radius)
    const pointFarNorth = 12.9716 + (600 / 111320);
    expect(isInZone(pointFarNorth, 77.5946, zone, bbox)).toBe(false);
  });

  test('returns true for a point just inside the radius', () => {
    // Move ~300m north (less than 500m radius)
    const pointNear = 12.9716 + (300 / 111320);
    expect(isInZone(pointNear, 77.5946, zone, bbox)).toBe(true);
  });
});

// ─── Unit Tests: scoreRoute ──────────────────────────────────────────────────
describe('scoreRoute()', () => {
  test('returns expected shape with all required fields', () => {
    const points = [{ lat: 12.9716, lng: 77.5946 }];
    const result = scoreRoute(points, 12);
    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('safetyLevel');
    expect(result).toHaveProperty('trafficNote');
    expect(result).toHaveProperty('breakdown');
    expect(result).toHaveProperty('weights');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('timePeriod');
    expect(result.breakdown).toHaveProperty('crime');
    expect(result.breakdown).toHaveProperty('streetlight');
    expect(result.breakdown).toHaveProperty('crowd');
    expect(result.breakdown).toHaveProperty('accident');
  });

  test('overall score is between 0 and 100', () => {
    const points = [{ lat: 12.9716, lng: 77.5946 }];
    const result = scoreRoute(points, 12);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  test('breakdown scores are all between 0 and 100', () => {
    const points = [
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9756, lng: 77.6064 },
    ];
    const result = scoreRoute(points, 10);
    Object.values(result.breakdown).forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  test('safetyLevel is one of Safe, Moderate, or Unsafe', () => {
    const points = [{ lat: 12.9716, lng: 77.5946 }];
    const result = scoreRoute(points, 12);
    expect(['Safe', 'Moderate', 'Unsafe']).toContain(result.safetyLevel);
  });

  test('timePeriod matches hour input', () => {
    const points = [{ lat: 12.9716, lng: 77.5946 }];
    expect(scoreRoute(points, 10).timePeriod).toBe('day');
    expect(scoreRoute(points, 19).timePeriod).toBe('evening');
    expect(scoreRoute(points, 23).timePeriod).toBe('night');
  });

  test('night scoring adjusts weights for crime and streetlight', () => {
    const points = [{ lat: 12.9716, lng: 77.5946 }];
    const nightResult = scoreRoute(points, 23);
    expect(nightResult.weights.crime).toBe(0.40);
    expect(nightResult.weights.streetlight).toBe(0.30);
  });

  test('evening scoring adjusts weights appropriately', () => {
    const points = [{ lat: 12.9716, lng: 77.5946 }];
    const eveningResult = scoreRoute(points, 19);
    expect(eveningResult.weights.crime).toBe(0.38);
    expect(eveningResult.weights.streetlight).toBe(0.27);
  });

  test('day scoring uses default weights', () => {
    const points = [{ lat: 12.9716, lng: 77.5946 }];
    const dayResult = scoreRoute(points, 10);
    expect(dayResult.weights.crime).toBe(0.35);
    expect(dayResult.weights.streetlight).toBe(0.25);
  });

  test('route through known crime zone produces warnings', () => {
    // Majestic area center (crime_1): lat 12.9767, lng 77.5713
    const points = [{ lat: 12.9767, lng: 77.5713 }];
    const result = scoreRoute(points, 23);
    expect(result.warnings.length).toBeGreaterThan(0);
    const crimeWarnings = result.warnings.filter((w) => w.type === 'crime');
    expect(crimeWarnings.length).toBeGreaterThan(0);
  });

  test('route in safe area has higher score than through crime zone', () => {
    // Safe area: somewhere away from all zones
    const safePoints = [{ lat: 12.85, lng: 77.50 }];
    // Crime zone: Majestic area
    const unsafePoints = [{ lat: 12.9767, lng: 77.5713 }];
    const safeResult = scoreRoute(safePoints, 12);
    const unsafeResult = scoreRoute(unsafePoints, 12);
    expect(safeResult.overall).toBeGreaterThanOrEqual(unsafeResult.overall);
  });

  test('handles empty points array without crashing', () => {
    const result = scoreRoute([], 12);
    expect(result).toHaveProperty('overall');
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  test('handles single-point route', () => {
    const result = scoreRoute([{ lat: 12.9716, lng: 77.5946 }], 12);
    expect(result).toHaveProperty('overall');
  });

  test('handles large route with many points', () => {
    const points = [];
    for (let i = 0; i < 100; i++) {
      points.push({ lat: 12.9 + i * 0.001, lng: 77.5 + i * 0.001 });
    }
    const result = scoreRoute(points, 12);
    expect(result).toHaveProperty('overall');
    expect(result.overall).toBeGreaterThanOrEqual(0);
  });

  test('trafficNote is one of expected values', () => {
    const points = [{ lat: 12.9716, lng: 77.5946 }];
    const result = scoreRoute(points, 12);
    expect([
      'with decent traffic',
      'with moderate traffic',
      'with very low traffic',
    ]).toContain(result.trafficNote);
  });
});

// ─── Integration Tests: API Endpoints ────────────────────────────────────────
describe('GET /api/zones', () => {
  test('returns 200 with zone data', async () => {
    const res = await request(app).get('/api/zones');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('crimeZones');
    expect(res.body).toHaveProperty('streetlights');
    expect(res.body).toHaveProperty('crowdDensity');
    expect(res.body).toHaveProperty('accidentZones');
  });

  test('crimeZones is a non-empty array', async () => {
    const res = await request(app).get('/api/zones');
    expect(Array.isArray(res.body.crimeZones)).toBe(true);
    expect(res.body.crimeZones.length).toBeGreaterThan(0);
  });

  test('each crime zone has required fields', async () => {
    const res = await request(app).get('/api/zones');
    res.body.crimeZones.forEach((zone) => {
      expect(zone).toHaveProperty('id');
      expect(zone).toHaveProperty('name');
      expect(zone).toHaveProperty('severity');
      expect(zone).toHaveProperty('center');
      expect(zone.center).toHaveProperty('lat');
      expect(zone.center).toHaveProperty('lng');
      expect(zone).toHaveProperty('radius');
    });
  });

  test('streetlights data has required structure', async () => {
    const res = await request(app).get('/api/zones');
    expect(Array.isArray(res.body.streetlights)).toBe(true);
    res.body.streetlights.forEach((zone) => {
      expect(zone).toHaveProperty('center');
      expect(zone).toHaveProperty('radius');
      expect(zone).toHaveProperty('density');
    });
  });

  test('returns ETag header for caching', async () => {
    const res = await request(app).get('/api/zones');
    expect(res.headers['etag']).toBeDefined();
  });

  test('returns Cache-Control header', async () => {
    const res = await request(app).get('/api/zones');
    expect(res.headers['cache-control']).toContain('max-age=600');
  });

  test('returns 304 when ETag matches', async () => {
    const res1 = await request(app).get('/api/zones');
    const etag = res1.headers['etag'];

    const res2 = await request(app)
      .get('/api/zones')
      .set('If-None-Match', etag);
    expect(res2.status).toBe(304);
  });
});

describe('POST /api/route/score', () => {
  test('returns 400 when routes is missing', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when routes is not an array', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({ routes: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('routes array is required');
  });

  test('successfully scores a single route', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [
          {
            label: 'Route A',
            points: [
              { lat: 12.9716, lng: 77.5946 },
              { lat: 12.9756, lng: 77.6064 },
            ],
            distance: '2.5 km',
            duration: '8 mins',
          },
        ],
        hour: 14,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0]).toHaveProperty('overall');
    expect(res.body.results[0]).toHaveProperty('safetyLevel');
    expect(res.body.results[0]).toHaveProperty('breakdown');
    expect(res.body.results[0].label).toBe('Route A');
    expect(res.body.results[0].distance).toBe('2.5 km');
    expect(res.body.results[0].duration).toBe('8 mins');
  });

  test('scores multiple routes and sorts by safety', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [
          {
            label: 'Route A',
            points: [{ lat: 12.9767, lng: 77.5713 }], // Crime zone (Majestic)
          },
          {
            label: 'Route B',
            points: [{ lat: 12.85, lng: 77.50 }], // Safe area
          },
        ],
        hour: 12,
      });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(2);
    // Results should be sorted descending by overall score
    expect(res.body.results[0].overall).toBeGreaterThanOrEqual(res.body.results[1].overall);
  });

  test('marks the top route as recommended', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [
          {
            label: 'Route A',
            points: [{ lat: 12.9716, lng: 77.5946 }],
          },
        ],
        hour: 12,
      });

    expect(res.body.results[0].recommended).toBe(true);
    expect(res.body.results[0]).toHaveProperty('recommendation');
  });

  test('uses current hour when hour is not provided', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [
          {
            points: [{ lat: 12.9716, lng: 77.5946 }],
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hour');
    expect(res.body.hour).toBeGreaterThanOrEqual(0);
    expect(res.body.hour).toBeLessThanOrEqual(23);
  });

  test('clamps hour to valid range 0-23', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [{ points: [{ lat: 12.9716, lng: 77.5946 }] }],
        hour: 30,
      });

    expect(res.status).toBe(200);
    expect(res.body.hour).toBe(23);
  });

  test('clamps negative hour to 0', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [{ points: [{ lat: 12.9716, lng: 77.5946 }] }],
        hour: -5,
      });

    expect(res.status).toBe(200);
    expect(res.body.hour).toBe(0);
  });

  test('returns timePeriod in response', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [{ points: [{ lat: 12.9716, lng: 77.5946 }] }],
        hour: 23,
      });

    expect(res.body.timePeriod).toBe('night');
  });

  test('assigns default labels when not provided', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [
          { points: [{ lat: 12.9716, lng: 77.5946 }] },
          { points: [{ lat: 12.9800, lng: 77.6000 }] },
        ],
        hour: 12,
      });

    expect(res.status).toBe(200);
    // Default labels should be Route A, Route B
    const labels = res.body.results.map((r) => r.label);
    expect(labels).toContain('Route A');
    expect(labels).toContain('Route B');
  });

  test('returns warnings for routes through crime zones at night', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [
          {
            points: [{ lat: 12.9767, lng: 77.5713 }], // Majestic area (high crime)
          },
        ],
        hour: 23,
      });

    expect(res.status).toBe(200);
    expect(res.body.results[0].warnings.length).toBeGreaterThan(0);
  });

  test('route scores have routeIndex to map back to original order', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [
          { points: [{ lat: 12.9716, lng: 77.5946 }] },
          { points: [{ lat: 12.9800, lng: 77.6000 }] },
        ],
        hour: 12,
      });

    res.body.results.forEach((r) => {
      expect(r).toHaveProperty('routeIndex');
      expect(typeof r.routeIndex).toBe('number');
    });
  });
});

// ─── Security Tests ──────────────────────────────────────────────────────────
describe('Security', () => {
  test('returns security headers (helmet)', async () => {
    const res = await request(app).get('/api/zones');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  test('returns Content-Security-Policy header', async () => {
    const res = await request(app).get('/api/zones');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  test('rejects routes with invalid coordinates (lat out of range)', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [{ points: [{ lat: 999, lng: 77.5946 }] }],
        hour: 12,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid coordinate');
  });

  test('rejects routes with invalid coordinates (lng out of range)', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [{ points: [{ lat: 12.9716, lng: 999 }] }],
        hour: 12,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid coordinate');
  });

  test('rejects routes with non-numeric coordinates', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [{ points: [{ lat: 'abc', lng: 77.5946 }] }],
        hour: 12,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid coordinate');
  });

  test('rejects more than 10 routes', async () => {
    const routes = Array.from({ length: 11 }, () => ({
      points: [{ lat: 12.9716, lng: 77.5946 }],
    }));
    const res = await request(app)
      .post('/api/route/score')
      .send({ routes, hour: 12 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Maximum 10 routes');
  });

  test('rejects route without points array', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({ routes: [{ label: 'no points' }], hour: 12 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('points array');
  });

  test('accepts exactly 10 routes', async () => {
    const routes = Array.from({ length: 10 }, () => ({
      points: [{ lat: 12.9716, lng: 77.5946 }],
    }));
    const res = await request(app)
      .post('/api/route/score')
      .send({ routes, hour: 12 });
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(10);
  });

  test('accepts boundary coordinates (-90, -180) and (90, 180)', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({
        routes: [
          { points: [{ lat: -90, lng: -180 }, { lat: 90, lng: 180 }] },
        ],
        hour: 12,
      });
    expect(res.status).toBe(200);
  });
});

// ─── Edge Case Tests ─────────────────────────────────────────────────────────
describe('Edge cases', () => {
  test('POST /api/route/score with empty routes array', async () => {
    const res = await request(app)
      .post('/api/route/score')
      .send({ routes: [], hour: 12 });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(0);
  });

  test('scoring route with 0,0 coordinates (ocean)', async () => {
    const result = scoreRoute([{ lat: 0, lng: 0 }], 12);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  test('GET unknown endpoint returns 404', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});
