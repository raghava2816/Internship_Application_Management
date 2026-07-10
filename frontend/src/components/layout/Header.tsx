import React, { useState } from 'react';
import { Menu, Bell, Sun, Moon, Laptop, WifiOff, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppData } from '../../context/AppDataContext';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { isOfflineMode, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notifications } = useAppData();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-md px-6 dark:border-white/5">
      {/* Left side: Hamburger (Mobile) & Brand */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="font-semibold text-lg tracking-tight hidden lg:block">
          Welcome back, <span className="text-primary font-bold">{user?.name}</span> 👋
        </span>
      </div>

      {/* Right side: Offline Mode, Notifications, Theme, User Avatar */}
      <div className="flex items-center space-x-3">
        {/* Offline Badge */}
        {isOfflineMode && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold">
            <WifiOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Offline Demo Mode</span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card-light dark:bg-card-dark p-4 shadow-xl dark:border-white/5">
              <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                <span className="font-semibold text-sm">Notifications</span>
                <button onClick={() => setShowNotifications(false)}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-4">No active reminders.</p>
                ) : (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border dark:border-white/5">
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">{notif}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Settings */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'light' ? (
              <Sun className="h-5 w-5 text-slate-500" />
            ) : theme === 'dark' ? (
              <Moon className="h-5 w-5 text-slate-400" />
            ) : (
              <Laptop className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-card-light dark:bg-card-dark p-1.5 shadow-xl dark:border-white/5">
              <button
                onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                className="flex w-full items-center space-x-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted"
              >
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </button>
              <button
                onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                className="flex w-full items-center space-x-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted"
              >
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                className="flex w-full items-center space-x-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted"
              >
                <Laptop className="h-4 w-4" />
                <span>System</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
