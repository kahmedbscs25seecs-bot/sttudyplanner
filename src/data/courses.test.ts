import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import {
  addCourse,
  deleteCourse,
  DuplicateCodeError,
  updateCourse,
  ValidationError,
} from './courses';

const VALID = {
  code: 'CS-101',
  name: 'Introduction to Programming',
  creditHours: 3,
  difficulty: 2,
};

describe('addCourse', () => {
  beforeEach(async () => {
    await db.courses.clear();
  });

  it('adds a course and returns the new id', async () => {
    const id = await addCourse({ ...VALID });
    const stored = await db.courses.get(id);
    expect(stored).toMatchObject({ ...VALID, source: 'manual' });
  });

  it('normalizes code (trim + uppercase) and name (trim) before storage', async () => {
    const id = await addCourse({
      ...VALID,
      code: '  cs-101  ',
      name: '  Intro to Programming  ',
    });
    const stored = await db.courses.get(id);
    expect(stored?.code).toBe('CS-101');
    expect(stored?.name).toBe('Intro to Programming');
  });

  it('rejects duplicates case-insensitively', async () => {
    await addCourse({ ...VALID });
    await expect(
      addCourse({ ...VALID, name: 'A Different Name' }),
    ).rejects.toThrow(DuplicateCodeError);
  });

  it('rolls back cleanly when the duplicate guard trips', async () => {
    await addCourse({ ...VALID });
    await expect(
      addCourse({ ...VALID, code: 'cs-101' }),
    ).rejects.toThrow(DuplicateCodeError);
    // The aborted transaction must not have left a partial write behind.
    expect(await db.courses.count()).toBe(1);
  });

  it.each([
    ['too short', 'C'],
    ['trailing hyphen', 'CS-'],
    ['leading hyphen', '-CS'],
    ['internal space', 'CS 101'],
    ['empty', '   '],
    ['over 10 chars', 'ABCDEFG-101'],
  ])('rejects %s code (%j)', async (_label, code) => {
    const err = await addCourse({ ...VALID, code }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('code');
  });

  it.each([
    ['empty', '   '],
    ['over 80 chars', 'x'.repeat(81)],
  ])('rejects %s name', async (_label, name) => {
    const err = await addCourse({ ...VALID, name }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('name');
  });

  it.each([0, 7, 2.5])('rejects creditHours of %d', async (creditHours) => {
    const err = await addCourse({ ...VALID, creditHours }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('creditHours');
  });

  it.each([0, 6, 3.5])('rejects difficulty of %d', async (difficulty) => {
    const err = await addCourse({ ...VALID, difficulty }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('difficulty');
  });
});

describe('updateCourse', () => {
  beforeEach(async () => {
    await db.courses.clear();
  });

  it('applies a partial patch and keeps untouched fields', async () => {
    const id = await addCourse({ ...VALID });
    await updateCourse(id, { difficulty: 4 });
    const stored = await db.courses.get(id);
    expect(stored).toMatchObject({
      code: 'CS-101',
      name: VALID.name,
      creditHours: 3,
      difficulty: 4,
      source: 'manual',
    });
  });

  it('lets a course keep its own code', async () => {
    const id = await addCourse({ ...VALID });
    await expect(updateCourse(id, { code: 'cs-101' })).resolves.toBeUndefined();
  });

  it('rejects a patch that collides with another course', async () => {
    await addCourse({ ...VALID });
    const otherId = await addCourse({ ...VALID, code: 'EE-210' });
    await expect(updateCourse(otherId, { code: 'CS-101' })).rejects.toThrow(
      DuplicateCodeError,
    );
  });

  it('resolves silently for an unknown id', async () => {
    await expect(updateCourse(9999, { difficulty: 3 })).resolves.toBeUndefined();
  });

  it('validates patched fields with the same rules as creation', async () => {
    const id = await addCourse({ ...VALID });
    const err = await updateCourse(id, { name: '   ' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('name');
  });
});

describe('deleteCourse', () => {
  beforeEach(async () => {
    await db.courses.clear();
  });

  it('deletes an existing course', async () => {
    const id = await addCourse({ ...VALID });
    await deleteCourse(id);
    expect(await db.courses.get(id)).toBeUndefined();
  });

  it('resolves silently for an unknown id', async () => {
    await expect(deleteCourse(9999)).resolves.toBeUndefined();
  });
});
