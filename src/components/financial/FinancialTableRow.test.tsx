import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { FinancialTableRow } from "./FinancialTableRow";

describe("FinancialTableRow - Snapshot", () => {
  const mockRecord = {
    id: "1",
    student_id: "student-1",
    amount: "500.00",
    due_date: "2024-02-15",
    status: "pendente",
    payment_method: "PIX",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    school_id: "school-1",
    students: {
      id: "student-1",
      name: "João Silva",
      teacher_id: "teacher-1",
    },
    actualStatus: "pendente",
    class_logs: null,
    package_classes: [],
  };

  const mockHandlers = {
    onViewHistory: vi.fn(),
    onEdit: vi.fn(),
    onRequestRefund: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should render financial row with centralized content - pending", () => {
    const { container } = render(
      <table>
        <tbody>
          <FinancialTableRow
            record={mockRecord}
            showTeacherColumn={true}
            teacherMap={new Map([["teacher-1", "Prof. Maria"]])}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });

  it("should render financial row - paid", () => {
    const paidRecord = { ...mockRecord, status: "pago", actualStatus: "pago" };
    const { container } = render(
      <table>
        <tbody>
          <FinancialTableRow
            record={paidRecord}
            showTeacherColumn={true}
            teacherMap={new Map([["teacher-1", "Prof. Maria"]])}
            {...mockHandlers}
          />
        </tbody>
      </table>
    );
    expect(container).toMatchSnapshot();
  });
});
