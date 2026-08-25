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

export class NUSTDatabase extends Dexie {
  // Key type params make auto-increment ids flow through Dexie's own typings
  // (add() → Promise<number>) instead of every caller re-narrowing `any`.
  courses!: Table<Course, number>;
  habits!: Table<Habit, number>;

  constructor() {
    super('NUSTStudyAppDB');
    this.version(1).stores({
      courses: '++id, code, name, source',
      habits: '++id, title, active'
    });
  }
}

export const db = new NUSTDatabase();