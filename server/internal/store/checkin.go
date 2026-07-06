package store

import (
	"database/sql"
	"time"
)

// CheckIn 是一次打卡记录。
type CheckIn struct {
	ID        string `json:"id"`
	TodoID    string `json:"todo_id"`
	CheckDate string `json:"check_date"`
	CreatedAt string `json:"created_at"`
}

// CheckInStore 管理打卡记录。
type CheckInStore struct{ db *sql.DB }

// NewCheckInStore 构造 CheckInStore。
func NewCheckInStore(db *sql.DB) *CheckInStore { return &CheckInStore{db: db} }

// Create 创建一条打卡记录（不检查是否重复，由调用方处理）。
func (s *CheckInStore) Create(todoID string, date string) (*CheckIn, error) {
	now := now()
	c := &CheckIn{
		ID: newID(), TodoID: todoID, CheckDate: date, CreatedAt: now,
	}
	_, err := s.db.Exec(`INSERT INTO check_ins (id, todo_id, check_date, created_at)
		VALUES (?, ?, ?, ?)`, c.ID, c.TodoID, c.CheckDate, now)
	if err != nil {
		return nil, err
	}
	return c, nil
}

// GetByDate 获取某个习惯在某日的打卡记录。未找到返回 nil, nil。
func (s *CheckInStore) GetByDate(todoID string, date string) (*CheckIn, error) {
	var c CheckIn
	err := s.db.QueryRow(`SELECT id, todo_id, check_date, created_at
		FROM check_ins WHERE todo_id=? AND check_date=?`, todoID, date).
		Scan(&c.ID, &c.TodoID, &c.CheckDate, &c.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// CheckToday 是否已打卡。
func (s *CheckInStore) CheckToday(todoID string) (bool, error) {
	today := time.Now().Format("2006-01-02")
	c, err := s.GetByDate(todoID, today)
	if err != nil {
		return false, err
	}
	return c != nil, nil
}

// Delete 删除一条打卡记录。
func (s *CheckInStore) Delete(id string) error {
	_, err := s.db.Exec(`DELETE FROM check_ins WHERE id=?`, id)
	return err
}

// DeleteByDate 删除某习惯某日的打卡记录。
func (s *CheckInStore) DeleteByDate(todoID string, date string) error {
	_, err := s.db.Exec(`DELETE FROM check_ins WHERE todo_id=? AND check_date=?`, todoID, date)
	return err
}

// ListByMonth 获取某习惯某月的所有打卡日期。
func (s *CheckInStore) ListByMonth(todoID string, year int, month time.Month) ([]string, error) {
	prefix := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC).Format("2006-01")
	rows, err := s.db.Query(`SELECT check_date FROM check_ins
		WHERE todo_id=? AND check_date LIKE ?
		ORDER BY check_date ASC`, todoID, prefix+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var dates []string
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err != nil {
			return nil, err
		}
		dates = append(dates, d)
	}
	return dates, rows.Err()
}

// ListAllByMonth 获取所有习惯在某月的打卡记录（按习惯分组）。
func (s *CheckInStore) ListAllByMonth(todoIDs []string, year int, month time.Month) (map[string][]string, error) {
	if len(todoIDs) == 0 {
		return map[string][]string{}, nil
	}
	prefix := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC).Format("2006-01")

	// 构建 IN 子句
	query := `SELECT todo_id, check_date FROM check_ins
		WHERE todo_id IN (?` + repeatStr(`,?`, len(todoIDs)-1) + `) AND check_date LIKE ?
		ORDER BY check_date ASC`
	args := make([]any, 0, len(todoIDs)+1)
	for _, id := range todoIDs {
		args = append(args, id)
	}
	args = append(args, prefix+"%")

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string][]string)
	for rows.Next() {
		var todoID, date string
		if err := rows.Scan(&todoID, &date); err != nil {
			return nil, err
		}
		result[todoID] = append(result[todoID], date)
	}
	return result, rows.Err()
}

// CountByRange 统计某个习惯在日期范围内的打卡总次数。
func (s *CheckInStore) CountByRange(todoID string, start string, end string) (int, error) {
	var count int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM check_ins
		WHERE todo_id=? AND check_date >= ? AND check_date <= ?`,
		todoID, start, end).Scan(&count)
	return count, err
}

// repeatStr repeats a string n times (helper).
func repeatStr(s string, n int) string {
	out := ""
	for i := 0; i < n; i++ {
		out += s
	}
	return out
}

// GetAllDates 获取某习惯所有打卡日期（用于连胜计算）。
func (s *CheckInStore) GetAllDates(todoID string) ([]string, error) {
	rows, err := s.db.Query(`SELECT check_date FROM check_ins
		WHERE todo_id=? ORDER BY check_date DESC`, todoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var dates []string
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err != nil {
			return nil, err
		}
		dates = append(dates, d)
	}
	return dates, rows.Err()
}

// HabitStats 习惯统计。
type HabitStats struct {
	TodoID        string `json:"todo_id"`
	CurrentStreak int    `json:"current_streak"`
	LongestStreak int    `json:"longest_streak"`
	TotalCheckIns int    `json:"total_check_ins"`
	WeekDone      int    `json:"week_done"`
	WeekTarget    int    `json:"week_target"`
	MonthDone     int    `json:"month_done"`
	MonthTarget   int    `json:"month_target"`
	TodayDone     bool   `json:"today_done"`
}

// CalculateStats 计算某个习惯的统计数据。
func (s *CheckInStore) CalculateStats(todoID string, frequency string, target int) (*HabitStats, error) {
	stats := &HabitStats{TodoID: todoID, WeekTarget: target, MonthTarget: target}

	// 获取所有打卡日期（降序）
	dates, err := s.GetAllDates(todoID)
	if err != nil {
		return nil, err
	}
	stats.TotalCheckIns = len(dates)

	// 判断今日是否打卡
	today := time.Now().Format("2006-01-02")
	if len(dates) > 0 && dates[0] == today {
		stats.TodayDone = true
	}

	// 计算当前连胜
	stats.CurrentStreak = CalcCurrentStreak(dates)

	// 计算历史最长连胜
	stats.LongestStreak = CalcLongestStreak(dates)

	// 本周/本月完成数
	now := time.Now()
	weekStart := now.AddDate(0, 0, -int(now.Weekday())).Format("2006-01-02") // 周日开始
	weekEnd := now.Format("2006-01-02")
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).Format("2006-01-02")
	monthEnd := now.Format("2006-01-02")

	weekCount, _ := s.CountByRange(todoID, weekStart, weekEnd)
	monthCount, _ := s.CountByRange(todoID, monthStart, monthEnd)
	stats.WeekDone = weekCount
	stats.MonthDone = monthCount

	return stats, nil
}

// CalcCurrentStreak 从今天向前计算连续打卡天数。dates 降序。
func CalcCurrentStreak(dates []string) int {
	if len(dates) == 0 {
		return 0
	}
	today := time.Now().Format("2006-01-02")
	// 今天没打卡且最近记录不是昨天，则连胜为 0
	if dates[0] != today {
		yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
		if dates[0] != yesterday {
			return 0
		}
		// 最近记录是昨天，从昨天开始算
		return calcConsecutive(dates, yesterday)
	}
	return calcConsecutive(dates, today)
}

// CalcLongestStreak 历史最长连胜。
func CalcLongestStreak(dates []string) int {
	if len(dates) == 0 {
		return 0
	}
	dateSet := make(map[string]bool, len(dates))
	for _, d := range dates {
		dateSet[d] = true
	}

	maxStreak := 0
	for _, start := range dates {
		// 如果前一天的日期也在集合里，跳过（不是段起点）
		prev := addDay(start, -1)
		if dateSet[prev] {
			continue
		}
		streak := 1
		cur := start
		for {
			next := addDay(cur, 1)
			if dateSet[next] {
				streak++
				cur = next
			} else {
				break
			}
		}
		if streak > maxStreak {
			maxStreak = streak
		}
	}
	return maxStreak
}

// calcConsecutive 从 givenDate 向前计算连续天数，dates 降序且包含 givenDate。
func calcConsecutive(dates []string, givenDate string) int {
	streak := 0
	expected := parseDate(givenDate)
	for _, d := range dates {
		dDate := parseDate(d)
		if dDate.Equal(expected) {
			streak++
			expected = expected.AddDate(0, 0, -1)
		} else if dDate.Before(expected) {
			break
		}
		// dDate after expected: skip (date gap, already accounted)
	}
	return streak
}

func parseDate(s string) time.Time {
	t, _ := time.Parse("2006-01-02", s)
	return t
}

func addDay(date string, delta int) string {
	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		return ""
	}
	return t.AddDate(0, 0, delta).Format("2006-01-02")
}
