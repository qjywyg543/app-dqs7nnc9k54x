import { Link } from 'react-router-dom';
import { usePageView } from '@/hooks/usePageView';
import { motion } from 'motion/react';
import { ChevronRight, Gamepad2, LogIn, LogOut, User, Store, MessageCircle, MapPin, ShieldAlert, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { WeChatIcon } from '@/components/icons/WeChatIcon';
import PageMeta from '@/components/common/PageMeta';
import { toast } from 'sonner';

const WECHAT_ID = 'clx543';
const STORE_ADDRESS = '无锡市锡山区锡北镇向阳新村63号';
const QR_CODE_URL = 'https://miaoda-conversation-file.cdn.bcebos.com/user-dqic9bb9h6gw/app-dqs7nnc9k54x/20260816/md_20260816_112631_7.png';

export default function Home() {
  usePageView();
  const { user, profile, signOut } = useAuth();

  function copyWechat() {
    void navigator.clipboard.writeText(WECHAT_ID);
    toast.success('微信号已复制');
  }

  function openWechat() {
    window.location.href = 'weixin://';
  }

  return (
    <>
      <PageMeta
        title="中国彩票开奖大厅 - 福彩体彩实时开奖"
        description="提供双色球、大乐透、福彩3D、排列3、排列5、七乐彩、快乐8、七星彩、7位数等彩种的最新开奖结果、中奖查询、走势分析和预测推荐。"
      />
      <div className="flex flex-col px-4 py-4 md:py-6">
        <div className="mx-auto max-w-7xl w-full">
          <div className="mb-5 rounded-2xl border border-border bg-gradient-to-br from-card to-muted p-4 text-center shadow-card md:p-8">
            <h1 className="font-display text-2xl md:text-4xl gold-text text-balance">中国彩票开奖大厅</h1>
            <p className="mt-2 text-xs text-muted-foreground md:text-sm">实时开奖 · 走势分析 · 中奖查询 · 预测推荐</p>

            <div className="mt-4 flex flex-col items-stretch justify-center gap-2 md:flex-row md:items-center">
              <Link
                to="/play"
                className="group flex items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-card transition-all hover:shadow-hover md:justify-start"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Gamepad2 className="h-3 w-3" />
                </span>
                模拟试玩
                <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>

              <div className="flex flex-row items-center gap-2">
                <Button asChild size="sm">
                  <Link to="/check">中奖查询</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/prediction">预测推荐</Link>
                </Button>
                <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/category/welfare">福彩历史开奖</Link>
                </Button>
                <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/category/sports">体彩历史开奖</Link>
                </Button>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="group flex items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-card transition-all hover:shadow-hover md:justify-start"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <User className="h-3 w-3" />
                  </span>
                  <span className="truncate max-w-[100px]">{profile?.email?.split('@')[0] ?? '用户'}</span>
                  <LogOut className="h-3 w-3 text-muted-foreground" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="group flex items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-card transition-all hover:shadow-hover md:justify-start"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <LogIn className="h-3 w-3" />
                  </span>
                  登录 / 注册
                  <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>


          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-5 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="h-4 w-4 text-primary" />
                  实体彩票代销店
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{STORE_ADDRESS}</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-2 text-sm">
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>微信：{WECHAT_ID}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-8 gap-1 bg-accent text-xs text-accent-foreground hover:bg-accent/90" onClick={copyWechat}>
                        <Copy className="mr-1 h-3 w-3" />
                        复制
                      </Button>
                      <Button size="sm" className="h-8 gap-1 bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={openWechat}>
                        <WeChatIcon className="h-3.5 w-3.5" />
                        打开微信
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">本店持有中国福利彩票、中国体育彩票官方代销证，诚信经营，欢迎到店交流。</p>
                  <Button asChild size="sm" className="h-7 text-xs">
                    <Link to="/contact">查看资质与二维码</Link>
                  </Button>
                </div>
                <Link to="/contact" className="flex items-center justify-center rounded-lg border border-border bg-muted p-2 transition hover:opacity-90">
                  <img
                    src={QR_CODE_URL}
                    alt="店主微信二维码"
                    className="h-20 w-20 object-contain"
                  />
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="mb-5 border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">谨防线上购彩诈骗</p>
                  <p className="text-sm text-muted-foreground">国家禁止互联网销售彩票，请认准实体代销网点，确认实体店主身份，核实出票信息。</p>
                </div>
              </div>
              <Button asChild variant="destructive" size="sm" className="shrink-0">
                <Link to="/contact">查看实体店主认证</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>数据来源于中国福彩网、中国体彩网及地方体彩网，仅供参考</p>
            <p className="mt-1">理性购彩，量力而行</p>
          </div>
        </div>
      </div>
    </>
  );
}

