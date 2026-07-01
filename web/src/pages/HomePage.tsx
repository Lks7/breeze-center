import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { useHomeSettings, type WidgetId } from "@/hooks/useHomeSettings";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { HomeSettingsDialog } from "@/components/ui/HomeSettingsDialog";
import { DraggableWidget } from "@/components/widgets/DraggableWidget";
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
import { ServiceNav } from "@/components/services/ServiceNav";
import { todoAPI, serviceAPI, rssAPI, bookmarkAPI } from "@/api/admin";
import { Rss, Bookmark } from "lucide-react";

export function HomePage() {
  const [theme, toggleTheme] = useTheme();
  const qc = useQueryClient();
  const { settings, loading, updateSetting, updateWidgetOrder, resetSettings } = useHomeSettings();
  const [showSettings, setShowSettings] = useState(false);

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = settings.widgetOrder.indexOf(active.id as WidgetId);
      const newIndex = settings.widgetOrder.indexOf(over.id as WidgetId);
      const newOrder = [...settings.widgetOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as WidgetId);
      updateWidgetOrder(newOrder);
    }
  };

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
  const undoneTodos = todos.filter((t) => !t.done).length;
  const rssArticleCount = rssArticles.length;
  const activeServices = services.filter((s) => s.status === "active").length;

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
          value={rssSources.length}
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
          value={bookmarks.length}
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
    "service-nav": {
      visible: settings.showServiceNav,
      element: <ServiceNav enterDelay={500} services={services} />,
    },
  };

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
      <TopBar 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        onSettingsClick={() => setShowSettings(true)}
      />
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={settings.widgetOrder} strategy={rectSortingStrategy}>
          <main className="mx-auto w-full max-w-7xl px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {settings.widgetOrder
                .filter((id) => id !== "service-nav" && widgetMap[id]?.visible)
                .map((id) => {
                  const widget = widgetMap[id];
                  return (
                    <DraggableWidget key={id} id={id}>
                      {widget.gridClass ? (
                        <div className={widget.gridClass}>{widget.element}</div>
                      ) : (
                        widget.element
                      )}
                    </DraggableWidget>
                  );
                })}
            </div>

            {/* 服务导航门户区（网格外） */}
            {settings.showServiceNav && widgetMap["service-nav"].element}
          </main>
        </SortableContext>
      </DndContext>
      <Footer />

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
