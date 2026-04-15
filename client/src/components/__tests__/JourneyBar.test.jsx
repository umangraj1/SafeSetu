import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import JourneyBar from '../JourneyBar';

const mockRoute = {
  routeIndex: 0,
  label: 'Route A',
  overall: 78,
  safetyLevel: 'Safe',
  duration: '15 mins',
  distance: '5.2 km',
  trafficNote: 'with decent traffic',
  breakdown: { crime: 90, streetlight: 80, crowd: 75, accident: 85 },
  warnings: [
    { type: 'crime', severity: 'medium', message: '⚠️ KR Market Zone: Crowded during day' },
  ],
};

describe('JourneyBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders nothing when route is null', () => {
    const { container } = render(<JourneyBar route={null} onEndJourney={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  test('displays the route label in navigation header', () => {
    render(<JourneyBar route={mockRoute} onEndJourney={vi.fn()} />);
    expect(screen.getByText(/Navigating on Route A/)).toBeInTheDocument();
  });

  test('displays safety level badge', () => {
    render(<JourneyBar route={mockRoute} onEndJourney={vi.fn()} />);
    expect(screen.getByText('Safe')).toBeInTheDocument();
  });

  test('displays route stats (duration, distance, safety)', () => {
    render(<JourneyBar route={mockRoute} onEndJourney={vi.fn()} />);
    expect(screen.getByText('15 mins')).toBeInTheDocument();
    expect(screen.getByText('5.2 km')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  test('displays stat labels (ETA, Distance, Safety)', () => {
    render(<JourneyBar route={mockRoute} onEndJourney={vi.fn()} />);
    expect(screen.getByText('ETA')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
  });

  test('shows the first warning message', () => {
    render(<JourneyBar route={mockRoute} onEndJourney={vi.fn()} />);
    expect(screen.getByText(/KR Market Zone/)).toBeInTheDocument();
  });

  test('does not show warnings section when warnings are empty', () => {
    const routeNoWarnings = { ...mockRoute, warnings: [] };
    render(<JourneyBar route={routeNoWarnings} onEndJourney={vi.fn()} />);
    expect(screen.queryByText(/KR Market Zone/)).not.toBeInTheDocument();
  });

  test('displays End Journey button', () => {
    render(<JourneyBar route={mockRoute} onEndJourney={vi.fn()} />);
    expect(screen.getByText('End Journey')).toBeInTheDocument();
  });

  test('calls onEndJourney when End Journey is clicked', () => {
    const onEndJourney = vi.fn();
    render(<JourneyBar route={mockRoute} onEndJourney={onEndJourney} />);
    fireEvent.click(screen.getByText('End Journey'));
    expect(onEndJourney).toHaveBeenCalledTimes(1);
  });

  test('elapsed timer starts at 0:00', () => {
    render(<JourneyBar route={mockRoute} onEndJourney={vi.fn()} />);
    expect(screen.getByText(/0:00 elapsed/)).toBeInTheDocument();
  });

  test('elapsed timer increments after 1 second', () => {
    render(<JourneyBar route={mockRoute} onEndJourney={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/0:01 elapsed/)).toBeInTheDocument();
  });

  test('elapsed timer formats minutes correctly', () => {
    render(<JourneyBar route={mockRoute} onEndJourney={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(65000);
    });
    expect(screen.getByText(/1:05 elapsed/)).toBeInTheDocument();
  });

  test('renders Moderate safety level correctly', () => {
    const moderateRoute = { ...mockRoute, safetyLevel: 'Moderate' };
    render(<JourneyBar route={moderateRoute} onEndJourney={vi.fn()} />);
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  test('renders Unsafe safety level correctly', () => {
    const unsafeRoute = { ...mockRoute, safetyLevel: 'Unsafe' };
    render(<JourneyBar route={unsafeRoute} onEndJourney={vi.fn()} />);
    expect(screen.getByText('Unsafe')).toBeInTheDocument();
  });
});
