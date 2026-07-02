package fetcher

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"time"
)

// ============================================================
// 基金净值抓取器
//
// 数据源：天天基金实时估值接口
//   http://fundgz.1234567.com.cn/js/{code}.js?rt={timestamp}
//
// 返回格式（JSONP）：
//   jsonpgz({"fundcode":"000001","name":"华夏成长","jzrq":"2026-07-01",
//            "dwjz":"1.5960","gsz":"1.5366","gszzl":"-3.72",
//            "gztime":"2026-07-02 09:52"});
//
// 不存在的基金代码会返回：
//   jsonpgz({"FundCode":"null"});
//
// 选型理由：
//   1. 免费、无需 API Key、无需 licence
//   2. 公开稳定，被大量第三方工具使用
//   3. 返回 dwjz 是上一交易日真实单位净值，适合做持仓盈亏计算
//   4. gsz / gszzl 是盘中实时估算值（仅交易日 9:30-15:00 有意义），
//      可作为参考显示，但不作为盈亏计算依据
// ============================================================

// FundInfo 是从天天基金接口解析出的基金信息。
type FundInfo struct {
	Code       string  // 基金代码（fundcode）
	Name       string  // 基金名称（name）
	Nav        float64 // 单位净值（dwjz）—— 上一交易日真实净值
	NavDate    string  // 净值日期（jzrq）—— 形如 2026-07-01
	Gsz        float64 // 估算值（gsz）—— 盘中实时估算
	Gszzl      float64 // 估算涨跌幅（gszzl，百分比，如 -3.72）
	GzTime     string  // 估值时间（gztime）—— 形如 2026-07-02 09:52
	IsNotFound bool    // 基金代码不存在
}

// rawFundInfo 用于 JSON 反序列化（字段名对应接口返回）。
type rawFundInfo struct {
	FundCode string `json:"fundcode"`
	Name     string `json:"name"`
	Jzrq     string `json:"jzrq"`
	Dwjz     string `json:"dwjz"`
	Gsz      string `json:"gsz"`
	Gszzl    string `json:"gszzl"`
	GzTime   string `json:"gztime"`
}

// jsonpPayload 容错：基金代码不存在时接口返回 {"FundCode":"null"}，
// 用大小写不敏感的字段标签兜底。
type jsonpPayload struct {
	FundCode string `json:"fundcode"`
	Code     string `json:"FundCode"`
}

var jsonpRe = regexp.MustCompile(`jsonpgz\((.*)\);?`)

// FetchFundNav 获取指定基金的最新净值信息。
//
// code 必须是 6 位数字基金代码，否则返回错误。
// 任何网络/解析错误都通过 error 返回；基金代码不存在时
// 返回 (*FundInfo, nil) 且 IsNotFound=true，由调用方决定如何处理。
func FetchFundNav(code string) (*FundInfo, error) {
	if !isValidFundCode(code) {
		return nil, fmt.Errorf("invalid fund code: %q (must be 6 digits)", code)
	}

	url := fmt.Sprintf("http://fundgz.1234567.com.cn/js/%s.js?rt=%d", code, time.Now().UnixMilli())

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetch fund %s failed: %w", code, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d for code %s", resp.StatusCode, code)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response failed: %w", err)
	}

	// 提取 JSONP 内的 JSON 字符串
	match := jsonpRe.FindSubmatch(body)
	if match == nil {
		// 部分基金（如已清盘）会直接返回空字符串
		return nil, fmt.Errorf("unexpected response format for code %s: %s", code, string(body))
	}
	jsonStr := match[1]

	// 先解析 fundcode 字段，判断是否为 "null"（代码不存在）
	var probe jsonpPayload
	if err := json.Unmarshal(jsonStr, &probe); err != nil {
		return nil, fmt.Errorf("parse JSON failed: %w", err)
	}
	if probe.FundCode == "" || probe.FundCode == "null" {
		return &FundInfo{Code: code, IsNotFound: true}, nil
	}

	// 解析完整字段
	var raw rawFundInfo
	if err := json.Unmarshal(jsonStr, &raw); err != nil {
		return nil, fmt.Errorf("parse fund fields failed: %w", err)
	}

	info := &FundInfo{
		Code:    raw.FundCode,
		Name:    raw.Name,
		NavDate: raw.Jzrq,
		GzTime:  raw.GzTime,
	}
	// 数值字段单独解析，接口可能返回空字符串
	if raw.Dwjz != "" {
		if v, err := strconv.ParseFloat(raw.Dwjz, 64); err == nil {
			info.Nav = v
		}
	}
	if raw.Gsz != "" {
		if v, err := strconv.ParseFloat(raw.Gsz, 64); err == nil {
			info.Gsz = v
		}
	}
	if raw.Gszzl != "" {
		if v, err := strconv.ParseFloat(raw.Gszzl, 64); err == nil {
			info.Gszzl = v
		}
	}
	return info, nil
}

// isValidFundCode 校验基金代码格式：6 位数字。
func isValidFundCode(code string) bool {
	if len(code) != 6 {
		return false
	}
	for _, c := range code {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}
