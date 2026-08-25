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

export class NUSTDatabase extends Dexie {
  // Key type params make auto-increment ids flow through Dexie's own typings
  // (add() → Promise<number>) instead of every caller re-narrowing `any`.
  courses!: Table<Course, number>;
  habits!: Table<Habit, number>;
  completions!: Table<Completion, [number, string]>;

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
  }
}

export const db = new NUSTDatabase();
