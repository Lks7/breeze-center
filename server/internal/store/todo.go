package store

import (
	"database/sql"
)

// ============================================================
// Todo
// ============================================================

// Todo 是一条待办事项（可升级为习惯目标）。
type Todo struct {
	ID             string `json:"id"`
	Text           string `json:"text"`
	Done           bool   `json:"done"`
	Priority       string `json:"priority"` // high | medium | low
	DueDate        string `json:"due_date"`
	SortOrder      int    `json:"sort_order"`
	PositionX      int    `json:"position_x"` // 便利贴 X 坐标
	PositionY      int    `json:"position_y"` // 便利贴 Y 坐标
	IsHabit        bool   `json:"is_habit"`
	HabitFrequency string `json:"habit_frequency"` // daily | weekly | monthly
	HabitTarget    int    `json:"habit_target"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
	CompletedAt    string `json:"completed_at"` // ISO8601 完成时间
}

// TodoStore 管理待办。
type TodoStore struct{ db *sql.DB }

// NewTodoStore 构造一个 TodoStore。
func NewTodoStore(db *sql.DB) *TodoStore { return &TodoStore{db: db} }

// List 返回所有未删除待办，按 done, sort_order, created_at 排序。
func (s *TodoStore) List() ([]Todo, error) {
	rows, err := s.db.Query(`
		SELECT id, text, done, priority, due_date, sort_order, position_x, position_y,
		       is_habit, habit_frequency, habit_target,
		       created_at, updated_at, completed_at
		FROM todos WHERE deleted_at='' ORDER BY done ASC, sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Todo
	for rows.Next() {
		var t Todo
		var done, isHabit int
		if err := rows.Scan(&t.ID, &t.Text, &done, &t.Priority, &t.DueDate, &t.SortOrder, &t.PositionX, &t.PositionY,
			&isHabit, &t.HabitFrequency, &t.HabitTarget,
			&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt); err != nil {
			return nil, err
		}
		t.Done = done == 1
		t.IsHabit = isHabit == 1
		out = append(out, t)
	}
	return out, rows.Err()
}

// ListHabits 返回所有习惯目标（is_habit=1 且未删除）。
func (s *TodoStore) ListHabits() ([]Todo, error) {
	rows, err := s.db.Query(`
		SELECT id, text, done, priority, due_date, sort_order, position_x, position_y,
		       is_habit, habit_frequency, habit_target,
		       created_at, updated_at, completed_at
		FROM todos WHERE deleted_at='' AND is_habit=1
		ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Todo
	for rows.Next() {
		var t Todo
		var done, isHabit int
		if err := rows.Scan(&t.ID, &t.Text, &done, &t.Priority, &t.DueDate, &t.SortOrder, &t.PositionX, &t.PositionY,
			&isHabit, &t.HabitFrequency, &t.HabitTarget,
			&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt); err != nil {
			return nil, err
		}
		t.Done = done == 1
		t.IsHabit = isHabit == 1
		out = append(out, t)
	}
	return out, rows.Err()
}

// TodoInput 是创建/更新的入参。
type TodoInput struct {
	Text           string `json:"text"`
	Done           *bool  `json:"done"`
	Priority       string `json:"priority"`
	DueDate        string `json:"due_date"`
	SortOrder      int    `json:"sort_order"`
	IsHabit        *bool  `json:"is_habit"`
	HabitFrequency string `json:"habit_frequency"`
	HabitTarget    int    `json:"habit_target"`
}

// Create 新建待办。
func (s *TodoStore) Create(in TodoInput) (*Todo, error) {
	if in.Priority == "" {
		in.Priority = "medium"
	}
	now := now()
	done := 0
	if in.Done != nil && *in.Done {
		done = 1
	}
	isHabit := 0
	if in.IsHabit != nil && *in.IsHabit {
		isHabit = 1
	}
	freq := in.HabitFrequency
	target := in.HabitTarget
	t := &Todo{
		ID: newID(), Text: in.Text, Done: done == 1, Priority: in.Priority,
		DueDate: in.DueDate, SortOrder: in.SortOrder,
		PositionX: 0, PositionY: 0, // 新创建的待办默认位置
		IsHabit: isHabit == 1, HabitFrequency: freq, HabitTarget: target,
		CreatedAt: now, UpdatedAt: now,
	}
	_, err := s.db.Exec(`INSERT INTO todos
		(id, text, done, priority, due_date, sort_order, position_x, position_y,
		 is_habit, habit_frequency, habit_target,
		 created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		t.ID, t.Text, done, t.Priority, t.DueDate, t.SortOrder, 0, 0,
		isHabit, freq, target,
		now, now)
	if err != nil {
		return nil, err
	}
	return t, nil
}

// Update 更新待办。
func (s *TodoStore) Update(id string, in TodoInput) (*Todo, error) {
	if in.Priority == "" {
		in.Priority = "medium"
	}
	done := 0
	if in.Done != nil && *in.Done {
		done = 1
	}
	isHabit := 0
	if in.IsHabit != nil && *in.IsHabit {
		isHabit = 1
	}
	_, err := s.db.Exec(`UPDATE todos SET
		text=?, done=?, priority=?, due_date=?, sort_order=?,
		is_habit=?, habit_frequency=?, habit_target=?,
		updated_at=?
		WHERE id=? AND deleted_at=''`,
		in.Text, done, in.Priority, in.DueDate, in.SortOrder,
		isHabit, in.HabitFrequency, in.HabitTarget,
		now(), id)
	if err != nil {
		return nil, err
	}
	return s.get(id)
}

func (s *TodoStore) get(id string) (*Todo, error) {
	var t Todo
	var done, isHabit int
	err := s.db.QueryRow(`SELECT id, text, done, priority, due_date, sort_order,
		is_habit, habit_frequency, habit_target,
		created_at, updated_at
		FROM todos WHERE id=? AND deleted_at=''`, id).
		Scan(&t.ID, &t.Text, &done, &t.Priority, &t.DueDate, &t.SortOrder,
			&isHabit, &t.HabitFrequency, &t.HabitTarget,
			&t.CreatedAt, &t.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	t.Done = done == 1
	t.IsHabit = isHabit == 1
	return &t, nil
}

// GetByID 根据 ID 获取一条待办。
func (s *TodoStore) GetByID(id string) (*Todo, error) {
	return s.get(id)
}

// ToggleDone 快速切换完成状态。
func (s *TodoStore) ToggleDone(id string) (*Todo, error) {
	// done: 0→1 设置 completed_at，1→0 清空 completed_at
	_, err := s.db.Exec(`
		UPDATE todos SET 
		  done = 1 - done,
		  completed_at = CASE WHEN done = 0 THEN ? ELSE '' END,
		  updated_at = ?
		WHERE id = ? AND deleted_at = ''`, now(), now(), id)
	if err != nil {
		return nil, err
	}
	return s.get(id)
}

// Delete 软删除待办。
func (s *TodoStore) Delete(id string) error {
	_, err := s.db.Exec(`UPDATE todos SET deleted_at=?, updated_at=? WHERE id=?`, now(), now(), id)
	return err
}

// ListCompletedDatesByMonth 返回指定月份完成的待办日期列表（去重）
func (s *TodoStore) ListCompletedDatesByMonth(month string) ([]string, error) {
	rows, err := s.db.Query(`
		SELECT DISTINCT substr(completed_at, 1, 10) as date
		FROM todos
		WHERE deleted_at = ''
		  AND completed_at != ''
		  AND substr(completed_at, 1, 7) = ?
		ORDER BY date`, month)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var dates []string
	for rows.Next() {
		var date string
		if err := rows.Scan(&date); err != nil {
			return nil, err
		}
		dates = append(dates, date)
	}
	return dates, rows.Err()
}

// UpdatePosition 更新待办的位置坐标（用于便利贴拖拽）
func (s *TodoStore) UpdatePosition(id string, x, y int) error {
	_, err := s.db.Exec(`
		UPDATE todos 
		SET position_x=?, position_y=?, updated_at=?
		WHERE id=? AND deleted_at=''`,
		x, y, now(), id)
	return err
}
