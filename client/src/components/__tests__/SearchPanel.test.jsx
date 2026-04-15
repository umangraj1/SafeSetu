import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchPanel from '../SearchPanel';

const defaultProps = {
  onSearch: vi.fn(),
  loading: false,
  onUseMyLocation: vi.fn(),
  hasResults: false,
  onClear: vi.fn(),
  mapsLoaded: true,
  expanded: true,
  onExpandedChange: vi.fn(),
};

describe('SearchPanel', () => {
  test('renders the app title', () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText('SafeSetu')).toBeInTheDocument();
  });

  test('renders the subtitle', () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText('Find the safest way to your destination')).toBeInTheDocument();
  });

  test('renders origin and destination input fields', () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('Where are you?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Where to?')).toBeInTheDocument();
  });

  test('renders time option buttons', () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Afternoon')).toBeInTheDocument();
    expect(screen.getByText('Evening')).toBeInTheDocument();
    expect(screen.getByText('Night')).toBeInTheDocument();
  });

  test('renders the search button', () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText('Find Safest Route')).toBeInTheDocument();
  });

  test('search button is disabled when origin is empty', () => {
    render(<SearchPanel {...defaultProps} />);
    const btn = screen.getByText('Find Safest Route').closest('button');
    expect(btn).toBeDisabled();
  });

  test('updates origin input value on change', () => {
    render(<SearchPanel {...defaultProps} />);
    const originInput = screen.getByPlaceholderText('Where are you?');
    fireEvent.change(originInput, { target: { value: 'MG Road' } });
    expect(originInput.value).toBe('MG Road');
  });

  test('updates destination input value on change', () => {
    render(<SearchPanel {...defaultProps} />);
    const destInput = screen.getByPlaceholderText('Where to?');
    fireEvent.change(destInput, { target: { value: 'Koramangala' } });
    expect(destInput.value).toBe('Koramangala');
  });

  test('swap button swaps origin and destination values', () => {
    render(<SearchPanel {...defaultProps} />);
    const originInput = screen.getByPlaceholderText('Where are you?');
    const destInput = screen.getByPlaceholderText('Where to?');

    fireEvent.change(originInput, { target: { value: 'MG Road' } });
    fireEvent.change(destInput, { target: { value: 'Koramangala' } });

    const swapBtn = screen.getByLabelText('Swap origin and destination');
    fireEvent.click(swapBtn);

    expect(originInput.value).toBe('Koramangala');
    expect(destInput.value).toBe('MG Road');
  });

  test('shows loading state when loading prop is true', () => {
    render(<SearchPanel {...defaultProps} loading={true} />);
    expect(screen.getByText('Analyzing safety...')).toBeInTheDocument();
  });

  test('shows clear button when hasResults is true', () => {
    render(<SearchPanel {...defaultProps} hasResults={true} />);
    const clearBtn = screen.getByLabelText('Clear route');
    expect(clearBtn).toBeInTheDocument();
  });

  test('shows collapsed mini bar when not expanded and has results', () => {
    render(<SearchPanel {...defaultProps} expanded={false} hasResults={true} />);
    // In collapsed mode, the full form should not be visible
    expect(screen.queryByPlaceholderText('Where are you?')).not.toBeInTheDocument();
  });

  test('renders use my location button', () => {
    render(<SearchPanel {...defaultProps} />);
    const locBtn = screen.getByLabelText('Use my current location');
    expect(locBtn).toBeInTheDocument();
  });

  test('calls onUseMyLocation when location button is clicked', () => {
    const onUseMyLocation = vi.fn();
    render(<SearchPanel {...defaultProps} onUseMyLocation={onUseMyLocation} />);
    fireEvent.click(screen.getByLabelText('Use my current location'));
    expect(onUseMyLocation).toHaveBeenCalled();
  });

  test('selects time option on click', () => {
    render(<SearchPanel {...defaultProps} />);
    const nightBtn = screen.getByText('Night');
    fireEvent.click(nightBtn);
    // The button should now have the active styling (purple bg)
    expect(nightBtn.closest('button')).toHaveClass('bg-purple-600');
  });

  test('Travel Time label is present', () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText('Travel Time')).toBeInTheDocument();
  });
});
