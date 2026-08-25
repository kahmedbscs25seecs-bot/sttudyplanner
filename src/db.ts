import Dexie, { type Table } from 'dexie';

export interface Course {
  id?: number;
  code: string;
  name: string;
  creditHours: number;
  difficulty: number;
  source: 'lms' | 'manual';
}

export interface Habit {
  id?: number;
  title: string;
  active: boolean;
  order: number;
}

/** One habit checked off on one local day. The pair is the primary key. */
export interface Completion {
  habitId: number;
  /** Local calendar day, 'YYYY-MM-DD'. */
  date: string;
}

export type TaskStatus = 'todo' | 'done';

export interface Task {
  id?: number;
  title: string;
  /** Absent = unassigned (a task can stand alone — hostel forms exist). */
  courseId?: number;
  /** Absent = no deadline; local calendar day, 'YYYY-MM-DD'. */
  dueDate?: string;
  status: TaskStatus;
  notes?: string;
  /** Local day the task was marked done — the Done section orders by it. */
  completedAt?: string;
}

export class NUSTDatabase extends Dexie {
  // Key type params make auto-increment ids flow through Dexie's own typings
  // (add() → Promise<number>) instead of every caller re-narrowing `any`.
  courses!: Table<Course, number>;
  habits!: Table<Habit, number>;
  completions!: Table<Completion, [number, string]>;
  tasks!: Table<Task, number>;

  constructor(name = 'NUSTStudyAppDB') {
    super(name);
    this.version(1).stores({
      courses: '++id, code, name, source',
      habits: '++id, title, active'
    });
    this.version(2)
      .stores({
        courses: '++id, code, name, source',
        // `active` was dropped as an index: booleans are not valid IndexedDB
        // keys, so v1's index silently contained no rows at all.
        habits: '++id, title, order',
        // Composite primary key — engine-level uniqueness per (habit, day).
        completions: '[habitId+date], habitId, date'
      })
      .upgrade(async (tx) => {
        // Records missing an indexed property are invisible to that index,
        // so legacy rows without `order` get sequential backfill positions.
        const habits = tx.table('habits');
        const rows = await habits.toCollection().toArray();
        let next = 0;
        for (const row of rows) {
          if (typeof row.order !== 'number') {
            await habits.update(row.id, { order: next });
            next += 1;
          }
        }
      });
    // v3 adds tasks. Indexes only where targeted lookups exist today
    // (courseId: unassign + counts). The list itself reads toArray() and
    // sorts in JS — optional fields (courseId/dueDate) are ABSENT on some
    // rows, and IndexedDB omits absent-key records from indexes entirely,
    // so orderBy('dueDate') would silently drop undated tasks.
    this.version(3).stores({
      tasks: '++id, courseId, dueDate, status'
    });
  }
}

export const db = new NUSTDatabase();
