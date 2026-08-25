/**
 * jsdom 30 implements `<dialog>`'s reflected `open` property but none of its
 * methods — `show`, `showModal` and `close` are all undefined — so any component
 * built on the native element throws "not a function" under test.
 *
 * This installs the smallest shim that keeps those components testable:
 * `open` toggling (delegating to jsdom's real reflected property) and the
 * `close` event that React's `onClose` is wired to.
 *
 * It deliberately does NOT emulate focus trapping, background inertness,
 * `::backdrop`, or Escape-to-close. Those are the platform behaviors we chose
 * the native element *for*, and they can only be verified in a real browser —
 * which is why the merge gate requires a browser check alongside these tests.
 */
export function installDialogPolyfill(): void {
  const proto = globalThis.HTMLDialogElement?.prototype;
  if (!proto || typeof proto.showModal === 'function') return;

  proto.show = function show(this: HTMLDialogElement) {
    this.open = true;
  };

  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };

  proto.close = function close(this: HTMLDialogElement, returnValue?: string) {
    if (!this.open) return;
    this.open = false;
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event('close'));
  };
}
