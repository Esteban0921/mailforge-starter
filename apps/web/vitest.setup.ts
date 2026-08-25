import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Testing Library's auto-cleanup hooks into a global afterEach, which only
// exists when vitest's `globals` option is on. This project imports
// afterEach explicitly instead, so cleanup is wired up by hand.
afterEach(() => {
  cleanup();
});
