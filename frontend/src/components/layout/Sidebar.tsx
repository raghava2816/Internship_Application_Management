import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trello, 
  FileText, 
  MessageSquare, 
  GraduationCap, 
  FolderGit2, 
  ShieldCheck, 
  LogOut,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tracker', label: 'Application Tracker', icon: Trello },
    { to: '/resume-analyzer', label: 'Resume Analyzer', icon: FileText },
    { to: '/mock-interview', label: 'Mock Interview', icon: GraduationCap },
    { to: '/coach', label: 'Career Coach', icon: MessageSquare },
    { to: '/portfolio-manager', label: 'Portfolio Manager', icon: FolderGit2 }
  ];

  if (user?.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  const activeStyle = "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold gradient-primary text-white shadow-lg transition-all duration-200";
  const inactiveStyle = "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200";

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed bottom-0 top-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card-light dark:bg-card-dark transition-transform duration-300 lg:translate-x-0 dark:border-white/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border dark:border-white/5">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg gradient-primary text-white shadow-md">
              <Target className="h-5 w-5" />
            </div>
            <span className="font-bold text-base tracking-tight gradient-text">Tracker Pro</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="border-t border-border p-4 dark:border-white/5 flex flex-col space-y-2">
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-primary">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
