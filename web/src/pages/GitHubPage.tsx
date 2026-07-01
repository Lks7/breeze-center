import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { githubAPI } from "@/api/github";
import { Github, Star, GitFork, Calendar, ExternalLink } from "lucide-react";
import { formatRelativeTime } from "@/utils/time";

/**
 * GitHubPage — GitHub 数据展示页面
 * 
 * 展示用户信息、热门仓库、最近活动等
 */
export function GitHubPage() {
  const [theme, toggleTheme] = useTheme();

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["github", "user"],
    queryFn: githubAPI.getUser,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: 2,
  });

  const { data: popularRepos = [], isLoading: reposLoading, error: reposError } = useQuery({
    queryKey: ["github", "popular"],
    queryFn: () => githubAPI.getPopularRepos(10),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ["github", "events"],
    queryFn: () => githubAPI.getEvents(20),
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    retry: 2,
  });

  const isLoading = userLoading || reposLoading || eventsLoading;
  const hasError = userError || reposError || eventsError;

  return (
    <>
      <TopBar theme={theme} onToggleTheme={toggleTheme} />
      <main className="mx-auto w-full max-w-6xl px-6 py-6">
        {/* 页头 */}
        <div className="glass-card mb-6 p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-primary)" }}
            >
              <Github size={24} style={{ color: "var(--bg-primary)" }} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold gradient-text"
                style={{
                  background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                GitHub 动态
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                开源贡献与项目展示
              </p>
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="glass-card p-12 text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: "var(--accent-primary)" }}
            />
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              加载中...
            </p>
          </div>
        )}

        {/* 错误状态 */}
        {hasError && !isLoading && (
          <div className="glass-card p-12 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, #ef4444 20%, transparent)" }}
            >
              <Github size={32} style={{ color: "#ef4444" }} />
            </div>
            <h2
              className="mb-2 text-lg font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              加载失败
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              无法获取 GitHub 数据，请检查网络连接或稍后重试
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
              style={{
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
              }}
            >
              重新加载
            </button>
          </div>
        )}

        {/* 内容区域 */}
        {!isLoading && !hasError && user && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 左侧：用户信息 */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6">
                <div className="text-center">
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.login}
                    className="mx-auto h-24 w-24 rounded-full ring-2 ring-offset-2"
                    style={{
                      
                      backgroundColor: "var(--bg-secondary)",
                    }}
                  />
                  <h2
                    className="mt-4 text-xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.name || user.login}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    @{user.login}
                  </p>
                  {user.bio && (
                    <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {user.bio}
                    </p>
                  )}
                </div>

                {/* 统计数据 */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {user.public_repos}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      仓库
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {user.followers}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      关注者
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {user.following}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      关注中
                    </div>
                  </div>
                </div>

                {/* GitHub 链接 */}
                <a
                  href={`https://github.com/${user.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: "var(--accent-primary)",
                    color: "var(--bg-primary)",
                  }}
                >
                  <Github size={16} />
                  访问 GitHub 主页
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* 右侧：热门仓库和最近活动 */}
            <div className="space-y-6 lg:col-span-2">
              {/* 热门仓库 */}
              <div className="glass-card p-6">
                <h3
                  className="mb-4 text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Star size={20} className="mr-2 inline" />
                  热门仓库
                </h3>
                <div className="space-y-3">
                  {popularRepos.slice(0, 5).map((repo) => (
                    <a
                      key={repo.id}
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg p-4 transition-all hover:scale-[1.02]"
                      style={{
                        background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4
                            className="font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {repo.name}
                          </h4>
                          {repo.description && (
                            <p
                              className="mt-1 text-sm"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {repo.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ background: "var(--accent-primary)" }}
                                />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star size={12} />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitFork size={12} />
                              {repo.forks_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* 最近活动 */}
              <div className="glass-card p-6">
                <h3
                  className="mb-4 text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Calendar size={20} className="mr-2 inline" />
                  最近活动
                </h3>
                <div className="space-y-3">
                  {events.slice(0, 10).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg p-3"
                      style={{
                        background: "color-mix(in srgb, var(--accent-primary) 5%, transparent)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={event.actor.avatar_url}
                          alt={event.actor.login}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            <span style={{ color: "var(--text-primary)" }}>
                              {event.actor.login}
                            </span>{" "}
                            {getEventDescription(event)}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                            {formatRelativeTime(event.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

// 根据事件类型生成描述文本
function getEventDescription(event: any): string {
  const repoName = event.repo.name.split("/")[1] || event.repo.name;
  
  switch (event.type) {
    case "PushEvent":
      const commitCount = event.payload.commits?.length || event.payload.size || 0;
      return `pushed ${commitCount} commit${commitCount > 1 ? "s" : ""} to ${repoName}`;
    case "CreateEvent":
      return `created ${event.payload.ref_type} in ${repoName}`;
    case "DeleteEvent":
      return `deleted ${event.payload.ref_type} in ${repoName}`;
    case "ForkEvent":
      return `forked ${repoName}`;
    case "WatchEvent":
      return `starred ${repoName}`;
    case "IssuesEvent":
      return `${event.payload.action} an issue in ${repoName}`;
    case "PullRequestEvent":
      return `${event.payload.action} a pull request in ${repoName}`;
    case "PublicEvent":
      return `made ${repoName} public`;
    default:
      return `performed ${event.type.replace("Event", "")} in ${repoName}`;
  }
}
