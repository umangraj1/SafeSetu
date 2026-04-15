import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OverlayToggle from '../OverlayToggle';

const defaultOverlays = {
  crime: true,
  streetlight: false,
  crowd: false,
  accident: false,
  traffic: false,
};

describe('OverlayToggle', () => {
  test('renders the toggle button', () => {
    render(<OverlayToggle activeOverlays={defaultOverlays} onToggle={vi.fn()} />);
    const btn = screen.getByTitle('Toggle safety overlays');
    expect(btn).toBeInTheDocument();
  });

  test('shows active count badge when overlays are active', () => {
    render(<OverlayToggle activeOverlays={defaultOverlays} onToggle={vi.fn()} />);
    // 1 overlay is active (crime)
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('updates badge when multiple overlays are active', () => {
    const multiActive = { ...defaultOverlays, streetlight: true, crowd: true };
    render(<OverlayToggle activeOverlays={multiActive} onToggle={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('opens dropdown when toggle button is clicked', () => {
    render(<OverlayToggle activeOverlays={defaultOverlays} onToggle={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Toggle safety overlays'));
    expect(screen.getByText('Safety Layers')).toBeInTheDocument();
    expect(screen.getByText('Crime')).toBeInTheDocument();
    expect(screen.getByText('Lights')).toBeInTheDocument();
    expect(screen.getByText('Crowd')).toBeInTheDocument();
    expect(screen.getByText('Accidents')).toBeInTheDocument();
    expect(screen.getByText('Traffic')).toBeInTheDocument();
  });

  test('calls onToggle with correct key when overlay button is clicked', () => {
    const onToggle = vi.fn();
    render(<OverlayToggle activeOverlays={defaultOverlays} onToggle={onToggle} />);
    fireEvent.click(screen.getByTitle('Toggle safety overlays'));
    fireEvent.click(screen.getByText('Lights'));
    expect(onToggle).toHaveBeenCalledWith('streetlight');
  });

  test('calls onToggle for each overlay type', () => {
    const onToggle = vi.fn();
    render(<OverlayToggle activeOverlays={defaultOverlays} onToggle={onToggle} />);
    fireEvent.click(screen.getByTitle('Toggle safety overlays'));

    fireEvent.click(screen.getByText('Crime'));
    expect(onToggle).toHaveBeenCalledWith('crime');

    fireEvent.click(screen.getByText('Crowd'));
    expect(onToggle).toHaveBeenCalledWith('crowd');

    fireEvent.click(screen.getByText('Accidents'));
    expect(onToggle).toHaveBeenCalledWith('accident');

    fireEvent.click(screen.getByText('Traffic'));
    expect(onToggle).toHaveBeenCalledWith('traffic');
  });

  test('closes dropdown on second click of toggle button', () => {
    render(<OverlayToggle activeOverlays={defaultOverlays} onToggle={vi.fn()} />);
    const btn = screen.getByTitle('Toggle safety overlays');
    fireEvent.click(btn);
    expect(screen.getByText('Safety Layers')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.queryByText('Safety Layers')).not.toBeInTheDocument();
  });

  test('shows no badge when no overlays are active', () => {
    const noneActive = { crime: false, streetlight: false, crowd: false, accident: false, traffic: false };
    render(<OverlayToggle activeOverlays={noneActive} onToggle={vi.fn()} />);
    // No count badge should exist
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
