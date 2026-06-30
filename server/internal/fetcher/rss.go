package fetcher

import (
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// FetchRSS 抓取 RSS/Atom 订阅源并解析为统一的文章列表
func FetchRSS(url string, timeout time.Duration) ([]Article, error) {
	// 1. HTTP GET with timeout
	client := &http.Client{Timeout: timeout}
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("HTTP GET failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP status %d", resp.StatusCode)
	}

	// 2. Read body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read body failed: %w", err)
	}

	// 3. Try RSS 2.0 first
	articles, err := parseRSS(body)
	if err == nil && len(articles) > 0 {
		return articles, nil
	}

	// 4. Try Atom format
	articles, err = parseAtom(body)
	if err == nil && len(articles) > 0 {
		return articles, nil
	}

	return nil, fmt.Errorf("unsupported feed format or empty feed")
}

// parseRSS 解析 RSS 2.0 格式
func parseRSS(data []byte) ([]Article, error) {
	var rss RSS
	if err := xml.Unmarshal(data, &rss); err != nil {
		return nil, err
	}

	var articles []Article
	for _, item := range rss.Channel.Items {
		// Parse pub date
		pubDate := parseRSSDate(item.PubDate)
		
		// Extract URL (prefer Link, fallback to GUID)
		url := item.Link
		if url == "" {
			url = item.GUID
		}
		
		// Skip if no URL
		if url == "" {
			continue
		}

		articles = append(articles, Article{
			Title:       item.Title,
			URL:         url,
			Excerpt:     truncateHTML(item.Description, 300),
			PublishedAt: pubDate,
		})
	}

	return articles, nil
}

// parseAtom 解析 Atom 格式
func parseAtom(data []byte) ([]Article, error) {
	var feed Feed
	if err := xml.Unmarshal(data, &feed); err != nil {
		return nil, err
	}

	var articles []Article
	for _, entry := range feed.Entries {
		// Parse updated date
		pubDate := parseAtomDate(entry.Updated)
		
		// Extract URL
		url := ""
		for _, link := range entry.Link {
			if link.Rel == "" || link.Rel == "alternate" {
				url = link.Href
				break
			}
		}
		
		// Skip if no URL
		if url == "" {
			continue
		}

		// Prefer Summary, fallback to Content
		excerpt := entry.Summary
		if excerpt == "" {
			excerpt = entry.Content
		}

		articles = append(articles, Article{
			Title:       entry.Title,
			URL:         url,
			Excerpt:     truncateHTML(excerpt, 300),
			PublishedAt: pubDate,
		})
	}

	return articles, nil
}

// parseRSSDate 解析 RSS 日期格式 (RFC822, RFC1123)
func parseRSSDate(dateStr string) time.Time {
	if dateStr == "" {
		return time.Now()
	}
	
	// Try common RSS date formats
	formats := []string{
		time.RFC1123Z,
		time.RFC1123,
		time.RFC822Z,
		time.RFC822,
		"Mon, 02 Jan 2006 15:04:05 -0700",
		"Mon, 02 Jan 2006 15:04:05 MST",
	}
	
	for _, format := range formats {
		if t, err := time.Parse(format, dateStr); err == nil {
			return t
		}
	}
	
	// Fallback to now if parsing fails
	return time.Now()
}

// parseAtomDate 解析 Atom 日期格式 (RFC3339)
func parseAtomDate(dateStr string) time.Time {
	if dateStr == "" {
		return time.Now()
	}
	
	t, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		// Fallback to now
		return time.Now()
	}
	return t
}

// truncateHTML 简单截断 HTML 内容到指定长度
func truncateHTML(html string, maxLen int) string {
	// Remove common HTML tags (simple approach)
	text := html
	text = strings.ReplaceAll(text, "<br>", " ")
	text = strings.ReplaceAll(text, "<br/>", " ")
	text = strings.ReplaceAll(text, "<br />", " ")
	text = strings.ReplaceAll(text, "</p>", " ")
	
	// Simple tag removal (good enough for excerpts)
	// In production, use a proper HTML parser if needed
	for strings.Contains(text, "<") && strings.Contains(text, ">") {
		start := strings.Index(text, "<")
		end := strings.Index(text, ">")
		if start >= 0 && end > start {
			text = text[:start] + text[end+1:]
		} else {
			break
		}
	}
	
	// Trim whitespace
	text = strings.TrimSpace(text)
	
	// Truncate
	if len(text) > maxLen {
		text = text[:maxLen] + "..."
	}
	
	return text
}
