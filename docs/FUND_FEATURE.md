# 基金盈亏查看功能文档

> 开发时间：2026-07-02
> 状态：✅ v1.1 可用
> 版本：v1.1（重写数据源 + 修复盈亏 bug + 完整 UI）

## 📋 功能概述

基金盈亏查看功能允许用户在后台管理界面中：
- 添加基金持仓信息（代码、购买金额、购买净值等）
- 通过**天天基金公开接口**自动获取最新基金净值（无需任何 API Key）
- 自动计算持有份额、当前市值、盈亏金额、盈亏比例
- 可视化展示单只基金的盈亏与所有持仓的总盈亏统计

### 核心价值
- **真实数据**：接入天天基金免费公开接口，无需 licence 或 API Key
- **自动计算**：份额、市值、盈亏、收益率全自动
- **集中管理**：统一管理多个基金持仓
- **批量+单条更新**：既能一键刷新全部，也能按行单独刷新
- **红涨绿跌**：遵循中国 A 股市场颜色约定

---

## 🎯 v1.1 重大改进（相对 v1.0）

### 1. 数据源替换（关键）
v1.0 使用假设的必应 API `https://api.biyingapi.com/fd/info/{code}/{licence}`，端点未经证实、且需要付费 licence。

**v1.1 改用**：天天基金实时估值接口
```
http://fundgz.1234567.com.cn/js/{code}.js?rt={timestamp}
```

返回 JSONP 格式：
```javascript
jsonpgz({"fundcode":"000001","name":"华夏成长混合","jzrq":"2026-07-01",
         "dwjz":"1.5960","gsz":"1.5487","gszzl":"-2.96",
         "gztime":"2026-07-02 10:02"});
```

字段说明：
- `dwjz`：单位净值（上一交易日真实净值，用于盈亏计算）
- `gsz`：估算值（盘中实时估算）
- `gszzl`：估算涨跌幅（%）
- `jzrq`：净值日期
- `name`：基金全称（UTF-8 编码）

**优势**：免费、无需 Key、公开稳定、被大量第三方工具使用。

### 2. 修复盈亏计算 Bug（关键）
v1.0 在 handler 中把盈亏写回 `BuyAmount` 字段：
```go
holdings[i].BuyAmount = profit // 临时使用BuyAmount字段传递盈亏
```
导致前端无法同时显示购买金额和盈亏。

**v1.1 引入独立的 View DTO** `FundHoldingView`，原始字段保持不变，计算字段单独命名：`current_value` / `profit` / `profit_rate`。

### 3. 前端类型强化
v1.0 的 `fundAPI` 全部使用 `any` 类型。
**v1.1** 在 `types/entities.ts` 新增 `FundHolding` / `FundHoldingInput` / `FundSummary` / `FundNavUpdateResponse` / `FundNavUpdateResult` 五个类型，API 全部强类型化。

### 4. 完整重写管理页面
v1.0 套用通用 `AdminPage`（只能展示一行摘要）。
**v1.1** 手写独立的 `FundAdmin.tsx`：
- 顶部 4 张统计卡片：总投入 / 当前市值 / 总盈亏 / 总收益率
- 中间表格列出每只基金完整数据
- 每行支持单条更新净值、编辑、删除
- 表单弹层显示份额实时预览
- 批量更新结果横幅（成功/失败明细）

---

## 🎯 已完成功能

### 后端实现

#### 1. 数据库设计（未变）
**表结构：`fund_holdings`**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键（UUID） |
| code | TEXT | 基金代码 |
| name | TEXT | 基金名称 |
| buy_amount | REAL | 购买金额 |
| buy_nav | REAL | 购买净值 |
| buy_date | TEXT | 购买日期 |
| current_nav | REAL | 当前净值 |
| shares | REAL | 持有份额 |
| last_updated | TEXT | 最后更新时间 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |
| deleted_at | TEXT | 软删除标记 |

#### 2. Store 层（数据访问）
**文件：`server/internal/store/fund.go`**

方法：
- `ListHoldings()` - 获取所有持仓列表
- `GetHolding(id)` - 获取单个持仓
- `CreateHolding(holding)` - 创建新持仓（自动计算 shares）
- `UpdateCurrentNav(id, nav, timestamp)` - 更新当前净值
- `UpdateHolding(holding)` - **【v1.1 新增】** 修改购买信息（shares 重算）
- `DeleteHolding(id, timestamp)` - 软删除持仓

#### 3. Fetcher 层（API 调用）
**文件：`server/internal/fetcher/fund.go`**

- `FetchFundNav(code)` - 调用天天基金接口获取基金净值
  - 解析 JSONP 响应（正则提取 JSON）
  - 容错处理基金代码不存在（接口返回 `{"FundCode":"null"}`）
  - 基金代码格式校验（必须 6 位数字）
  - 数值字段单独解析，接口可能返回空字符串
- `FundInfo` 结构包含：Code / Name / Nav / NavDate / Gsz / Gszzl / GzTime / IsNotFound

#### 4. Handler 层（REST 接口）
**文件：`server/internal/handler/fund.go`**

| 方法 | 路径 | 说明 | v1.1 状态 |
|------|------|------|------|
| GET | `/api/v1/admin/fund/holdings` | 获取持仓列表（带盈亏） | ✅ 修复 |
| POST | `/api/v1/admin/fund/holdings` | 创建新持仓 | ✅ 加校验 |
| PUT | `/api/v1/admin/fund/holdings/{id}` | 修改购买信息 | ✨ 新增 |
| DELETE | `/api/v1/admin/fund/holdings/{id}` | 删除持仓 | ✅ |
| POST | `/api/v1/admin/fund/update-navs` | 批量更新净值 | ✅ 加详细结果 |
| POST | `/api/v1/admin/fund/holdings/{id}/update-nav` | 单条更新净值 | ✨ 新增 |
| GET | `/api/v1/admin/fund/summary` | 总盈亏统计 | ✨ 新增 |

特性：
- `FundHoldingView` DTO 隔离原始字段与计算字段
- 输入校验：基金代码必须 6 位、金额/净值必须 > 0、日期非空
- 批量更新返回每只基金的详细结果（success/error）
- 单条更新会同步把接口返回的真实基金名称写回数据库
- **不再依赖 settings.fund_api_licence**（数据源免费，无需凭证）

#### 5. 路由注册
**文件：`server/cmd/server/main.go`**

```go
fundH := handler.NewFundHandler(fundStore)  // v1.1: 去掉 settingsStore 参数
r.Get("/fund/holdings", fundH.ListHoldings)
r.Post("/fund/holdings", fundH.CreateHolding)
r.Put("/fund/holdings/{id}", fundH.UpdateHolding)
r.Delete("/fund/holdings/{id}", fundH.DeleteHolding)
r.Post("/fund/update-navs", fundH.UpdateNavs)
r.Post("/fund/holdings/{id}/update-nav", fundH.UpdateOneNav)
r.Get("/fund/summary", fundH.GetSummary)
```

---

### 前端实现

#### 1. 类型定义
**文件：`web/src/types/entities.ts`**

新增类型：
- `FundHolding` - 持仓视图（与后端 FundHoldingView 对应，含计算字段）
- `FundHoldingInput` - 创建/修改输入
- `FundSummary` - 总盈亏统计
- `FundNavUpdateResult` - 单只基金更新结果
- `FundNavUpdateResponse` - 批量更新响应

#### 2. API 封装
**文件：`web/src/api/admin.ts`**

```typescript
export const fundAPI = {
  listHoldings: () => api.get<FundHolding[]>("/admin/fund/holdings"),
  createHolding: (body: FundHoldingInput) => api.post<FundHolding>(...),
  updateHolding: (id, body) => api.put<FundHolding>(...),
  deleteHolding: (id) => api.del<{ status: string }>(...),
  updateNavs: () => api.post<FundNavUpdateResponse>("/admin/fund/update-navs", {}),
  updateOneNav: (id) => api.post<FundHolding>(`/admin/fund/holdings/${id}/update-nav`, {}),
  getSummary: () => api.get<FundSummary>("/admin/fund/summary"),
};
```

#### 3. 管理页面（完全重写）
**文件：`web/src/pages/admin/FundAdmin.tsx`**

页面结构：
1. **顶部操作栏**：批量更新净值按钮 + 新建持仓按钮
2. **总盈亏统计卡片**（4 张）：
   - 总投入 + 持仓数量
   - 当前市值 + 已更新数量
   - 总盈亏（红涨绿跌）+ 盈利/亏损提示
   - 总收益率（红涨绿跌）
3. **批量更新结果横幅**：成功/失败明细
4. **持仓表格**（桌面 8 列，响应式）：
   - 基金（名称 + 代码 + 买入日期 + 最后更新）
   - 购买金额 / 购买净值 / 当前净值 / 份额 / 当前市值
   - 盈亏（金额 + 百分比，红涨绿跌）
   - 操作（刷新 / 编辑 / 删除）
5. **表单弹层**：5 个字段 + 份额实时预览
6. **删除确认对话框**

设计细节：
- 红涨绿跌（中文市场约定）：盈利 `#dc2626`，亏损 `#16a34a`
- 千分位金额格式化（`toLocaleString("zh-CN")`）
- 相对时间显示（"3 分钟前" / "2 天前"）
- 表格行 hover 高亮
- 空状态、加载状态、错误状态完整处理

#### 4. 路由与导航
保持 v1.0 不变：
- 路由：`/admin/fund`
- 侧边栏图标：TrendingUp

---

## 📖 使用指南

### 第一步：启动服务

**一键启动（推荐）：**
```bash
start.bat   # Windows
./start.sh  # Linux/Mac
```

**手动启动：**
```bash
# 后端
cd server && go build -o bin/server.exe ./cmd/server
./bin/server.exe --config ../config --data ../data

# 前端
cd web && pnpm dev
```

**v1.1 改进**：无需配置任何 API licence，开箱即用。

### 第二步：访问管理页面

1. 浏览器打开 http://localhost:4321/admin
2. 左侧导航点击「基金持仓」（TrendingUp 图标）
3. 或直接访问 http://localhost:4321/admin/fund

### 第三步：添加基金持仓

1. 点击右上角「新建持仓」
2. 填写：
   - **基金代码**：6 位数字，如 `000001`
   - **基金名称**：可留空，抓取净值后会自动用接口返回的真实名称回填
   - **购买金额**：元，如 `10000`
   - **购买净值**：如 `1.5000`
   - **购买日期**：YYYY-MM-DD
3. 表单下方会**实时预览份额**：`份额 = 购买金额 / 购买净值`
4. 点击「保存」

### 第四步：更新净值

**单条更新**：点击表格行的 ↻ 图标，单独抓取该基金的最新净值

**批量更新**：点击右上角「批量更新净值」按钮，一次性抓取所有持仓的最新净值
- 完成后显示横幅：「成功 X / 失败 Y」
- 失败明细会列出代码与错误原因（如「基金代码不存在」）

### 第五步：查看盈亏

更新净值后，表格会显示：
- **当前净值**：从天天基金抓取的真实净值
- **份额**：自动计算
- **当前市值**：`份额 × 当前净值`
- **盈亏金额**：`当前市值 - 购买金额`（红涨绿跌）
- **盈亏比例**：`盈亏金额 / 购买金额 × 100%`

顶部统计卡片显示所有持仓的汇总数据。

---

## 🔌 API 文档

### 1. 获取持仓列表
```http
GET /api/v1/admin/fund/holdings
```
响应（每个对象都包含计算字段）：
```json
{
  "success": true,
  "data": [{
    "id": "uuid",
    "code": "000001",
    "name": "华夏成长混合",
    "buy_amount": 10000,
    "buy_nav": 1.5,
    "buy_date": "2024-01-01",
    "current_nav": 1.596,
    "shares": 6666.67,
    "current_value": 10640.0,
    "profit": 640.0,
    "profit_rate": 0.064,
    "nav_date": "",
    "last_updated": "2026-07-02T02:05:21Z",
    "created_at": "...",
    "updated_at": "..."
  }],
  "count": 1
}
```

### 2. 创建持仓
```http
POST /api/v1/admin/fund/holdings
Content-Type: application/json

{"code":"000001","name":"","buy_amount":10000,"buy_nav":1.5,"buy_date":"2024-01-01"}
```

### 3. 修改持仓（v1.1 新增）
```http
PUT /api/v1/admin/fund/holdings/{id}
Content-Type: application/json

{"code":"000001","name":"华夏成长","buy_amount":12000,"buy_nav":1.5,"buy_date":"2024-01-01"}
```
shares 会按新的 buy_amount / buy_nav 重新计算。

### 4. 删除持仓
```http
DELETE /api/v1/admin/fund/holdings/{id}
```
返回 `204 No Content`。

### 5. 批量更新净值
```http
POST /api/v1/admin/fund/update-navs
```
响应：
```json
{
  "success": true,
  "data": {
    "updated": 5,
    "total": 6,
    "results": [
      {"code":"000001","name":"华夏成长混合","nav":1.596,"nav_date":"2026-07-01","success":true},
      {"code":"999999","name":"测试","nav":0,"nav_date":"","success":false,"error":"基金代码不存在"}
    ]
  }
}
```

### 6. 单条更新净值（v1.1 新增）
```http
POST /api/v1/admin/fund/holdings/{id}/update-nav
```
响应：返回更新后的 `FundHoldingView`（包含最新净值与计算字段）。
副作用：如果接口返回的 name 与数据库不一致，会自动用真实名称覆盖。

### 7. 总盈亏统计（v1.1 新增）
```http
GET /api/v1/admin/fund/summary
```
响应：
```json
{
  "success": true,
  "data": {
    "total_buy": 10000,
    "total_value": 10640,
    "total_profit": 640,
    "total_rate": 0.064,
    "holding_count": 1,
    "updated_count": 1
  }
}
```

---

## 🧪 端到端验证（2026-07-02）

实测结果：
- ✅ 后端 Go 编译通过（`go build ./...`）
- ✅ 前端 TypeScript 零错误（`tsc --noEmit`）
- ✅ 创建持仓 `000001` 成功
- ✅ 单条更新净值成功，拿到真实数据：
  - 名称：华夏成长混合（接口返回的真实全称）
  - 当前净值：1.5960
  - 净值日期：2026-07-01
  - 自动计算：份额 6666.67，市值 10640，盈亏 +640，收益率 +6.4%
- ✅ 总盈亏统计接口正常返回
- ✅ UTF-8 字符编码完全正确（数据库存储与 HTTP 响应均为正确 UTF-8）

---

## 📁 文件清单

### 后端
```
server/internal/
├── store/
│   ├── schema.go         # fund_holdings 表定义（未变）
│   └── fund.go           # 【修改】增加 UpdateHolding
├── fetcher/
│   └── fund.go           # 【重写】改用天天基金接口
└── handler/
    └── fund.go           # 【重写】引入 DTO、新增 3 个接口
server/cmd/server/
└── main.go               # 【修改】路由注册、去掉 settingsStore 依赖
```

### 前端
```
web/src/
├── types/
│   └── entities.ts       # 【修改】新增 5 个 Fund 相关类型
├── api/
│   └── admin.ts          # 【修改】fundAPI 强类型化、新增 3 个方法
└── pages/admin/
    └── FundAdmin.tsx     # 【重写】完整盈亏展示页面
```

---

## 🛠️ 技术栈

### 后端
- Go 1.25
- chi/v5 路由
- modernc.org/sqlite（纯 Go SQLite）
- 标准库 net/http + encoding/json + regexp
- google/uuid

### 前端
- React 19 + TypeScript
- TanStack Query
- lucide-react 图标
- Tailwind CSS

---

## 📊 开发状态总结

### ✅ 已完成（v1.1）
- [x] 数据源替换为天天基金免费公开接口
- [x] 修复盈亏计算 Bug（引入 View DTO）
- [x] 前端 TypeScript 类型定义
- [x] 完整重写管理页面（表格 + 统计卡片 + 单条更新）
- [x] 新增 PUT 修改持仓接口
- [x] 新增单条更新净值接口
- [x] 新增总盈亏统计接口
- [x] 输入字段校验
- [x] 红涨绿跌配色（中文市场约定）
- [x] 端到端实测通过

### ⏳ 待完成（v1.2 计划）
- [ ] 定时自动更新净值（参考 RSS 调度器，每天收盘后自动抓取）
- [ ] 收益曲线图表（用 Chart.js 或 recharts 展示历史净值走势）
- [ ] 收益率排序
- [ ] 单元测试（Store / Fetcher / Handler）

---

## 📌 重要说明

### 关于数据源
天天基金 `fundgz.1234567.com.cn` 接口返回的 `dwjz` 是**上一交易日的真实单位净值**，不是当日实时估算。交易日 15:00 后接口会更新为当日真实净值。

`gsz` 是盘中实时估算值（仅交易日 9:30-15:00 有意义），目前未用于盈亏计算，但代码已解析备用。

### 关于基金代码
- 必须 6 位数字
- 不存在的代码会返回 `{"FundCode":"null"}`，前端会显示「基金代码不存在」错误
- 部分基金（货币型、已清盘）可能不在此接口覆盖范围

### 关于名称回填
创建持仓时 name 可留空。首次抓取净值后，handler 会把接口返回的真实基金全称（如「华夏成长混合」）写回数据库。后续在列表中即可看到完整名称。

---

## 🎉 总结

基金盈亏查看功能 **v1.1 已可用**，相对 v1.0：
- 从「假设的付费 API」改为「真实的免费公开接口」
- 从「bug 满满的盈亏计算」改为「DTO 隔离的清晰计算」
- 从「简陋的一行列表」改为「完整的表格 + 统计 + 单条操作」
- 从「any 类型」改为「完整 TypeScript 类型」

开箱即用，无需任何配置。

---

*文档更新时间：2026-07-02*
*功能版本：v1.1*
*状态：✅ 可用*
