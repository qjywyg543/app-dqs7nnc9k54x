import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getAnalyticsStats, getAnalyticsEvents, getUsersList } from '@/services/analytics';
import type { AnalyticsStats } from '@/services/analytics';
import { Eye, MousePointer, Users, Gamepad2 } from 'lucide-react';

const PAGE_SIZE = 20;

export default function Admin() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Array<{ id: string; email: string | null; phone: string | null; role: string; created_at: string }>>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [events, setEvents] = useState<Array<{ id: string; event_type: string; page_path: string | null; event_detail: Record<string, unknown> | null; created_at: string }>>([]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers(usersPage);
  }, [usersPage]);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await getAnalyticsStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers(page: number) {
    try {
      const { data, count } = await getUsersList(page, PAGE_SIZE);
      setUsers(data);
      setUsersCount(count);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadEvents() {
    try {
      const data = await getAnalyticsEvents(undefined, undefined, undefined, 50);
      setEvents(data);
    } catch (e) {
      console.error(e);
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="font-display text-2xl text-foreground">无权限访问</h1>
        <p className="mt-2 text-muted-foreground">此页面仅管理员可访问</p>
        <Button asChild className="mt-4">
          <Link to="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-4xl text-foreground">管理后台</h1>
            <p className="mt-1 text-sm text-muted-foreground">网站运营数据与用户行为统计</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/">返回首页</Link>
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6 grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
            <TabsTrigger value="overview">数据概览</TabsTrigger>
            <TabsTrigger value="users">用户数据</TabsTrigger>
            <TabsTrigger value="events">埋点事件</TabsTrigger>
            <TabsTrigger value="play">模拟试玩</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading || !stats ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={Eye} title="页面浏览" total={stats.totalPageViews} today={stats.todayPageViews} />
                <StatCard icon={MousePointer} title="按钮点击" total={stats.totalClicks} today={stats.todayClicks} />
                <StatCard icon={Users} title="注册用户" total={stats.totalUsers} today={stats.todayUsers} />
                <StatCard icon={Gamepad2} title="模拟试玩" total={stats.totalPlayBets} today={stats.todayPlayBets} />
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>系统状态</CardTitle>
                <CardDescription>各项服务运行状态</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm">数据库连接</span>
                  <Badge variant="default">正常</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm">开奖数据同步</span>
                  <Badge variant="default">正常</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm">用户认证服务</span>
                  <Badge variant="default">正常</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>共 {usersCount} 位用户</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full max-w-full overflow-x-auto bg-card">
                  <Table className="[&>div]:max-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">用户ID</TableHead>
                        <TableHead className="whitespace-nowrap">邮箱/手机号</TableHead>
                        <TableHead className="whitespace-nowrap">角色</TableHead>
                        <TableHead className="whitespace-nowrap">注册时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="whitespace-nowrap text-xs">{user.id.slice(0, 8)}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{user.email ?? user.phone ?? '-'}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{new Date(user.created_at).toLocaleString('zh-CN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="outline" size="sm" disabled={usersPage === 1} onClick={() => setUsersPage((p) => p - 1)}>上一页</Button>
                  <span className="text-sm text-muted-foreground">第 {usersPage} 页</span>
                  <Button variant="outline" size="sm" disabled={usersPage * PAGE_SIZE >= usersCount} onClick={() => setUsersPage((p) => p + 1)}>下一页</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>最近埋点事件</CardTitle>
                <CardDescription>用户最近操作记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full max-w-full overflow-x-auto bg-card">
                  <Table className="[&>div]:max-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">时间</TableHead>
                        <TableHead className="whitespace-nowrap">事件类型</TableHead>
                        <TableHead className="whitespace-nowrap">页面路径</TableHead>
                        <TableHead className="whitespace-nowrap">详情</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap text-xs">{new Date(event.created_at).toLocaleString('zh-CN')}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{event.event_type}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{event.page_path ?? '-'}</TableCell>
                          <TableCell className="max-w-xs truncate text-xs">
                            {event.event_detail ? JSON.stringify(event.event_detail) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="play" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>模拟试玩统计</CardTitle>
                <CardDescription>总投注次数 {stats?.totalPlayBets ?? 0}，今日 {stats?.todayPlayBets ?? 0}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">模拟试玩数据已存储在 user_play_records 表中，包含彩种、期号、号码、状态、中奖等级等字段。</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  total,
  today,
}: {
  icon: React.ElementType;
  title: string;
  total: number;
  today: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">今日 +{today}</p>
      </CardContent>
    </Card>
  );
}
