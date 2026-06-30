package fetcher

import "time"

// RSS 2.0 格式结构
type RSS struct {
	Channel Channel `xml:"channel"`
}

type Channel struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description"`
	Items       []Item `xml:"item"`
}

type Item struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description"`
	PubDate     string `xml:"pubDate"`
	Author      string `xml:"author"`
	GUID        string `xml:"guid"`
}

// Atom 格式结构
type Feed struct {
	Title   string  `xml:"title"`
	Link    []Link  `xml:"link"`
	Updated string  `xml:"updated"`
	Entries []Entry `xml:"entry"`
}

type Link struct {
	Href string `xml:"href,attr"`
	Rel  string `xml:"rel,attr"`
}

type Entry struct {
	Title   string `xml:"title"`
	Link    []Link `xml:"link"`
	Summary string `xml:"summary"`
	Content string `xml:"content"`
	Updated string `xml:"updated"`
	Author  Author `xml:"author"`
	ID      string `xml:"id"`
}

type Author struct {
	Name string `xml:"name"`
}

// 统一的文章结构
type Article struct {
	Title       string
	URL         string
	Excerpt     string
	PublishedAt time.Time
}
