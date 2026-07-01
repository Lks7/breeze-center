package store

import (
	"database/sql"
	"time"
)

type PomodoroStore struct {
	db *sql.DB
}

func NewPomodoroStore(db *sql.DB) *PomodoroStore {
	return &PomodoroStore{db: db}
}

func (s *PomodoroStore) TodayCount() (int, error) {
	today := time.Now().Format("2006-01-02")
	var count int
	err := s.db.QueryRow(`SELECT count FROM pomodoro_records WHERE date=?`, today).Scan(&count)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return count, err
}

func (s *PomodoroStore) Increment() (int, error) {
	today := time.Now().Format("2006-01-02")
	id := "pomodoro-" + today
	_, err := s.db.Exec(`
		INSERT INTO pomodoro_records (id, date, count, created_at)
		VALUES (?, ?, 1, ?)
		ON CONFLICT(date) DO UPDATE SET count = count + 1
	`, id, today, now())
	if err != nil {
		return 0, err
	}
	return s.TodayCount()
}
