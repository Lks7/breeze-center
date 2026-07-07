/**
 * 类型定义 — 与后端 store 实体一一对应
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  tags: string;
  status: "draft" | "published";
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  category: string;
  icon_color: string;
  enabled: boolean;
  last_fetched: string;
  created_at: string;
  updated_at: string;
}

export interface RSSArticle {
  id: string;
  source_id: string;
  title: string;
  url: string;
  excerpt: string;
  published_at: string;
  fetched_at: string;
  read: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  due_date: string;
  sort_order: number;
  position_x: number;
  position_y: number;
  is_habit: boolean;
  habit_frequency: string;
  habit_target: number;
  created_at: string;
  updated_at: string;
  completed_at: string;
}

export interface Habit extends Todo {
  today_checked: boolean;
  streak: number;
}

export interface CheckIn {
  id: string;
  todo_id: string;
  check_date: string;
  created_at: string;
}

export interface HabitStats {
  todo_id: string;
  current_streak: number;
  longest_streak: number;
  total_check_ins: number;
  week_done: number;
  week_target: number;
  month_done: number;
  month_target: number;
  today_done: boolean;
}

export interface ServiceEntry {
  id: string;
  base_service: string;
  name: string;
  description: string;
  category: string;
  url: string;
  api_endpoint: string;
  icon_name: string;
  icon_color: string;
  status: "active" | "inactive" | "error";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * 基金持仓 — 与后端 FundHoldingView 对应。
 *
 * current_value / profit / profit_rate 是后端计算后下发的字段，
 * 仅当 current_nav 与 shares 同时 > 0 时才有意义。
 */
export interface FundHolding {
  id: string;
  code: string;
  name: string;
  buy_amount: number;       // 购买金额（元）
  buy_nav: number;          // 购买净值
  buy_date: string;         // 购买日期 YYYY-MM-DD
  current_nav: number;      // 当前净值
  shares: number;           // 持有份额
  current_value: number;    // 当前市值 = shares × current_nav
  profit: number;           // 盈亏金额 = current_value - buy_amount
  profit_rate: number;      // 盈亏比例（小数，前端 ×100 显示百分比）
  last_updated: string;     // 最后抓取时间
  target_profit_rate: number; // 止盈率（小数，0.2=20%），0=未设置
  stop_loss_rate: number;     // 止损率（小数，-0.1=-10%），0=未设置
  alert_triggered: boolean;   // 本轮是否已触发预警
  created_at: string;
  updated_at: string;
}

/** 创建/修改基金持仓的输入 */
export interface FundHoldingInput {
  code: string;
  name: string;
  buy_amount: number;
  buy_nav: number;
  buy_date: string;
  target_profit_rate?: number;
  stop_loss_rate?: number;
}

/** 总盈亏统计 — 与后端 FundSummary 对应 */
export interface FundSummary {
  total_buy: number;        // 总投入
  total_value: number;      // 当前总市值
  total_profit: number;     // 总盈亏金额
  total_rate: number;       // 总盈亏比例（小数）
  holding_count: number;    // 持仓数量
  updated_count: number;    // 已抓取净值的数量
}

/** 单只基金更新净值的结果 */
export interface FundNavUpdateResult {
  code: string;
  name: string;
  nav: number;
  nav_date: string;
  profit_rate: number;        // 本次抓取后的实时盈亏率
  gsz: number;                // 盘中估算值
  gszzl: number;              // 估算涨跌幅(%)
  gz_time: string;            // 估算时间
  alert?: string;             // 触发预警时为 "take_profit" / "stop_loss"
  success: boolean;
  error?: string;
}

/** 批量更新净值的响应 */
export interface FundNavUpdateResponse {
  updated: number;
  total: number;
  results: FundNavUpdateResult[];
}

/** 净值历史记录（单条） */
export interface FundNavHistory {
  nav: number;
  recorded_at: string;
}

/** 全部净值历史汇总记录 */
export interface FundHistoryItem {
  holding_id: string;
  code: string;
  nav: number;
  recorded_at: string;
}

/** 每日盈亏记录 */
export interface DailyProfitRecord {
  date: string;
  total_value: number;
  daily_pl: number;
}
