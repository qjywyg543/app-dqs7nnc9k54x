import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Clock, Home, Search, Sparkles, History, Trophy, Store, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/lottery-utils';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/check', label: '中奖查询', icon: Search },
  { path: '/prediction', label: '预测推荐', icon: Sparkles },
  { path: '/history', label: '历史记录', icon: History },
  { path: '/contact', label: '联系店主', icon: Store },
  { path: '/download', label: '下载 App', icon: Download },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="ml-2 font-display text-xl">彩票开奖</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/70">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="truncate">{formatDateTime(now)}</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetHeader className="border-b border-sidebar-border p-4">
                <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-display text-lg">彩票开奖</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center gap-2 min-w-0 truncate">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground truncate">{formatDateTime(now)}</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
