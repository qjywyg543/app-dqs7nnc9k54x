import { useState } from 'react';
import { usePageView } from '@/hooks/usePageView';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PageMeta from '@/components/common/PageMeta';

export default function Login() {
  usePageView();
  const navigate = useNavigate();
  const { signInWithUsername, signUpWithUsername } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      toast.error('请输入用户名和密码');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('用户名只能包含字母、数字和下划线');
      return;
    }
    if (password.length < 6) {
      toast.error('密码长度至少6位');
      return;
    }
    if (!agreed) {
      toast.error('请勾选用户协议与隐私政策');
      return;
    }

    setLoading(true);
    try {
      const { error } =
        mode === 'login'
          ? await signInWithUsername(username, password)
          : await signUpWithUsername(username, password);

      if (error) {
        toast.error(error.message || (mode === 'login' ? '登录失败' : '注册失败'));
      } else {
        toast.success(mode === 'login' ? '登录成功' : '注册成功');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta title="登录 - 中国彩票开奖大厅" description="登录或注册账号，体验模拟试玩练手功能" />
      <div className="min-h-screen px-4 py-6 md:py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <Link to="/" className="font-display text-2xl gold-text">
              中国彩票开奖大厅
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{mode === 'login' ? '登录' : '注册'}</CardTitle>
                <CardDescription>
                  {mode === 'login' ? '登录后体验模拟试玩练手' : '注册账号开始模拟试玩练手'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码（至少6位）"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="agree"
                    checked={agreed}
                    onCheckedChange={(v) => setAgreed(v === true)}
                  />
                  <Label htmlFor="agree" className="text-xs font-normal leading-tight text-muted-foreground">
                    我已阅读并同意
                    <span className="text-primary">《用户协议》</span>
                    和
                    <span className="text-primary">《隐私政策》</span>
                  </Label>
                </div>

                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                  {loading ? '请稍候...' : mode === 'login' ? '登录' : '注册'}
                </Button>

                <div className="text-center text-sm">
                  {mode === 'login' ? (
                    <>
                      还没有账号？
                      <button
                        type="button"
                        className="ml-1 text-primary hover:underline"
                        onClick={() => setMode('register')}
                      >
                        立即注册
                      </button>
                    </>
                  ) : (
                    <>
                      已有账号？
                      <button
                        type="button"
                        className="ml-1 text-primary hover:underline"
                        onClick={() => setMode('login')}
                      >
                        立即登录
                      </button>
                    </>
                  )}
                </div>

                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <p>提示：本网站仅提供彩票开奖信息查询与模拟试玩，不涉及任何真实购买、充值或支付功能。</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}