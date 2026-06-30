import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { HeroCard } from "@/components/widgets/HeroCard";
import { StatCardWidget } from "@/components/widgets/StatCardWidget";
import { RssFeedWidget } from "@/components/widgets/RssFeedWidget";
import { ServiceStatusWidget } from "@/components/widgets/ServiceStatusWidget";
import { TodoWidget } from "@/components/widgets/TodoWidget";
import { BookmarkWidget } from "@/components/widgets/BookmarkWidget";
import { ServiceNav } from "@/components/services/ServiceNav";
import { todoAPI, serviceAPI, rssAPI, bookmarkAPI } from "@/api/admin";
import { Rss, Bookmark } from "lucide-react";

export function HomePage() {
  const [theme, toggleTheme] = useTheme();
  const qc = useQueryClient();

  // 一次拉取所有首页所需数据，子 widget 通过 props 接收，避免重复请求
  const { data: todos = [] } = useQuery({
    queryKey: ["home", "todos"],
    queryFn: todoAPI.list,
  });
  const { data: rssArticles = [] } = useQuery({
    queryKey: ["home", "rssArticles"],
    queryFn: () => rssAPI.listArticles({ limit: 20 }),
  });
  const { data: services = [] } = useQuery({
    queryKey: ["home", "services"],
    queryFn: serviceAPI.list,
  });
  const { data: rssSources = [] } = useQuery({
    queryKey: ["home", "rssSources"],
    queryFn: rssAPI.listSources,
  });
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["home", "bookmarks"],
    queryFn: bookmarkAPI.list,
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

  return (
    <>
      <TopBar theme={theme} onToggleTheme={toggleTheme} />
      <main className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Hero 占 2 列 — Hero 标题整体不可点，stats 各自跳转 */}
          <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
            <HeroCard
              enterDelay={0}
              stats={[
                { label: "未完成待办", value: undoneTodos, to: "/plans" },
                { label: "RSS 文章", value: rssArticleCount, to: "/rss" },
                { label: "在线服务", value: activeServices, to: "/services" },
              ]}
            />
          </div>

          {/* 统计卡片 */}
          <StatCardWidget
            title="RSS 订阅"
            icon={Rss}
            value={rssSources.length}
            unit="源"
            enterDelay={80}
            to="/admin/rss"
          />
          <StatCardWidget
            title="收藏书签"
            icon={Bookmark}
            value={bookmarks.length}
            unit="条"
            enterDelay={140}
            to="/bookmarks"
          />

          {/* 文章动态 占 2 列 */}
          <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
            <RssFeedWidget enterDelay={200} articles={rssArticles} to="/rss" />
          </div>

          {/* 服务状态 */}
          <ServiceStatusWidget enterDelay={260} services={services} />

          {/* 待办 */}
          <TodoWidget
            enterDelay={320}
            todos={todos}
            onToggle={(id) => toggleMut.mutate(id)}
            togglingId={togglingId}
          />

          {/* 书签 */}
          <BookmarkWidget enterDelay={380} bookmarks={bookmarks} />
        </div>

        {/* 服务导航门户区 */}
        <ServiceNav enterDelay={500} services={services} />
      </main>
      <Footer />
    </>
  );
}
