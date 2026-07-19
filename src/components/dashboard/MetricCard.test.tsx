import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MetricCard } from "./MetricCard";
import { Users } from "@phosphor-icons/react";
import { dashboard } from "@/content";

describe("MetricCard - Snapshot", () => {
  it("should render metric card with centralized content", () => {
    const { container } = render(
      <MetricCard
        title={dashboard.metrics.totalStudents}
        value={45}
        icon={Users}
        trend={{ value: 5, direction: "up" }}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it("should render metric card with downward trend", () => {
    const { container } = render(
      <MetricCard
        title={dashboard.metrics.cancellations}
        value={3}
        icon={Users}
        trend={{ value: 2, direction: "down" }}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it("should render metric card without trend", () => {
    const { container } = render(
      <MetricCard
        title={dashboard.metrics.revenue}
        value={15000}
        icon={Users}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
