import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChangePasswordDialog } from './ChangePasswordDialog';

describe('ChangePasswordDialog - Snapshot', () => {
  it('should render change password dialog with centralized content', () => {
    const { container } = render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={vi.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render closed dialog', () => {
    const { container } = render(
      <ChangePasswordDialog
        open={false}
        onOpenChange={vi.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
