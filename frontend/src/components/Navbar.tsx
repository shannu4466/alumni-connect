import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Home,
  Briefcase,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  User,
  Menu,
  Loader2,
  UserCheck,
  FileStack,
  PlusCircle,
  LayoutDashboard,
  CalendarPlus,
  UserCog,
  BookmarkCheck,
  History
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './theme-toggle';
import { useAppWideData } from '@/context/JobCountContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { pendingRequestsCount, isLoadingPendingRequests, pendingAlumniCount } = useAppWideData();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === '/skill-assessment-history';

  const getProfileInitials = (fullName) => {
    return fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'UG';
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['student', 'alumni', 'admin'], public: true },
    { name: 'Profile', href: '/profile', icon: User, roles: ['student', 'alumni'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['student', 'alumni', 'admin'] },
    { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['student', 'alumni', 'admin'] },
    { name: 'Referrals', href: '/referrals', icon: Briefcase, roles: ['student', 'alumni', 'admin'], public: true },
    { name: 'Saved Referrals', href: '/saved-referrals', icon: BookmarkCheck, roles: ['student', 'alumni'], public: true },
    { name: 'My Referrals', href: '/my-referrals', icon: FileStack, roles: ['alumni'], requireApproval: true },
    { name: 'Post Referral', href: '/post-referral', icon: PlusCircle, roles: ['alumni'], requireApproval: true },
    { name: 'Connect', href: '/connect', icon: Users, roles: ['student', 'admin'], public: true },
    { name: user?.role === 'student' ? 'Chat with Alumni' : 'Chat with Students', href: '/my-connections', icon: MessageCircle, roles: ['alumni', 'student', 'admin'] },
    { name: 'Admin Panel', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Add Event', href: '/admin/add-event', icon: CalendarPlus, roles: ['admin'] },
    { name: 'Manage Profiles', href: '/admin/view-all-profiles', icon: UserCog, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!user) return item.public;
    if (item.roles && !item.roles.includes(user.role)) return false;
    if (item.requireApproval && !user.isApproved) return false;
    return true;
  });

  const mainNavItems = filteredNavItems.filter(item => item.name !== 'Notifications');
  const notificationNavItem = filteredNavItems.find(item => item.name === 'Notifications');

  const mobileNavItems = [...mainNavItems];
  if (notificationNavItem) {
    mobileNavItems.splice(2, 0, notificationNavItem);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/dashboard" className="flex items-center">
          <img
            src="/public/project_logo.png"
            alt="Alumni Connect Logo"
            className="h-14 w-auto object-contain"
          />
          <span className="text-2xl font-bold text-foreground">Alumni Connect</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {mainNavItems.map((item) => (
            <Link key={item.name} to={item.href}
              className={`text-sm font-medium transition-colors ${location.pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
                }`}>
              <span>{item.name}</span>
            </Link>
          ))}
          {notificationNavItem && (
            <Link key={notificationNavItem.name} to={notificationNavItem.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {user &&
                  (
                    (user.role === 'admin' ? pendingAlumniCount > 0 : pendingRequestsCount > 0)
                  ) &&
                  !isLoadingPendingRequests && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">
                      {user.role === 'admin' ? pendingAlumniCount : pendingRequestsCount}
                    </span>
                  )}
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden md:block">
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}`} alt={user.fullName} />
                    <AvatarFallback>{getProfileInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role !== 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/skill-assessment-history')}>
                    <History className="h-4 w-4" />Skill Assessment History
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="premium">Login</Button>
            </Link>
          )}

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10 p-0">
                <Menu className="h-10 w-10 !h-7 !w-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle>Welcome {user?.fullName || 'Guest'}!</SheetTitle>
              <SheetDescription>Connect and grow with your alumni.</SheetDescription>
              <nav className="flex flex-col gap-4 pt-6">
                {mobileNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsSheetOpen(false)}
                    className={`text-lg font-medium flex items-center transition-colors ${location.pathname === item.href
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                      }`}
                  >
                    {item.icon && <item.icon className="mr-2 h-5 w-5" />}
                    <span>{item.name}</span>
                    {item.name === 'Notifications' && user && pendingRequestsCount > 0 && !isLoadingPendingRequests && (
                      <span className="ml-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                        {user?.role === 'admin' ? pendingAlumniCount : pendingRequestsCount}
                      </span>
                    )}
                  </Link>
                ))}

                {user && user?.role !== 'admin' && (
                  <Link
                    to="/skill-assessment-history"
                    onClick={() => setIsSheetOpen(false)}
                    className={`w-full justify-start text-lg px-4 flex items-center transition-colors duration-200 ml-[-7%] font-bold
                      ${isActive
                        ? 'text-primary font-medium'
                        : 'text-foreground hover:text-primary'
                      } hover:bg-accent/80 rounded-md`
                    }
                  >
                    <History className="mr-3 h-5 w-5" />
                    <span>Assessment History</span>
                  </Link>
                )}

                {user ? (
                  <Button variant="outline" className="w-full justify-start mt-4" onClick={() => { logout(); setIsSheetOpen(false); }}>
                    <LogOut className="mr-2 h-5 w-5" />Log out
                  </Button>
                ) : (
                  <Link to="/login" onClick={() => setIsSheetOpen(false)} className="w-full justify-start mt-4">
                    <Button variant="premium" className="w-full justify-start">
                      <Users className="mr-2 h-5 w-5" />Login
                    </Button>
                  </Link>
                )}
                <div className='m-2 flex flex-col justify-end items-end w-full'>
                  <ThemeToggle />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
