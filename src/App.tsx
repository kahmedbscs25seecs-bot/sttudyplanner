import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

export default function App() {
  const courses = useLiveQuery(() => db.courses.toArray());
  const habits = useLiveQuery(() => db.habits.toArray());

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [habitTitle, setHabitTitle] = useState('');
  const [apiStatus, setApiStatus] = useState<string>('Not Tested');

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    await db.courses.add({
      code: code.toUpperCase(),
      name,
      creditHours: 3,
      difficulty: 3,
      source: 'manual'
    });
    setCode('');
    setName('');
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle) return;
    await db.habits.add({
      title: habitTitle,
      active: true,
      order: (habits?.length || 0) + 1
    });
    setHabitTitle('');
  };

  const testNustDevKitEndpoint = async () => {
    setApiStatus('Testing network connection...');
    try {
      const res = await fetch('https://www.nustdevkit.com/#description/introduction', {
        method: 'GET',
        mode: 'cors'
      });
      setApiStatus(`HTTP Response Status: ${res.status}`);
    } catch (err: any) {
      setApiStatus(`Adapter Fetch Result: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-emerald-400">Day 0 Stack Verification</h1>
          <p className="text-slate-400 text-sm">Testing React, Tailwind v4, IndexedDB (Dexie), and Network Connectivity</p>
        </header>

        {/* Section 1: Course Storage Verification */}
        <section className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">1. IndexedDB Course Persistence</h2>
          <form onSubmit={handleAddCourse} className="flex gap-2">
            <input
              type="text"
              placeholder="Code (e.g. CS212)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Course Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm flex-1 focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-medium cursor-pointer">
              Add Course
            </button>
          </form>

          <div className="space-y-2">
            {courses?.map((c) => (
              <div key={c.id} className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded border border-slate-800">
                <span className="font-mono text-emerald-400">{c.code}</span>
                <span className="text-slate-300">{c.name}</span>
                <span className="text-xs text-slate-500 uppercase">{c.source}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Habit Storage Verification */}
        <section className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">2. Habit Matrix Storage</h2>
          <form onSubmit={handleAddHabit} className="flex gap-2">
            <input
              type="text"
              placeholder="Habit Title (e.g. Solve 2 LeetCode problems)"
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm flex-1 focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-medium cursor-pointer">
              Add Habit
            </button>
          </form>

          <ul className="list-disc list-inside space-y-1 text-slate-300">
            {habits?.map((h) => (
              <li key={h.id}>{h.title}</li>
            ))}
          </ul>
        </section>

        {/* Section 3: Integration Network Test */}
        <section className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">3. External Integration Network Test</h2>
          <button
            onClick={testNustDevKitEndpoint}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-medium cursor-pointer"
          >
            Run Network Test
          </button>
          <div className="p-3 bg-slate-900 rounded border border-slate-800 font-mono text-xs text-slate-300">
            {apiStatus}
          </div>
        </section>
      </div>
    </div>
  );
}