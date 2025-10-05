import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User, FileText, BarChart2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header = ({ onOpenSettings }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const navItems = [
    // We treat '/' as the main dashboard for invoices
    { name: 'Dashboard', path: '/', icon: FileText }, 
    { name: 'Insights', path: '/insights', icon: BarChart2 },
    { name: 'New Invoice', path: '/invoice-generator', icon: FileText },
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="Logo" className="h-8 w-8" />
          <h1 className="text-xl font-semibold text-professional hidden sm:block">Invoice Manager</h1>
        </div>
        
        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-2 border border-gray-100 rounded-lg p-1 bg-gray-50">
          {navItems.map((item) => {
            // Check if current path matches the nav item path, or if it's the root path and we're on an invoice detail page
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/invoice/'));
            return (
              <Button
                key={item.name}
                asChild
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={isActive ? 'shadow-sm' : 'text-gray-500 hover:text-primary'}
              >
                <Link to={item.path}>
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </nav>
        
        {/* Right: Settings and User Dropdown */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.email || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.email ? getInitials(user.email) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              {/* Mobile/Dropdown Nav */}
              <div className="md:hidden">
                <DropdownMenuItem asChild>
                  <Link to="/">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/insights">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    <span>Insights</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
