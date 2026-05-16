import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NavLink } from './NavLink';

describe('NavLink - Snapshot', () => {
  it('should render nav link with centralized content', () => {
    const { container } = render(
      <BrowserRouter>
        <NavLink to="/test" icon="Users">
          Test Link
        </NavLink>
      </BrowserRouter>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render active nav link', () => {
    const { container } = render(
      <BrowserRouter>
        <NavLink to="/" icon="Home" isActive={true}>
          Home
        </NavLink>
      </BrowserRouter>
    );
    expect(container).toMatchSnapshot();
  });
});
