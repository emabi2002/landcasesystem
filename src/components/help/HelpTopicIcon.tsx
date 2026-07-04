'use client';

import {
  LogIn,
  LayoutDashboard,
  Search,
  FolderOpen,
  FilePlus,
  FilePlus2,
  FileText,
  Users,
  Upload,
  ListTodo,
  CalendarPlus,
  MapPin,
  Inbox,
  ClipboardList,
  UserCheck,
  FolderPlus,
  UserPlus,
  Gavel,
  FileUp,
  CheckSquare,
  CheckCircle2,
  MessageSquare,
  Scale,
  BarChart3,
  UserCog,
  History,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  LogIn,
  LayoutDashboard,
  Search,
  FolderOpen,
  FilePlus,
  FilePlus2,
  FileText,
  Users,
  Upload,
  ListTodo,
  CalendarPlus,
  MapPin,
  Inbox,
  ClipboardList,
  UserCheck,
  FolderPlus,
  UserPlus,
  Gavel,
  FileUp,
  CheckSquare,
  CheckCircle2,
  MessageSquare,
  Scale,
  BarChart3,
  UserCog,
  History,
};

export function HelpTopicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? HelpCircle;
  return <Icon className={className} />;
}
