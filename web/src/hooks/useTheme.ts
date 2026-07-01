import { useEffect, useState } from "react";
import { settingsAPI } from "@/api/settings";

type Theme = "dark" | "light";

const THEME_KEY = "theme";

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>("dark");

  // 从后端加载主题
  useEffect(() => {
    settingsAPI.get(THEME_KEY).then((value) => {
      if (value === "light" || value === "dark") {
        setTheme(value);
      }
    }).catch(() => {});
  }, []);

  // 应用主题到 DOM + 保存到后端
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    settingsAPI.set(THEME_KEY, theme).catch(() => {});
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return [theme, toggle];
}
