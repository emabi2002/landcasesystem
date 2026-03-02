'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  Shield,
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
  History,
  Database,
  Package,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[]; // undefined means all roles can see it
}

interface NavGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
  roles?: string[]; // undefined means all roles can see it
}

// CONSOLIDATED NAVIGATION - Single source of truth
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
    name: 'Case Workflow',  // CONSOLIDATED: Merged "Litigation Workflow" + "Workflow"
    icon: Scale,
    defaultOpen: true,
    items: [
      {
        name: 'Register Case',
        href: '/cases/new',  // CANONICAL route
        icon: FilePlus,
        roles: ['para_legal_officer', 'admin', 'manager_legal_services']
      },
      {
        name: 'Assignment Inbox',
        href: '/cases/assignments',  // CANONICAL route - renamed from /allocation
        icon: UserCheck,
        badge: 'New',
        roles: ['manager_legal_services', 'senior_legal_officer_litigation', 'admin']
      },
      {
        name: 'My Cases',
        href: '/cases?my_cases=true',
        icon: Briefcase,
        roles: ['action_officer_litigation_lawyer', 'admin']
      },
      {
        name: 'All Cases',
        href: '/cases',
        icon: FolderOpen,
      },
      {
        name: 'Directions & Hearings',
        href: '/directions',
        icon: ClipboardList,
      },
      {
        name: 'Compliance',
        href: '/compliance',
        icon: CheckSquare,
      },
      {
        name: 'Notifications',
        href: '/notifications',
        icon: Bell,
      },
    ],
  },
  {
    name: 'Case Management',
    icon: Briefcase,
    defaultOpen: false,
    items: [
      { name: 'Calendar', href: '/calendar', icon: Calendar },
      { name: 'Tasks', href: '/tasks', icon: ListTodo },
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Land Parcels', href: '/land-parcels', icon: MapPin },
    ],
  },
  {
    name: 'Communications',
    icon: MessageSquare,
    defaultOpen: false,
    items: [
      { name: 'Correspondence', href: '/correspondence', icon: Mail },
      { name: 'Communications', href: '/communications', icon: MessageSquare },
      { name: 'File Requests', href: '/file-requests', icon: FileSearch },
    ],
  },
  {
    name: 'Legal',
    icon: Gavel,
    defaultOpen: false,
    items: [
      { name: 'Lawyers', href: '/lawyers', icon: Users },
      { name: 'Filings', href: '/filings', icon: FileText },
    ],
  },
  {
    name: 'Finance',
    icon: DollarSign,
    defaultOpen: false,
    items: [
      { name: 'Litigation Costs', href: '/litigation-costs', icon: DollarSign },
    ],
  },
  {
    name: 'Reports',
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    name: 'Administration',
    icon: Settings,
    defaultOpen: false,
    roles: ['admin'], // Only admins can see this
    items: [
      { name: 'Admin Panel', href: '/admin', icon: Settings, roles: ['admin'] },
      { name: 'Master Files', href: '/admin/master-files', icon: Database, roles: ['admin'] },
      { name: 'Internal Officers', href: '/admin/internal-officers', icon: UserCheck, roles: ['admin'] },
      { name: 'User Management', href: '/admin/users', icon: UserCog, roles: ['admin'] },
      { name: 'Groups', href: '/admin/groups', icon: Users, roles: ['admin'] },
      { name: 'Modules', href: '/admin/modules', icon: Package, roles: ['admin'] },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('user');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach(group => {
      initial[group.name] = group.defaultOpen ?? false;
    });
    return initial;
  });

  // Load user role
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Try to fetch user role from profiles table
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!error && profile) {
            const roleData = profile as { role?: string };
            if (roleData.role) {
              setUserRole(roleData.role);
            } else {
              setUserRole('admin');
            }
          } else {
            // Default to admin if profiles table doesn't exist or no role found
            setUserRole('admin');
          }
        } catch (err) {
          // Default to admin if profiles table doesn't exist
          setUserRole('admin');
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        // Default to admin on error
        setUserRole('admin');
      }
    };

    loadUserRole();
  }, []);

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const isActiveItem = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    // Handle query params
    if (href.includes('?')) {
      const basePath = href.split('?')[0];
      return pathname === basePath;
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const isActiveGroup = (group: NavGroup) => {
    return group.items.some(item => isActiveItem(item.href));
  };

  // Check if user has access to a group or item
  const hasAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true; // No role restriction
    return roles.includes(userRole);
  };

  // Filter navigation groups based on user role
  const visibleGroups = navigationGroups.filter(group => {
    if (!hasAccess(group.roles)) return false;
    // Filter items within the group
    const visibleItems = group.items.filter(item => hasAccess(item.roles));
    return visibleItems.length > 0;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          // Mobile behavior
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
      {/* Logo Section */}
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

      {/* Navigation */}
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {visibleGroups.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = openGroups[group.name];
            const isGroupActive = isActiveGroup(group);
            const visibleItems = group.items.filter(item => hasAccess(item.roles));

            return (
              <div key={group.name} className="mb-2">
                {/* Group Header */}
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
                  {!collapsed && (
                    isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )
                  )}
                </button>

                {/* Group Items */}
                {!collapsed && isOpen && (
                  <div className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-4">
                    {visibleItems.map((item) => {
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

                {/* Collapsed tooltip - show items in dropdown on hover */}
                {collapsed && (
                  <div className="mt-1 space-y-1">
                    {visibleItems.map((item) => {
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
