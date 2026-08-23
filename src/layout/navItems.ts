import {
  LayoutDashboard,
  BookOpen,
  Flame,
  ListChecks,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** true for the index route so "/" doesn't stay active on every path */
  end?: boolean;
}

/** Single source of truth for navigation — used by Sidebar and BottomTabs. */
export const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Courses', to: '/courses', icon: BookOpen },
  { label: 'Habits', to: '/habits', icon: Flame },
  { label: 'Tasks', to: '/tasks', icon: ListChecks },
];
