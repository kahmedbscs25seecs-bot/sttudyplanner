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
  courses!: Table<Course>;
  habits!: Table<Habit>;

  constructor() {
    super('NUSTStudyAppDB');
    this.version(1).stores({
      courses: '++id, code, name, source',
      habits: '++id, title, active'
    });
  }
}

export const db = new NUSTDatabase();