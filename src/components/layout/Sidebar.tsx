'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getReadableModuleKeys } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  MapPin,
  Users,
  Bell,
  Settings,
  FolderOpen,
  CheckSquare,
  ClipboardList,
  Scale,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Mail,
  FileSearch,
  Gavel,
  BarChart3,
  UserCog,
  ListTodo,
  MessageSquare,
  FilePlus,
  UserCheck,
  Database,
  Package,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  moduleKey?: string; // module required to show this menu
}

interface NavGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Menu is now controlled by moduleKey instead of static role arrays
const navigationGroups: NavGroup[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    name: 'Case Workflow',
    icon: Scale,
    defaultOpen: true,
    items: [
      {
        name: 'Register Case',
        href: '/cases/new',
        icon: FilePlus,
        moduleKey: 'cases',
      },
      {
        name: 'Assignment Inbox',
        href: '/cases/assignments',
        icon: UserCheck,
        badge: 'New',
        moduleKey: 'allocation',
      },
      {
        name: 'My Cases',
        href: '/cases?my_cases=true',
        icon: Briefcase,
        moduleKey: 'cases',
      },
      {
        name: 'All Cases',
        href: '/cases',
        icon: FolderOpen,
        moduleKey: 'cases',
      },
      {
        name: 'Directions & Hearings',
        href: '/directions',
        icon: ClipboardList,
        moduleKey: 'directions',
      },
      {
        name: 'Compliance',
        href: '/compliance',
        icon: CheckSquare,
        moduleKey: 'compliance',
      },
      {
        name: 'Notifications',
        href: '/notifications',
        icon: Bell,
        moduleKey: 'notifications',
      },
    ],
  },
  {
    name: 'Case Management',
    icon: Briefcase,
    defaultOpen: false,
    items: [
      { name: 'Calendar', href: '/calendar', icon: Calendar, moduleKey: 'calendar' },
      { name: 'Tasks', href: '/tasks', icon: ListTodo, moduleKey: 'tasks' },
      { name: 'Documents', href: '/documents', icon: FileText, moduleKey: 'documents' },
      { name: 'Land Parcels', href: '/land-parcels', icon: MapPin, moduleKey: 'land_parcels' },
    ],
  },
  {
    name: 'Communications',
    icon: MessageSquare,
    defaultOpen: false,
    items: [
      { name: 'Correspondence', href: '/correspondence', icon: Mail, moduleKey: 'correspondence' },
      { name: 'Communications', href: '/communications', icon: MessageSquare, moduleKey: 'communications' },
      { name: 'File Requests', href: '/file-requests', icon: FileSearch, moduleKey: 'file_requests' },
    ],
  },
  {
    name: 'Legal',
    icon: Gavel,
    defaultOpen: false,
    items: [
      { name: 'Lawyers', href: '/lawyers', icon: Users, moduleKey: 'lawyers' },
      { name: 'Filings', href: '/filings', icon: FileText, moduleKey: 'filings' },
    ],
  },
  {
    name: 'Finance',
    icon: DollarSign,
    defaultOpen: false,
    items: [
      { name: 'Litigation Costs', href: '/litigation-costs', icon: DollarSign, moduleKey: 'litigation_costs' },
    ],
  },
  {
    name: 'Reports',
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3, moduleKey: 'reports' },
    ],
  },
  {
    name: 'Administration',
    icon: Settings,
    defaultOpen: false,
    items: [
      { name: 'Admin Panel', href: '/admin', icon: Settings, moduleKey: 'admin' },
      { name: 'Master Files', href: '/admin/master-files', icon: Database, moduleKey: 'master_files' },
      { name: 'Internal Officers', href: '/admin/internal-officers', icon: UserCheck, moduleKey: 'internal_officers' },
      { name: 'User Management', href: '/admin/users', icon: UserCog, moduleKey: 'users' },
      { name: 'Groups', href: '/admin/groups', icon: Users, moduleKey: 'groups' },
      { name: 'Modules', href: '/admin/modules', icon: Package, moduleKey: 'modules' },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [allowedModules, setAllowedModules] = useState<Set<string>>(new Set());

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach((group) => {
      initial[group.name] = group.defaultOpen ?? false;
    });
    return initial;
  });

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoadingPermissions(true);

        const moduleKeys = await getReadableModuleKeys();

        // Always allow dashboard for authenticated users
        const modules = new Set(moduleKeys);
        modules.add('dashboard');

        setAllowedModules(modules);
      } catch (error) {
        console.error('Error loading permissions:', error);
        // On error, only show dashboard
        setAllowedModules(new Set(['dashboard']));
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadPermissions();
  }, []);

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const isActiveItem = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }

    if (href.includes('?')) {
      const basePath = href.split('?')[0];
      return pathname === basePath;
    }

    return pathname === href || pathname?.startsWith(href + '/');
  };

  const isActiveGroup = (group: NavGroup) => {
    return group.items.some((item) => isActiveItem(item.href));
  };

  const hasModuleAccess = (moduleKey?: string) => {
    if (!moduleKey) return true; // items like dashboard with no moduleKey
    return allowedModules.has(moduleKey);
  };

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasModuleAccess(item.moduleKey)),
    }))
    .filter((group) => group.items.length > 0);

  if (loadingPermissions) {
    return (
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-slate-700 px-4">
          <img
            src="/dlpp-logo.svg"
            alt="DLPP Logo"
            className={cn('transition-all duration-300', collapsed ? 'h-8' : 'h-10')}
          />
          {!collapsed && (
            <div className="ml-3">
              <div className="text-sm font-semibold">DLPP Legal CMS</div>
              <div className="text-xs text-slate-400">Dept. of Lands</div>
            </div>
          )}
        </div>

        <div className="p-4 text-sm text-slate-400">Loading menu...</div>
      </aside>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-slate-700 px-4">
          <img
            src="/dlpp-logo.svg"
            alt="DLPP Logo"
            className={cn('transition-all duration-300', collapsed ? 'h-8' : 'h-10')}
          />
          {!collapsed && (
            <div className="ml-3">
              <div className="text-sm font-semibold">DLPP Legal CMS</div>
              <div className="text-xs text-slate-400">Dept. of Lands</div>
            </div>
          )}
        </div>

        <nav className="h-[calc(100vh-4rem)] overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {visibleGroups.map((group) => {
              const GroupIcon = group.icon;
              const isOpen = openGroups[group.name];
              const isGroupActive = isActiveGroup(group);

              return (
                <div key={group.name} className="mb-2">
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      'hover:bg-slate-800',
                      isGroupActive ? 'bg-slate-800 text-emerald-400' : 'text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <GroupIcon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{group.name}</span>}
                    </div>
                    {!collapsed &&
                      (isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      ))}
                  </button>

                  {!collapsed && isOpen && (
                    <div className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-4">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = isActiveItem(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              'hover:bg-slate-800',
                              isActive
                                ? 'bg-emerald-600 text-white font-medium'
                                : 'text-slate-400 hover:text-white'
                            )}
                          >
                            <ItemIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                            {item.badge && (
                              <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {collapsed && (
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = isActiveItem(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            title={item.name}
                            className={cn(
                              'flex items-center justify-center rounded-lg p-2 transition-colors',
                              'hover:bg-slate-800',
                              isActive
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            )}
                          >
                            <ItemIcon className="h-4 w-4" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
