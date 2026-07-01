package store

import (
	"database/sql"
	"fmt"
	"time"
)

type Notification struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	Read      bool   `json:"read"`
	CreatedAt string `json:"created_at"`
}

type NotificationStore struct {
	db *sql.DB
}

func NewNotificationStore(db *sql.DB) *NotificationStore {
	return &NotificationStore{db: db}
}

func (s *NotificationStore) List(limit int) ([]Notification, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := s.db.Query(
		`SELECT id, type, title, message, read, created_at
		 FROM notifications
		 ORDER BY created_at DESC
		 LIMIT ?`, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Notification
	for rows.Next() {
		var n Notification
		var read int
		if err := rows.Scan(&n.ID, &n.Type, &n.Title, &n.Message, &read, &n.CreatedAt); err != nil {
			return nil, err
		}
		n.Read = read == 1
		list = append(list, n)
	}
	return list, rows.Err()
}

func (s *NotificationStore) UnreadCount() (int, error) {
	var count int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM notifications WHERE read=0`).Scan(&count)
	return count, err
}

func (s *NotificationStore) MarkRead(id string) error {
	_, err := s.db.Exec(`UPDATE notifications SET read=1 WHERE id=?`, id)
	return err
}

func (s *NotificationStore) MarkAllRead() error {
	_, err := s.db.Exec(`UPDATE notifications SET read=1 WHERE read=0`)
	return err
}

func (s *NotificationStore) Clear() error {
	_, err := s.db.Exec(`DELETE FROM notifications`)
	return err
}

func (s *NotificationStore) Push(typ, title, message string) (*Notification, error) {
	id := "notif-" + time.Now().Format("20060102150405.") + fmt.Sprintf("%d", time.Now().UnixNano()%100000)
	n := &Notification{
		ID:        id,
		Type:      typ,
		Title:     title,
		Message:   message,
		Read:      false,
		CreatedAt: now(),
	}
	_, err := s.db.Exec(
		`INSERT INTO notifications (id, type, title, message, read, created_at) VALUES (?,?,?,?,?,?)`,
		n.ID, n.Type, n.Title, n.Message, 0, n.CreatedAt,
	)
	return n, err
}
