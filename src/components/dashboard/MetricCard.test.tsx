import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricCard } from './MetricCard';
import { Users } from 'lucide-react';

describe('MetricCard - Snapshot', () => {
  it('should render metric card with centralized content', () => {
    const { container } = render(
      <MetricCard
        title="Total de Alunos"
        value={45}
        icon={Users}
        trend={{ value: 5, direction: 'up' }}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render metric card with downward trend', () => {
    const { container } = render(
      <MetricCard
        title="Cancelamentos"
        value={3}
        icon={Users}
        trend={{ value: 2, direction: 'down' }}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render metric card without trend', () => {
    const { container } = render(
      <MetricCard
        title="Receita"
        value={15000}
        icon={Users}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
