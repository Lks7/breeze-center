import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Github, Star, GitFork, ExternalLink } from "lucide-react";
import { githubAPI } from "@/api/github";

interface GitHubWidgetProps {
  enterDelay?: number;
}

/**
 * GitHubWidget — GitHub 数据小部件
 * 
 * 展示 GitHub 用户信息和热门仓库
 */
export function GitHubWidget({ enterDelay = 0 }: GitHubWidgetProps) {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["home", "github", "user"],
    queryFn: githubAPI.getUser,
    staleTime: 5 * 60 * 1000,
  });

  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ["home", "github", "popular"],
    queryFn: () => githubAPI.getPopularRepos(3),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = userLoading || reposLoading;

  return (
    <div
      className="glass-card p-6 transition-all duration-700 hover:scale-[1.02]"
      style={{
        animation: `fadeInUp 0.6s ease-out ${enterDelay}ms both`,
      }}
    >
      {/* 标题 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github size={20} style={{ color: "var(--accent-primary)" }} />
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            GitHub
          </h3>
        </div>
        <Link
          to="/github"
          className="text-sm transition-colors hover:underline"
          style={{ color: "var(--accent-primary)" }}
        >
          查看更多 →
        </Link>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="py-8 text-center">
          <div
            className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--accent-primary)" }}
          />
        </div>
      )}

      {/* 用户信息 */}
      {!isLoading && user && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar_url}
              alt={user.name || user.login}
              className="h-12 w-12 rounded-full ring-2 ring-offset-2"
              style={{
                
                backgroundColor: "var(--bg-secondary)",
              }}
            />
            <div className="flex-1">
              <h4
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {user.name || user.login}
              </h4>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                @{user.login}
              </p>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div
              className="rounded-lg p-2"
              style={{
                background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
              }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                {user.public_repos}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                仓库
              </div>
            </div>
            <div
              className="rounded-lg p-2"
              style={{
                background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
              }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                {user.followers}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                关注者
              </div>
            </div>
            <div
              className="rounded-lg p-2"
              style={{
                background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
              }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                {user.following}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                关注中
              </div>
            </div>
          </div>

          {/* 热门仓库 */}
          {repos.length > 0 && (
            <div className="space-y-2">
              <h5
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                <Star size={12} className="mr-1 inline" />
                热门仓库
              </h5>
              {repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg p-2 transition-all hover:scale-[1.02]"
                  style={{
                    background: "color-mix(in srgb, var(--accent-primary) 5%, transparent)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {repo.name}
                    </span>
                    <ExternalLink
                      size={12}
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                  {repo.description && (
                    <p
                      className="mt-1 line-clamp-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {repo.description}
                    </p>
                  )}
                  <div
                    className="mt-1 flex items-center gap-3 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {repo.language && <span>{repo.language}</span>}
                    <span className="flex items-center gap-1">
                      <Star size={10} />
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork size={10} />
                      {repo.forks_count}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* 访问 GitHub 按钮 */}
          <a
            href={`https://github.com/${user.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
            style={{
              background: "var(--accent-primary)",
              color: "var(--bg-primary)",
            }}
          >
            <Github size={14} />
            访问 GitHub
          </a>
        </div>
      )}
    </div>
  );
}
