import MainLayout from '@/components/layouts/MainLayout';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import GameDetail from './pages/GameDetail';
import CheckPrize from './pages/CheckPrize';
import Prediction from './pages/Prediction';
import History from './pages/History';
import Login from './pages/Login';
import Play from './pages/Play';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Download from './pages/Download';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

function withLayout(element: ReactNode) {
  return <MainLayout>{element}</MainLayout>;
}

export const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: withLayout(<Home />),
    public: true,
  },
  {
    name: '彩种分类',
    path: '/category/:category',
    element: withLayout(<CategoryPage />),
    public: true,
  },
  {
    name: '彩种详情',
    path: '/game/:code',
    element: withLayout(<GameDetail />),
    public: true,
  },
  {
    name: '中奖查询',
    path: '/check',
    element: withLayout(<CheckPrize />),
    public: true,
  },
  {
    name: '预测推荐',
    path: '/prediction',
    element: withLayout(<Prediction />),
    public: true,
  },
  {
    name: '历史记录',
    path: '/history',
    element: withLayout(<History />),
    public: true,
  },
  {
    name: '登录',
    path: '/login',
    element: <Login />,
    public: true,
  },
  {
    name: '模拟投注',
    path: '/play',
    element: withLayout(<Play />),
    public: true,
  },
  {
    name: '联系店主',
    path: '/contact',
    element: withLayout(<Contact />),
    public: true,
  },
  {
    name: '管理后台',
    path: '/admin',
    element: withLayout(<Admin />),
    public: false,
  },
  {
    name: '下载 App',
    path: '/download',
    element: withLayout(<Download />),
    public: true,
  },
];
