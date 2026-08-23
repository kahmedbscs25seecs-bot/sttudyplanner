import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { Habits } from './pages/Habits';
import { Tasks } from './pages/Tasks';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Everything renders inside the app shell (sidebar / bottom tabs). */}
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="habits" element={<Habits />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
