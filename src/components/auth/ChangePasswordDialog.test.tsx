import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordDialog } from './ChangePasswordDialog';

describe('ChangePasswordDialog', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    mockOnSuccess.mockClear();
  });

  it('should render dialog when open is true', () => {
    render(
      <ChangePasswordDialog
        open={true}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.getByRole('heading', { name: /alterar senha/i })).toBeInTheDocument();
  });

  it('should not render dialog when open is false', () => {
    const { container } = render(
      <ChangePasswordDialog
        open={false}
        onSuccess={mockOnSuccess}
      />
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should have submit button', () => {
    render(
      <ChangePasswordDialog
        open={true}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.getByRole('button', { name: /alterar senha/i })).toBeInTheDocument();
  });

  it('should have three password input fields', () => {
    render(
      <ChangePasswordDialog
        open={true}
        onSuccess={mockOnSuccess}
      />
    );
    const inputs = screen.getAllByDisplayValue('');
    expect(inputs).toHaveLength(3);
    inputs.forEach(input => {
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  it('should have password visibility toggle buttons', () => {
    render(
      <ChangePasswordDialog
        open={true}
        onSuccess={mockOnSuccess}
      />
    );
    const toggleButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg'));
    expect(toggleButtons.length).toBeGreaterThanOrEqual(3);
  });
});
