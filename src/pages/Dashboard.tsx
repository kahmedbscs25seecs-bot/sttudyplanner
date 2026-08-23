import { BookOpen, Flame, ListChecks } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

const stats = [
  { label: 'Courses', icon: BookOpen, hint: 'Add your courses on Day 2' },
  { label: 'Active habits', icon: Flame, hint: 'Daily habit tracking soon' },
  { label: 'Open tasks', icon: ListChecks, hint: 'Assignments & deadlines soon' },
];

export function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your study home base — everything in one place."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, icon: Icon, hint }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">{label}</span>
              <Icon className="h-[18px] w-[18px] text-accent" strokeWidth={2} />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-ink">—</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Welcome 👋</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          This is the shell of your NUST Study App — navigation, layout, and the
          design system are in place. Next we'll bring these sections to life,
          starting with Courses: the spine everything else connects to.
        </p>
      </Card>
    </div>
  );
}
