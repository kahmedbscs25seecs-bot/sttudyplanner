import { ListChecks } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export function Tasks() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Assignments and deadlines, sorted by what's due next."
        action={<Button disabled>Add task</Button>}
      />
      <EmptyState
        icon={ListChecks}
        title="No tasks yet"
        description="Task and assignment tracking arrives on Day 4 — each task can link to a course and a due date."
      />
    </div>
  );
}
