import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RouteResults from '../RouteResults';

const mockResults = [
  {
    routeIndex: 0,
    label: 'Route A',
    overall: 82,
    safetyLevel: 'Safe',
    duration: '15 mins',
    distance: '5.2 km',
    trafficNote: 'with decent traffic',
    recommended: true,
    recommendation: 'Route A is safer (82% safety score), with decent traffic',
    timePeriod: 'day',
    breakdown: { crime: 90, streetlight: 80, crowd: 75, accident: 85 },
    warnings: [
      { type: 'crime', severity: 'medium', message: '⚠️ KR Market Zone: Crowded during day' },
    ],
    weights: { crime: 0.35, streetlight: 0.25, crowd: 0.25, accident: 0.15 },
  },
  {
    routeIndex: 1,
    label: 'Route B',
    overall: 55,
    safetyLevel: 'Moderate',
    duration: '12 mins',
    distance: '4.1 km',
    trafficNote: 'with moderate traffic',
    recommended: false,
    timePeriod: 'day',
    breakdown: { crime: 50, streetlight: 60, crowd: 55, accident: 70 },
    warnings: [],
    weights: { crime: 0.35, streetlight: 0.25, crowd: 0.25, accident: 0.15 },
  },
];

describe('RouteResults', () => {
  test('renders nothing when results is null', () => {
    const { container } = render(
      <RouteResults results={null} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when results is empty array', () => {
    const { container } = render(
      <RouteResults results={[]} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('displays the number of routes analyzed', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(screen.getByText('2 Routes Analyzed')).toBeInTheDocument();
  });

  test('displays route labels', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(screen.getByText('Route A')).toBeInTheDocument();
    expect(screen.getByText('Route B')).toBeInTheDocument();
  });

  test('displays safety levels', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(screen.getByText('Safe')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  test('displays duration and distance', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(screen.getByText('15 mins')).toBeInTheDocument();
    expect(screen.getByText('5.2 km')).toBeInTheDocument();
    expect(screen.getByText('12 mins')).toBeInTheDocument();
    expect(screen.getByText('4.1 km')).toBeInTheDocument();
  });

  test('shows "Safest" badge on recommended route', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(screen.getByText('Safest')).toBeInTheDocument();
  });

  test('shows recommendation text for recommended route', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(screen.getByText(/Route A is safer/)).toBeInTheDocument();
  });

  test('displays time period analysis badge', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(screen.getByText('Daytime Analysis')).toBeInTheDocument();
  });

  test('calls onSelectRoute when a route card is clicked', () => {
    const onSelectRoute = vi.fn();
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={onSelectRoute} onStartJourney={vi.fn()} />
    );
    fireEvent.click(screen.getByText('Route B'));
    expect(onSelectRoute).toHaveBeenCalledWith(1);
  });

  test('shows safety breakdown when "View safety breakdown" is clicked', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    const toggleButtons = screen.getAllByText('View safety breakdown');
    fireEvent.click(toggleButtons[0]);
    expect(screen.getByText('Crime Safety')).toBeInTheDocument();
    expect(screen.getByText('Street Lighting')).toBeInTheDocument();
    expect(screen.getByText('Crowd Presence')).toBeInTheDocument();
    expect(screen.getByText('Road Safety')).toBeInTheDocument();
  });

  test('shows warnings in the breakdown', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    const toggleButtons = screen.getAllByText('View safety breakdown');
    fireEvent.click(toggleButtons[0]);
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText(/KR Market Zone/)).toBeInTheDocument();
  });

  test('hides breakdown when "Hide breakdown" is clicked', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    const toggleButtons = screen.getAllByText('View safety breakdown');
    fireEvent.click(toggleButtons[0]);
    expect(screen.getByText('Crime Safety')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide breakdown'));
    expect(screen.queryByText('Crime Safety')).not.toBeInTheDocument();
  });

  test('displays Start Journey button with selected route label', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    expect(screen.getByText(/Start Journey on Route A/)).toBeInTheDocument();
  });

  test('calls onStartJourney when Start Journey button is clicked', () => {
    const onStartJourney = vi.fn();
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={onStartJourney} />
    );
    fireEvent.click(screen.getByText(/Start Journey on Route A/));
    expect(onStartJourney).toHaveBeenCalledWith(0);
  });

  test('score ring displays overall percentage', () => {
    render(
      <RouteResults results={mockResults} selectedRoute={0} onSelectRoute={vi.fn()} onStartJourney={vi.fn()} />
    );
    // The score ring shows 82 and 55
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('55')).toBeInTheDocument();
  });
});
