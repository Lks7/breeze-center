/**
 * 天气 API 客户端 - 和风天气
 * 文档: https://dev.qweather.com/docs/api/weather/weather-daily-forecast/
 */

const QWEATHER_HOST = "https://devapi.qweather.com";
const GEO_HOST = "https://geoapi.qweather.com";

function getKey(): string {
  return import.meta.env.VITE_QWEATHER_KEY || "";
}

export interface DailyForecast {
  date: string;
  tempMax: string;
  tempMin: string;
  textDay: string;
  iconDay: string;
  humidity: string;
  windDirDay: string;
  windScaleDay: string;
}

export interface WeatherData {
  city: string;
  today: DailyForecast;
  forecast: DailyForecast[]; // 未来几天
}

async function getLocationID(city: string): Promise<{ id: string; name: string }> {
  const url = `${GEO_HOST}/v2/city/lookup?location=${encodeURIComponent(city)}&key=${getKey()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("城市查询失败");
  const data = await res.json();
  if (data.code !== "200" || !data.location?.length) {
    throw new Error(`未找到城市: ${city}`);
  }
  return { id: data.location[0].id, name: data.location[0].name };
}

export const weatherAPI = {
  async getCurrent(city: string = "北京"): Promise<WeatherData> {
    const key = getKey();
    if (!key) throw new Error("未配置和风天气 API Key");

    // Step 1: 获取 LocationID
    const loc = await getLocationID(city);

    // Step 2: 获取 3 天预报
    const url = `${QWEATHER_HOST}/v7/weather/3d?location=${loc.id}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("天气数据获取失败");
    const data = await res.json();
    if (data.code !== "200" || !data.daily?.length) {
      throw new Error("天气数据异常");
    }

    const daily: DailyForecast[] = data.daily.map((d: Record<string, string>) => ({
      date: d.fxDate,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      textDay: d.textDay,
      iconDay: d.iconDay,
      humidity: d.humidity,
      windDirDay: d.windDirDay,
      windScaleDay: d.windScaleDay,
    }));

    return {
      city: loc.name,
      today: daily[0],
      forecast: daily.slice(1),
    };
  },
};
