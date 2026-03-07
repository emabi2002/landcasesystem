'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Settings,
  LogOut,
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { GlobalSearch } from './GlobalSearch';

interface TopHeaderProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onMobileToggle?: () => void;
}

interface UserProfile {
  full_name: string | null;
  email: string;
  primaryGroup: string | null;
}

// Helper function to get initials from a name
function getInitials(name: string): string {
  if (!name) return 'U';

  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function TopHeader({ sidebarCollapsed, onToggleSidebar, onMobileToggle }: TopHeaderProps) {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's full name from profiles table
      const { data: profileData } = await (supabase as any)
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Get user's primary group
      const { data: userGroups } = await (supabase as any)
        .from('user_groups')
        .select('groups(group_name)')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const primaryGroup = userGroups?.groups?.group_name || null;
      const fullName = profileData?.full_name || null;

      setUserProfile({
        full_name: fullName,
        email: user.email || '',
        primaryGroup: primaryGroup
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        {onMobileToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileToggle}
            className="lg:hidden text-slate-600 hover:text-slate-900"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Desktop Sidebar Toggle */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden lg:flex text-slate-600 hover:text-slate-900"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        )}

        <div className="hidden md:block">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-600 text-white text-xs">
                  {userProfile ? getInitials(userProfile.full_name || userProfile.primaryGroup || userProfile.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium text-slate-700">
                {userProfile ? (userProfile.full_name || userProfile.primaryGroup || 'User') : 'Loading...'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
