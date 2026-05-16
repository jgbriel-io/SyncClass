import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TeachersTableRow } from './TeachersTableRow';

describe('TeachersTableRow - Snapshot', () => {
  const mockTeacher = {
    id: '1',
    name: 'Prof. Maria',
    email: 'maria@example.com',
    phone: '11988888888',
    status: 'ativo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    school_id: 'school-1',
  };

  const mockHandlers = {
    onViewDetail: vi.fn(),
    onEdit: vi.fn(),
    onResetPassword: vi.fn(),
    onStatusChange: vi.fn(),
    onHardDelete: vi.fn(),
  };

  it('should render teacher row with centralized content - active', () => {
    const { container } = render(
      <table>
        <tbody>
          <TeachersTableRow
            teacher={mockTeacher}
            totalStudents={15}
            monthlyRevenue={5000}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render teacher row - inactive', () => {
    const inactiveTeacher = { ...mockTeacher, status: 'inativo' };
    const { container } = render(
      <table>
        <tbody>
          <TeachersTableRow
            teacher={inactiveTeacher}
            totalStudents={0}
            monthlyRevenue={0}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });
});
