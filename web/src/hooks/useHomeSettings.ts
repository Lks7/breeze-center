import { useState, useEffect, useCallback } from "react";
import { settingsAPI } from "@/api/settings";

/**
 * Widget ID 类型
 */
export type WidgetId =
  | "hero"
  | "rss-stats"
  | "bookmark-stats"
  | "rss-feed"
  | "services"
  | "todos"
  | "bookmarks"
  | "github"
  | "fusion"
  | "weather"
  | "pomodoro"
  | "notification"
  | "subscription"
  | "fund"
  | "service-nav";

/**
 * 首页 Widget 配置
 */
export interface HomeSettings {
  showHero: boolean;
  showRssStats: boolean;
  showBookmarkStats: boolean;
  showRssFeed: boolean;
  showServices: boolean;
  showTodos: boolean;
  showBookmarks: boolean;
  showGitHub: boolean;
  showFusion: boolean;
  showWeather: boolean;
  showPomodoro: boolean;
  showNotification: boolean;
  showSubscription: boolean;
  showFund: boolean;
  showServiceNav: boolean;
  widgetOrder: WidgetId[];
}

const DEFAULT_ORDER: WidgetId[] = [
  "hero",
  "rss-stats",
  "bookmark-stats",
  "weather",
  "fund",
  "rss-feed",
  "services",
  "todos",
  "pomodoro",
  "bookmarks",
  "notification",
  "subscription",
  "github",
  "fusion",
  "service-nav",
];

const DEFAULT_SETTINGS: HomeSettings = {
  showHero: true,
  showRssStats: true,
  showBookmarkStats: true,
  showRssFeed: true,
  showServices: true,
  showTodos: true,
  showBookmarks: true,
  showGitHub: true,
  showFusion: true,
  showWeather: true,
  showPomodoro: true,
  showNotification: true,
  showSubscription: true,
  showFund: true,
  showServiceNav: true,
  widgetOrder: DEFAULT_ORDER,
};

const SETTINGS_KEY = "home-settings";

export function useHomeSettings() {
  const [settings, setSettings] = useState<HomeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // 从后端加载配置
  useEffect(() => {
    settingsAPI.get(SETTINGS_KEY)
      .then((value) => {
        if (!value) {
          setLoading(false);
          return;
        }
        try {
          const parsed = JSON.parse(value) as Partial<HomeSettings>;
          let mergedOrder = parsed.widgetOrder ?? DEFAULT_ORDER;
          const missing = DEFAULT_ORDER.filter((id) => !mergedOrder.includes(id));
          if (missing.length > 0) {
            mergedOrder = [...mergedOrder, ...missing];
          }
          setSettings({ ...DEFAULT_SETTINGS, ...parsed, widgetOrder: mergedOrder });
        } catch (err) {
          console.warn("Failed to parse home settings:", err);
        }
      })
      .catch((err) => console.warn("Failed to load home settings:", err))
      .finally(() => setLoading(false));
  }, []);

  // 保存到后端（防抖500ms）
  const saveSettings = useCallback((newSettings: HomeSettings) => {
    const value = JSON.stringify(newSettings);
    settingsAPI.set(SETTINGS_KEY, value).catch((err) =>
      console.warn("Failed to save home settings:", err)
    );
  }, []);

  // 更新单个配置项
  const updateSetting = useCallback(<K extends keyof HomeSettings>(
    key: K,
    value: HomeSettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }, [saveSettings]);

  // 更新 Widget 排序
  const updateWidgetOrder = useCallback((newOrder: WidgetId[]) => {
    setSettings((prev) => {
      const next = { ...prev, widgetOrder: newOrder };
      saveSettings(next);
      return next;
    });
  }, [saveSettings]);

  // 重置为默认配置
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  return {
    settings,
    loading,
    updateSetting,
    updateWidgetOrder,
    resetSettings,
  };
}
