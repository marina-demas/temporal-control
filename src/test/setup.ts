import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only cleans up automatically when test globals are on.
// We import from vitest explicitly, so do it ourselves.
afterEach(() => {
  cleanup();
});
