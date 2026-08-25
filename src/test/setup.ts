import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { installDialogPolyfill } from './dialogPolyfill';

// jsdom has no <dialog> methods; see dialogPolyfill.ts for what this does and
// does not cover.
installDialogPolyfill();
