import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SOSButton from '../SOSButton';

describe('SOSButton', () => {
  test('renders nothing when visible is false', () => {
    const { container } = render(<SOSButton visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders the SOS button when visible is true', () => {
    render(<SOSButton visible={true} />);
    const btn = screen.getByLabelText(/open emergency contacts/i);
    expect(btn).toBeInTheDocument();
  });

  test('displays "SOS" text on the button', () => {
    render(<SOSButton visible={true} />);
    expect(screen.getByText('SOS')).toBeInTheDocument();
  });

  test('expands to show emergency contacts on click', () => {
    render(<SOSButton visible={true} />);
    const btn = screen.getByLabelText(/open emergency contacts/i);
    fireEvent.click(btn);
    expect(screen.getByText('Police')).toBeInTheDocument();
    expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
    // "Emergency" appears in both the header and as a contact label
    const emergencyLinks = screen.getAllByText('Emergency');
    expect(emergencyLinks.length).toBeGreaterThanOrEqual(1);
  });

  test('shows correct phone numbers', () => {
    render(<SOSButton visible={true} />);
    fireEvent.click(screen.getByLabelText(/open emergency contacts/i));
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.getByText('9600008233')).toBeInTheDocument();
  });

  test('emergency contacts have tel: links', () => {
    render(<SOSButton visible={true} />);
    fireEvent.click(screen.getByLabelText(/open emergency contacts/i));
    const policeLink = screen.getByText('Police').closest('a');
    expect(policeLink).toHaveAttribute('href', 'tel:100');
    // Use getAllByText since "Emergency" appears in both header and contact
    const emergencyElements = screen.getAllByText('Emergency');
    const emergencyLink = emergencyElements.find((el) => el.closest('a'));
    expect(emergencyLink.closest('a')).toHaveAttribute('href', 'tel:112');
  });

  test('collapses on second click', () => {
    render(<SOSButton visible={true} />);
    const btn = screen.getByLabelText(/open emergency contacts/i);
    fireEvent.click(btn);
    expect(screen.getByText('Police')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText(/close emergency contacts/i);
    fireEvent.click(closeBtn);
    // Panel should still be in DOM but with pointer-events: none (opacity 0)
    const panel = screen.getByText('Police').closest('div[aria-hidden]');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  test('has proper aria-expanded attribute', () => {
    render(<SOSButton visible={true} />);
    const btn = screen.getByLabelText(/open emergency contacts/i);
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(btn);
    const closeBtn = screen.getByLabelText(/close emergency contacts/i);
    expect(closeBtn).toHaveAttribute('aria-expanded', 'true');
  });

  test('has aria-haspopup attribute', () => {
    render(<SOSButton visible={true} />);
    const btn = screen.getByLabelText(/open emergency contacts/i);
    expect(btn).toHaveAttribute('aria-haspopup', 'true');
  });
});
