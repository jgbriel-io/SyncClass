import React from "react";
import { SectionErrorBoundary } from "./SectionErrorBoundary";

/**
 * HOC para envolver componentes com SectionErrorBoundary
 * 
 * @example
 * export default withSectionErrorBoundary(FinancialView);
 */
export function withSectionErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => (
    <SectionErrorBoundary>
      <Component {...props} />
    </SectionErrorBoundary>
  );

  WrappedComponent.displayName = `withSectionErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
}
