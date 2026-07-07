import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { useHomeSettings, type WidgetId } from "@/hooks/useHomeSettings";
import { MagicCard } from "@/components/magicui/magic-card";
import { BorderBeam } from "@/components/magicui/border-beam";

import { TopBar } from "@/components/layout/TopBar";
import { HomeSidebar } from "@/components/layout/HomeSidebar";
import { Footer } from "@/components/layout/Footer";
import { HomeSettingsDialog } from "@/components/ui/HomeSettingsDialog";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { HeroCard } from "@/components/widgets/HeroCard";
import { StatCardWidget } from "@/components/widgets/StatCardWidget";
import { RssFeedWidget } from "@/components/widgets/RssFeedWidget";
import { ServiceStatusWidget } from "@/components/widgets/ServiceStatusWidget";
import { TodoWidget } from "@/components/widgets/TodoWidget";
import { BookmarkWidget } from "@/components/widgets/BookmarkWidget";
import { GitHubWidget } from "@/components/widgets/GitHubWidget";
import { FusionWidget } from "@/components/widgets/FusionWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { PomodoroWidget } from "@/components/widgets/PomodoroWidget";
import { NotificationWidget } from "@/components/widgets/NotificationWidget";
import { SubscriptionWidget } from "@/components/widgets/SubscriptionWidget";
import { FundWidget } from "@/components/widgets/FundWidget";
import { ServiceNav } from "@/components/services/ServiceNav";
import { todoAPI, serviceAPI, rssAPI, bookmarkAPI } from "@/api/admin";
import { Rss, Bookmark } from "lucide-react";

export function HomePage() {
  const [theme, toggleTheme] = useTheme();
  const qc = useQueryClient();
  const { settings, loading, updateSetting, resetSettings } = useHomeSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // 监听侧边栏的设置按钮事件
  useEffect(() => {
    const handler = () => setShowSettings(true);
    window.addEventListener("open-home-settings", handler);
    return () => window.removeEventListener("open-home-settings", handler);
  }, []);



  // 一次拉取所有首页所需数据，子 widget 通过 props 接收，避免重复请求
  const { data: todos = [] } = useQuery({
    queryKey: ["home", "todos"],
    queryFn: todoAPI.list,
    staleTime: 30 * 1000, // 30秒内复用缓存
  });
  const { data: rssArticles = [] } = useQuery({
    queryKey: ["home", "rssArticles"],
    queryFn: () => rssAPI.listArticles({ limit: 20 }),
    staleTime: 30 * 1000,
  });
  const { data: services = [] } = useQuery({
    queryKey: ["home", "services"],
    queryFn: serviceAPI.list,
    staleTime: 60 * 1000, // 服务列表变化较少，1分钟缓存
  });
  const { data: rssSources = [] } = useQuery({
    queryKey: ["home", "rssSources"],
    queryFn: rssAPI.listSources,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["home", "bookmarks"],
    queryFn: bookmarkAPI.list,
    staleTime: 60 * 1000,
  });

  // TodoWidget 点击切换完成（与 /plans、/admin/todos 共享失效）
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const toggleMut = useMutation({
    mutationFn: (id: string) => {
      setTogglingId(id);
      return todoAPI.toggle(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home", "todos"] });
      qc.invalidateQueries({ queryKey: ["plans", "todos"] });
      qc.invalidateQueries({ queryKey: ["admin", "todos"] });
    },
    onSettled: () => setTogglingId(null),
  });

  // Hero 摘要数字：全部从真实数据 derive，零硬编码
  const undoneTodos = (todos || []).filter((t) => !t.done).length;
  const rssArticleCount = (rssArticles || []).length;
  const activeServices = (services || []).filter((s) => s.status === "active").length;

  // Widget 渲染映射
  const widgetMap: Record<WidgetId, { visible: boolean; element: React.ReactElement; gridClass?: string }> = {
    "hero": {
      visible: settings.showHero,
      element: (
        <HeroCard
          enterDelay={0}
          stats={[
            { label: "未完成待办", value: undoneTodos, to: "/plans" },
            { label: "RSS 文章", value: rssArticleCount, to: "/rss" },
            { label: "在线服务", value: activeServices, to: "/services" },
          ]}
        />
      ),
      gridClass: "md:col-span-2 lg:col-span-2 xl:col-span-2",
    },
    "rss-stats": {
      visible: settings.showRssStats,
      element: (
        <StatCardWidget
          title="RSS 订阅"
          icon={Rss}
          value={(rssSources || []).length}
          unit="源"
          enterDelay={80}
          to="/admin/rss"
        />
      ),
    },
    "bookmark-stats": {
      visible: settings.showBookmarkStats,
      element: (
        <StatCardWidget
          title="收藏书签"
          icon={Bookmark}
          value={(bookmarks || []).length}
          unit="条"
          enterDelay={140}
          to="/bookmarks"
        />
      ),
    },
    "rss-feed": {
      visible: settings.showRssFeed,
      element: <RssFeedWidget enterDelay={200} articles={rssArticles} to="/rss" />,
      gridClass: "md:col-span-2 lg:col-span-2 xl:col-span-2",
    },
    "services": {
      visible: settings.showServices,
      element: <ServiceStatusWidget enterDelay={260} services={services} />,
    },
    "todos": {
      visible: settings.showTodos,
      element: (
        <TodoWidget
          enterDelay={320}
          todos={todos}
          onToggle={(id) => toggleMut.mutate(id)}
          togglingId={togglingId}
        />
      ),
    },
    "bookmarks": {
      visible: settings.showBookmarks,
      element: <BookmarkWidget enterDelay={380} bookmarks={bookmarks} />,
    },
    "github": {
      visible: settings.showGitHub,
      element: <GitHubWidget enterDelay={440} />,
    },
    "fusion": {
      visible: settings.showFusion,
      element: <FusionWidget enterDelay={500} />,
    },
    "weather": {
      visible: settings.showWeather,
      element: <WeatherWidget enterDelay={560} />,
    },
    "pomodoro": {
      visible: settings.showPomodoro,
      element: <PomodoroWidget enterDelay={620} />,
    },
    "notification": {
      visible: settings.showNotification,
      element: <NotificationWidget enterDelay={680} />,
    },
    "subscription": {
      visible: settings.showSubscription,
      element: <SubscriptionWidget enterDelay={720} />,
    },
    "fund": {
      visible: settings.showFund,
      element: <FundWidget enterDelay={760} />,
    },
    "service-nav": {
      visible: settings.showServiceNav,
      element: <ServiceNav enterDelay={500} services={services} />,
    },
  };

  // 每张卡片的 BorderBeam 随机配置（用 id 做种子确保稳定）
  const beamConfigs = useMemo(() => {
    const configs: Record<string, { reverse: boolean; duration: number; delay: number }> = {};
    const visibleIds = settings.widgetOrder.filter(
      (id) => id !== "service-nav" && widgetMap[id]?.visible
    );
    visibleIds.forEach((id, i) => {
      const seed = id.charCodeAt(0) + id.length + i;
      configs[id] = {
        reverse: seed % 2 === 0,
        duration: 6 + (seed % 5) * 1.5,
        delay: (seed % 8) * 0.5,
      };
    });
    return configs;
  }, [settings]);

  return (
    <>
      {loading ? (
        <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
          <div className="text-center">
            <div className="mb-4 text-4xl">⏳</div>
            <p style={{ color: "var(--text-muted)" }}>加载配置中...</p>
          </div>
        </div>
      ) : (
        <>
      <div className="flex min-h-screen">
        <HomeSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />
        <div
          className={`flex-1 transition-all duration-300 ml-0 ${
            sidebarCollapsed ? "lg:ml-14" : "lg:ml-48"
          }`}
        >
      <TopBar 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        onSettingsClick={() => setShowSettings(true)}
      />
          <main className="mx-auto w-full max-w-7xl px-6 py-6">
            <div className="columns-1 gap-6 md:columns-2 lg:columns-3 xl:columns-4">
              {settings.widgetOrder
                .filter((id) => id !== "service-nav" && widgetMap[id]?.visible)
                .map((id, i) => {
                  const widget = widgetMap[id];
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.4, ease: "easeOut" }}
                    >
                      <MagicCard
                        className="break-inside-avoid mb-6 rounded-xl"
                        gradientFrom="#38bdf8"
                        gradientTo="#818cf8"
                        gradientSize={250}
                      >
                        <ErrorBoundary name={id}>
                          {widget.element}
                        </ErrorBoundary>
                        <BorderBeam
                          size={60}
                          duration={beamConfigs[id]?.duration ?? 8}
                          delay={beamConfigs[id]?.delay ?? 0}
                          reverse={beamConfigs[id]?.reverse ?? false}
                          colorFrom="#38bdf8"
                          colorTo="#818cf8"
                          borderWidth={1}
                        />
                      </MagicCard>
                    </motion.div>
                  );
                })}
            </div>

            {/* 服务导航门户区（网格外） */}
            {settings.showServiceNav && widgetMap["service-nav"].element}
          </main>
      <Footer />
        </div>
      </div>

      {/* 首页设置对话框 */}
      <HomeSettingsDialog
        isOpen={showSettings}
        settings={settings}
        onUpdate={updateSetting}
        onReset={resetSettings}
        onClose={() => setShowSettings(false)}
      />
        </>
      )}
    </>
  );
}
