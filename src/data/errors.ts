/**
 * Field-scoped input rejection, shared by every data-access module.
 * `field` routes the error to a form control (guard it against that form's
 * known fields); `message` is user-facing copy — render it verbatim.
 */
export class ValidationError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}
