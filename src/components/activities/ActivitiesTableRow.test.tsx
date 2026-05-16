import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ActivitiesTableRow } from './ActivitiesTableRow';

describe('ActivitiesTableRow - Snapshot', () => {
  const mockActivity = {
    id: '1',
    title: 'Exercício de Listening',
    description: 'Escute e responda',
    class_id: 'class-1',
    class_name: 'Inglês Básico',
    teacher_id: 'teacher-1',
    teacher_name: 'Prof. Maria',
    due_date: '2024-02-15',
    status: 'enviada',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    school_id: 'school-1',
  };

  const mockHandlers = {
    onViewDetail: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('should render activity row with centralized content - sent', () => {
    const { container } = render(
      <table>
        <tbody>
          <ActivitiesTableRow
            activity={mockActivity}
            deliveredCount={5}
            totalStudents={8}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render activity row - pending', () => {
    const pendingActivity = { ...mockActivity, status: 'pendente' };
    const { container } = render(
      <table>
        <tbody>
          <ActivitiesTableRow
            activity={pendingActivity}
            deliveredCount={0}
            totalStudents={8}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });
});
