import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { StudentsTableRow } from './StudentsTableRow';
import type { Student } from '@/hooks/useStudents';

describe('StudentsTableRow - Snapshot', () => {
  const mockStudent: Student = {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    status: 'ativo',
    hourly_rate: 100,
    pay_day: 15,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    teacher_id: 'teacher-1',
    school_id: 'school-1',
  };

  const mockHandlers = {
    onViewDetail: vi.fn(),
    onEdit: vi.fn(),
    onResetPassword: vi.fn(),
    onArchive: vi.fn(),
    onHardDelete: vi.fn(),
  };

  it('should render with centralized content - active student', () => {
    const { container } = render(
      <table>
        <tbody>
          <StudentsTableRow
            student={mockStudent}
            showTeacherColumn={true}
            teacherName="Prof. Maria"
            totalClasses={12}
            monthlyTotal={1200}
            lastClassDateRaw="2024-01-15"
            daysWithoutClass={2}
            financialStatus={{ label: 'Pago', variant: 'success' }}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render with centralized content - inactive student', () => {
    const inactiveStudent = { ...mockStudent, status: 'inativo' };
    const { container } = render(
      <table>
        <tbody>
          <StudentsTableRow
            student={inactiveStudent}
            showTeacherColumn={true}
            teacherName="Prof. Maria"
            totalClasses={0}
            monthlyTotal={null}
            lastClassDateRaw={null}
            daysWithoutClass={null}
            financialStatus={null}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render without teacher column', () => {
    const { container } = render(
      <table>
        <tbody>
          <StudentsTableRow
            student={mockStudent}
            showTeacherColumn={false}
            teacherName="Prof. Maria"
            totalClasses={12}
            monthlyTotal={1200}
            lastClassDateRaw="2024-01-15"
            daysWithoutClass={2}
            financialStatus={{ label: 'Pago', variant: 'success' }}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });
});
