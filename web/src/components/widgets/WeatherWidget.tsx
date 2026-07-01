import { useQuery } from "@tanstack/react-query";
import { weatherAPI, type WeatherData } from "@/api/weather";
import { Droplets, Wind, RefreshCw, MapPin } from "lucide-react";

interface Props {
  enterDelay?: number;
}

export function WeatherWidget({ enterDelay = 0 }: Props) {
  const city = "北京";

  const { data: weather, isLoading, error, refetch, isFetching } = useQuery<WeatherData>({
    queryKey: ["weather", city],
    queryFn: () => weatherAPI.getCurrent(city),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: `${enterDelay}ms` }}>
      {/* 标题栏 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <i
            className={`qi-${weather?.today.iconDay ?? "999"} text-xl`}
            style={{ color: "var(--accent-primary)" }}
          />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>天气</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <MapPin size={12} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{weather?.city ?? city}</span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-lg p-1 transition-all hover:scale-110"
            style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
            title="刷新"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 加载/错误 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--accent-primary)" }} />
        </div>
      )}
      {error && !isLoading && (
        <div className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          天气加载失败，请检查 API Key
        </div>
      )}

      {/* 天气内容 */}
      {weather && !isLoading && (
        <>
          {/* 今日温度 */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {weather.today.tempMin}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>°</span>
                <span className="mx-1 text-xs" style={{ color: "var(--text-muted)" }}>~</span>
                <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {weather.today.tempMax}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>°</span>
              </div>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                {weather.today.textDay}
              </p>
            </div>
            <i className={`qi-${weather.today.iconDay} text-4xl`} style={{ color: "var(--text-primary)" }} />
          </div>

          {/* 详细信息 */}
          <div className="mb-3 grid grid-cols-3 gap-1.5 text-xs">
            <div className="rounded-lg p-1.5 text-center" style={{ background: "var(--bg-secondary)" }}>
              <Droplets size={11} className="mx-auto mb-0.5" style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-primary)" }}>{weather.today.humidity}%</span>
            </div>
            <div className="rounded-lg p-1.5 text-center" style={{ background: "var(--bg-secondary)" }}>
              <Wind size={11} className="mx-auto mb-0.5" style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-primary)" }}>{weather.today.windDirDay}</span>
            </div>
            <div className="rounded-lg p-1.5 text-center" style={{ background: "var(--bg-secondary)" }}>
              <Wind size={11} className="mx-auto mb-0.5" style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-primary)" }}>{weather.today.windScaleDay}级</span>
            </div>
          </div>

          {/* 未来预报 */}
          {weather.forecast.length > 0 && (
            <div className="flex gap-1.5">
              {weather.forecast.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 rounded-lg p-2 text-center"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                    {day.date.slice(5)}
                  </p>
                  <i className={`qi-${day.iconDay} text-lg block`} style={{ color: "var(--text-primary)" }} />
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>
                    {day.tempMin}~{day.tempMax}°
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
