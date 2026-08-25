import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { installDialogPolyfill } from './dialogPolyfill';
import { configure } from '@testing-library/dom';

// RTL's default 1s async timeout assumes a quiet machine; this one often
// isn't (see fileParallelism note in vite.config.ts). A real hang still
// fails — it just gets a fair chance to resolve first.
configure({ asyncUtilTimeout: 8000 });

// jsdom has no <dialog> methods; see dialogPolyfill.ts for what this does and
// does not cover.
installDialogPolyfill();
