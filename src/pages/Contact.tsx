import { Link } from 'react-router-dom';
import { usePageView } from '@/hooks/usePageView';
import { copyToClipboard } from '@/lib/clipboard';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, MessageCircle, ShieldAlert, Award, CheckCircle } from 'lucide-react';
import { WatermarkedImage } from '@/components/common/WatermarkedImage';
import PageMeta from '@/components/common/PageMeta';

const WECHAT_ID = 'clx543';
const STORE_ADDRESS = '无锡市锡山区锡北镇向阳新村63号';

const WECHAT_QR = 'https://miaoda-conversation-file.cdn.bcebos.com/user-dqic9bb9h6gw/app-dqs7nnc9k54x/20260816/md_20260816_112631_7.png';
const WELFARE_CERT = 'https://miaoda-conversation-file.cdn.bcebos.com/user-dqic9bb9h6gw/app-dqs7nnc9k54x/20260816/md_20260816_112631_9.jpg';
const SPORTS_CERT = 'https://miaoda-conversation-file.cdn.bcebos.com/user-dqic9bb9h6gw/app-dqs7nnc9k54x/20260816/md_20260816_112631_8.jpg';

export default function Contact() {
  usePageView();
  function copyWechat() {
    void copyToClipboard(WECHAT_ID, '微信号已复制');
  }

  function openWechat() {
    window.location.href = 'weixin://';
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/">返回首页</Link>
          </Button>
          <h1 className="font-display text-2xl md:text-4xl text-foreground">联系店主</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-1">
                <p className="font-semibold text-destructive">重要提醒</p>
                <p className="text-sm text-muted-foreground">
                  国家禁止互联网销售彩票。本网站仅提供开奖信息查询与号码走势参考，不收取任何费用、不销售彩票。
                  如需购彩，请认准实体代销网点，谨防各类线上诈骗。
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>实体彩票代销店</CardTitle>
              <CardDescription>官方授权，诚信经营，欢迎到店交流</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">门店地址</p>
                    <p className="text-sm text-muted-foreground">{STORE_ADDRESS}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">微信号</p>
                    <p className="text-sm text-muted-foreground">{WECHAT_ID}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default" size="sm" onClick={copyWechat}>
                    复制微信号
                  </Button>
                  <Button variant="outline" size="sm" onClick={openWechat}>
                    打开微信
                  </Button>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="mb-2 text-sm font-medium">长按识别二维码加微信</p>
                  <button
                    onClick={openWechat}
                    className="inline-block overflow-hidden rounded-lg border border-border transition hover:opacity-90"
                    type="button"
                  >
                    <img
                      src={WECHAT_QR}
                      alt="店主微信二维码"
                      className="h-48 w-48 object-contain"
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">代销资质</p>
                    <p className="text-sm text-muted-foreground">持有中国福利彩票、中国体育彩票官方代销证</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-full justify-center">福彩代销证</Badge>
                    <WatermarkedImage
                      src={WELFARE_CERT}
                      alt="中国福利彩票代销证"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-full justify-center">体彩代销证</Badge>
                    <WatermarkedImage
                      src={SPORTS_CERT}
                      alt="中国体育彩票代销证"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>购彩提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">请认准实体代销网点，核对门店代销证是否有效。</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">任何"无实体网店""声称内部号码""包中奖"的均为诈骗，请勿相信。</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">理性购彩，量力而行，未满18周岁不得购买彩票。</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
