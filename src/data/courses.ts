import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Course } from '../db';

/** What callers may set. `id` and `source` are owned by the data layer. */
export interface CourseInput {
  code: string;
  name: string;
  creditHours: number;
  difficulty: number;
}

/** A different course already uses this code (comparison case-insensitive). */
export class DuplicateCodeError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(`Course code ${code} is already in use`);
    this.name = 'DuplicateCodeError';
    this.code = code;
  }
}

/** Field-scoped input rejection — routes straight to a form field, no parsing. */
export class ValidationError extends Error {
  readonly field: keyof CourseInput;
  constructor(field: keyof CourseInput, message: string) {
    super(`${field}: ${message}`);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Lenient NUST-style: letters/digits/hyphens, must start and end
// alphanumerically ("CS-101" ✓, "CS-" ✗), 2–10 chars after normalization.
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,8}[A-Z0-9]$/;

const NAME_MAX = 80;

// Per-field validators so partial patches can re-validate exactly what they carry.
function validatedCode(raw: string): string {
  const code = raw.trim().toUpperCase();
  if (!CODE_PATTERN.test(code)) {
    throw new ValidationError(
      'code',
      'Use 2–10 characters: letters, numbers and hyphens (e.g. CS-101)',
    );
  }
  return code;
}

function validatedName(raw: string): string {
  const name = raw.trim();
  if (!name) throw new ValidationError('name', 'Name is required');
  if (name.length > NAME_MAX) {
    throw new ValidationError(
      'name',
      `Keep the name to ${NAME_MAX} characters or fewer`,
    );
  }
  return name;
}

function validatedCreditHours(raw: number): number {
  if (!Number.isInteger(raw) || raw < 1 || raw > 6) {
    throw new ValidationError('creditHours', 'Credit hours must be a whole number between 1 and 6');
  }
  return raw;
}

function validatedDifficulty(raw: number): number {
  if (!Number.isInteger(raw) || raw < 1 || raw > 5) {
    throw new ValidationError('difficulty', 'Difficulty must be a whole number between 1 and 5');
  }
  return raw;
}

/**
 * Live course list for the UI. `undefined` while loading, `[]` when the
 * user genuinely has no courses — callers render those differently.
 */
export function useCourses(): Course[] | undefined {
  return useLiveQuery(() => db.courses.orderBy('code').toArray(), []);
}

export async function addCourse(raw: CourseInput): Promise<number> {
  // Normalize + validate up front; storage below only sees clean data.
  const input = {
    code: validatedCode(raw.code),
    name: validatedName(raw.name),
    creditHours: validatedCreditHours(raw.creditHours),
    difficulty: validatedDifficulty(raw.difficulty),
  };

  // Single 'rw' transaction makes check-then-write atomic against other
  // writers (a second open tab counts). Throwing aborts the transaction.
  return db.transaction('rw', db.courses, async (): Promise<number> => {
    const clash = await db.courses.where('code').equals(input.code).first();
    if (clash) throw new DuplicateCodeError(input.code);
    return db.courses.add({ ...input, source: 'manual' });
  });
}

export async function updateCourse(id: number, rawPatch: Partial<CourseInput>): Promise<void> {
  // Validate only what the patch carries; absent fields stay untouched.
  const patch: Partial<CourseInput> = {};
  if (rawPatch.code !== undefined) patch.code = validatedCode(rawPatch.code);
  if (rawPatch.name !== undefined) patch.name = validatedName(rawPatch.name);
  if (rawPatch.creditHours !== undefined) {
    patch.creditHours = validatedCreditHours(rawPatch.creditHours);
  }
  if (rawPatch.difficulty !== undefined) {
    patch.difficulty = validatedDifficulty(rawPatch.difficulty);
  }

  await db.transaction('rw', db.courses, async () => {
    const existing = await db.courses.get(id);
    if (!existing) return; // unknown id resolves silently (local single-user app)

    if (patch.code !== undefined && patch.code !== existing.code) {
      const clash = await db.courses.where('code').equals(patch.code).first();
      if (clash && clash.id !== id) throw new DuplicateCodeError(patch.code);
    }

    await db.courses.put({ ...existing, ...patch });
  });
}

export async function deleteCourse(id: number): Promise<void> {
  // Deleting an unknown id is already a silent no-op at the Dexie level.
  await db.courses.delete(id);
}
