import { BookOpen } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export function Courses() {
  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="Your semester's courses — the spine of everything."
        action={<Button disabled>Add course</Button>}
      />
      <EmptyState
        icon={BookOpen}
        title="No courses yet"
        description="Course management arrives on Day 2. You'll add courses by code, name, credit hours, and difficulty — and everything else will link back to them."
      />
    </div>
  );
}
