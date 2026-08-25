import type { Course } from '../../db';

/** A course read back from IndexedDB, so its generated `id` is guaranteed. */
export type StoredCourse = Course & { id: number };

/**
 * `Course.id` is optional because it's absent before insertion. Anything the
 * list renders has already been stored, so narrow once at the boundary rather
 * than checking for an id in every handler.
 */
export function hasId(course: Course): course is StoredCourse {
  return course.id !== undefined;
}
