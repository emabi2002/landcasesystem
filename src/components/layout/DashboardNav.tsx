'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LayoutDashboard,
  FileText,
  Calendar,
  MapPin,
  Users,
  Bell,
  Settings,
  LogOut,
  FolderOpen,
  CheckSquare,
  Shield,
  Link as LinkIcon,
  Mail,
  ClipboardList,
  Folder,
  Scale,
  Send,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { GlobalSearch } from './GlobalSearch';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Correspondence', href: '/correspondence', icon: Mail },
  { name: 'Directions', href: '/directions', icon: ClipboardList },
  { name: 'Files', href: '/file-requests', icon: Folder },
  { name: 'Filings', href: '/filings', icon: Send },
  { name: 'Lawyers', href: '/lawyers', icon: Scale },
  { name: 'Compliance', href: '/compliance', icon: LinkIcon },
  { name: 'Communications', href: '/communications', icon: MessageSquare },
  { name: 'Admin', href: '/admin', icon: Shield, adminOnly: true },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 shadow-md" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
      <div className="flex h-16 items-center px-4 lg:px-6">
        <div className="flex items-center gap-3 mr-8">
          <img
            src="/dlpp-logo.svg"
            alt="DLPP Logo"
            className="h-10 w-auto"
          />
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-white">DLPP Legal CMS</div>
            <div className="text-xs text-white/80">Department of Lands</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-2 text-white hover:bg-white/10',
                    isActive && 'bg-white/20 text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="flex-1 max-w-md mx-4 hidden lg:block">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full" style={{ background: '#EF5A5A' }}></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-white hover:bg-white/10">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-white text-xs" style={{ background: '#EF5A5A' }}>AD</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm">Admin</span>
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
      </div>
    </nav>
  );
}
