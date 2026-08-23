import { Flame } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export function Habits() {
  return (
    <div>
      <PageHeader
        title="Habits"
        subtitle="Small daily actions that compound over a semester."
        action={<Button disabled>Add habit</Button>}
      />
      <EmptyState
        icon={Flame}
        title="No habits yet"
        description="Habit tracking with daily check-offs and streaks arrives on Day 3."
      />
    </div>
  );
}
