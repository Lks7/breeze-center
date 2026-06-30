package store

import (
	"database/sql"
)

// ============================================================
// Todo
// ============================================================

// Todo 是一条待办事项。
type Todo struct {
	ID        string `json:"id"`
	Text      string `json:"text"`
	Done      bool   `json:"done"`
	Priority  string `json:"priority"` // high | medium | low
	DueDate   string `json:"due_date"`
	SortOrder int    `json:"sort_order"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// TodoStore 管理待办。
type TodoStore struct{ db *sql.DB }

// NewTodoStore 构造一个 TodoStore。
func NewTodoStore(db *sql.DB) *TodoStore { return &TodoStore{db: db} }

// List 返回所有未删除待办，按 done, sort_order, created_at 排序。
func (s *TodoStore) List() ([]Todo, error) {
	rows, err := s.db.Query(`
		SELECT id, text, done, priority, due_date, sort_order, created_at, updated_at
		FROM todos WHERE deleted_at='' ORDER BY done ASC, sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Todo
	for rows.Next() {
		var t Todo
		var done int
		if err := rows.Scan(&t.ID, &t.Text, &done, &t.Priority, &t.DueDate, &t.SortOrder, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		t.Done = done == 1
		out = append(out, t)
	}
	return out, rows.Err()
}

// TodoInput 是创建/更新的入参。
type TodoInput struct {
	Text      string `json:"text"`
	Done      *bool  `json:"done"`
	Priority  string `json:"priority"`
	DueDate   string `json:"due_date"`
	SortOrder int    `json:"sort_order"`
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
	t := &Todo{
		ID: newID(), Text: in.Text, Done: done == 1, Priority: in.Priority,
		DueDate: in.DueDate, SortOrder: in.SortOrder,
		CreatedAt: now, UpdatedAt: now,
	}
	_, err := s.db.Exec(`INSERT INTO todos
		(id, text, done, priority, due_date, sort_order, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		t.ID, t.Text, done, t.Priority, t.DueDate, t.SortOrder, now, now)
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
	_, err := s.db.Exec(`UPDATE todos SET
		text=?, done=?, priority=?, due_date=?, sort_order=?, updated_at=?
		WHERE id=? AND deleted_at=''`,
		in.Text, done, in.Priority, in.DueDate, in.SortOrder, now(), id)
	if err != nil {
		return nil, err
	}
	return s.get(id)
}

func (s *TodoStore) get(id string) (*Todo, error) {
	var t Todo
	var done int
	err := s.db.QueryRow(`SELECT id, text, done, priority, due_date, sort_order, created_at, updated_at
		FROM todos WHERE id=? AND deleted_at=''`, id).
		Scan(&t.ID, &t.Text, &done, &t.Priority, &t.DueDate, &t.SortOrder, &t.CreatedAt, &t.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	t.Done = done == 1
	return &t, nil
}

// ToggleDone 快速切换完成状态。
func (s *TodoStore) ToggleDone(id string) (*Todo, error) {
	_, err := s.db.Exec(`UPDATE todos SET done = 1 - done, updated_at=? WHERE id=? AND deleted_at=''`, now(), id)
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
