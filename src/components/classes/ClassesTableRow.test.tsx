import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ClassesTableRow } from './ClassesTableRow';

describe('ClassesTableRow - Snapshot', () => {
  const mockLog = {
    id: '1',
    class_id: 'class-1',
    class_date: '2024-01-15',
    start_at: '2024-01-15T10:00:00Z',
    end_at: '2024-01-15T11:00:00Z',
    duration_minutes: 60,
    grade: 8.5,
    attendance: true,
    updated_at: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:00:00Z',
    school_id: 'school-1',
    students: {
      id: 'student-1',
      name: 'João Silva',
    },
    financial_records: [],
    financial_record_class_logs: [],
  };

  const mockHandlers = {
    onViewDetail: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onEvaluate: vi.fn(),
  };

  it('should render class row with centralized content', () => {
    const { container } = render(
      <table>
        <tbody>
          <ClassesTableRow
            log={mockLog}
            showTeacherColumn={true}
            teacherName="Prof. Maria"
            statusBadge={{ label: 'Concluída', variant: 'success' }}
            isEvaluationBlocked={false}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render class row without teacher column', () => {
    const { container } = render(
      <table>
        <tbody>
          <ClassesTableRow
            log={mockLog}
            showTeacherColumn={false}
            teacherName="Prof. Maria"
            statusBadge={{ label: 'Concluída', variant: 'success' }}
            isEvaluationBlocked={false}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });
});
