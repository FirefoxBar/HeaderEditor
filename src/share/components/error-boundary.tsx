import type { ComponentType } from 'react';
import { withErrorBoundary as w } from 'react-error-boundary';

export const withErrorBoundary = <Props extends object>(
  Component: ComponentType<Props>,
) =>
  w(Component, {
    fallback: <div>Something went wrong</div>,
    onError(error, info) {
      console.error(error, info);
    },
  });
