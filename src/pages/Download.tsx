import { usePageView } from '@/hooks/usePageView';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Shield, Download as DownloadIcon, QrCode, AlertTriangle } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';

const GITHUB_USER = 'qjywyg543';
const GITHUB_REPO = 'app-dqs7nnc9k54x';
const LATEST_RELEASE_URL = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`;

export default function Download() {
  usePageView();

  function openDownload(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <PageMeta
        title="下载 App - 中国彩票开奖大厅"
        description="下载中国彩票开奖大厅安卓 App 与管理后台 App，随时随地查看开奖结果、走势分析和模拟投注。"
      />
      <div className="min-h-screen px-4 py-6 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/">返回首页</Link>
            </Button>
            <h1 className="font-display text-2xl md:text-4xl text-foreground">下载 App</h1>
          </div>

          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">安装包尚未生成</p>
                <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                  APK 文件由 GitHub Actions 自动构建并发布到 Releases。首次部署前请推送代码触发 Actions 工作流，并将页面中的 GitHub 用户名/仓库名替换为实际值。
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>用户端 App</CardTitle>
                    <CardDescription>面向购彩用户</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary">实时开奖</Badge>
                    查看福彩、体彩最新开奖结果
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary">走势分析</Badge>
                    热号、冷号、遗漏分析
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary">AI 选号</Badge>
                    智能推荐号码与随机选号
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary">模拟投注</Badge>
                    登录后可模拟投注练手
                  </li>
                </ul>
                <Button className="w-full gap-2" onClick={() => openDownload(`${LATEST_RELEASE_URL}/download/lottery-user-app.apk`)}>
                  <DownloadIcon className="h-4 w-4" />
                  下载安卓安装包
                </Button>
                <p className="text-xs text-muted-foreground">当前 APK 文件尚未构建，下载按钮会提示打包方法。如需正式发布，请按下方说明生成 APK 后放置到 /public/app-release/ 目录。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>管理后台 App</CardTitle>
                    <CardDescription>仅管理员使用</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary">数据概览</Badge>
                    点击、注册、投注数据
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary">用户管理</Badge>
                    查看用户列表与注册趋势
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary">埋点事件</Badge>
                    用户行为记录
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary">系统状态</Badge>
                    服务运行状态监控
                  </li>
                </ul>
                <Button variant="secondary" className="w-full gap-2" onClick={() => openDownload(`${LATEST_RELEASE_URL}/download/lottery-admin-app.apk`)}>
                  <DownloadIcon className="h-4 w-4" />
                  下载管理后台安装包
                </Button>
                <p className="text-xs text-muted-foreground">管理后台需管理员账号登录，普通用户无法访问。APK 文件需先生成。</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                扫码下载
              </CardTitle>
              <CardDescription>手机浏览器访问本页即可下载安装</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                请修改代码中 <code>GITHUB_USER</code> 和 <code>GITHUB_REPO</code> 为你的实际 GitHub 用户名与仓库名，并推送代码触发 GitHub Actions 自动构建。构建完成后，即可在此扫码或直接下载最新 Release 的 APK。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
