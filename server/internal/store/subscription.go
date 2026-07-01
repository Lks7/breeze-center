package store

import (
	"database/sql"
	"time"
)

type Subscription struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Provider    string  `json:"provider"`
	ExpireDate  string  `json:"expire_date"`
	Price       float64 `json:"price"`
	Cycle       string  `json:"cycle"`
	Status      string  `json:"status"`
	NotifyDays  int     `json:"notify_days"`
	Description string  `json:"description"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type SubscriptionStore struct {
	db *sql.DB
}

func NewSubscriptionStore(db *sql.DB) *SubscriptionStore {
	return &SubscriptionStore{db: db}
}

func (s *SubscriptionStore) List() ([]Subscription, error) {
	rows, err := s.db.Query(`
		SELECT id, name, type, provider, expire_date, price, cycle, status, 
		       notify_days, description, created_at, updated_at
		FROM subscriptions
		ORDER BY expire_date ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Subscription
	for rows.Next() {
		var sub Subscription
		if err := rows.Scan(&sub.ID, &sub.Name, &sub.Type, &sub.Provider, &sub.ExpireDate,
			&sub.Price, &sub.Cycle, &sub.Status, &sub.NotifyDays, &sub.Description,
			&sub.CreatedAt, &sub.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, sub)
	}
	return list, rows.Err()
}

func (s *SubscriptionStore) Create(name, typ, provider, expireDate string, price float64, cycle, description string, notifyDays int) (string, error) {
	id := "sub-" + time.Now().Format("20060102150405")
	now := time.Now().Format(time.RFC3339)
	_, err := s.db.Exec(`
		INSERT INTO subscriptions (id, name, type, provider, expire_date, price, cycle, status, notify_days, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
	`, id, name, typ, provider, expireDate, price, cycle, notifyDays, description, now, now)
	return id, err
}

func (s *SubscriptionStore) Update(id, name, typ, provider, expireDate string, price float64, cycle, description string, notifyDays int) error {
	now := time.Now().Format(time.RFC3339)
	_, err := s.db.Exec(`
		UPDATE subscriptions 
		SET name=?, type=?, provider=?, expire_date=?, price=?, cycle=?, notify_days=?, description=?, updated_at=?
		WHERE id=?
	`, name, typ, provider, expireDate, price, cycle, notifyDays, description, now, id)
	return err
}

func (s *SubscriptionStore) Delete(id string) error {
	_, err := s.db.Exec(`DELETE FROM subscriptions WHERE id=?`, id)
	return err
}

// GetExpiring 获取N天内到期的订阅
func (s *SubscriptionStore) GetExpiring(days int) ([]Subscription, error) {
	targetDate := time.Now().AddDate(0, 0, days).Format("2006-01-02")
	rows, err := s.db.Query(`
		SELECT id, name, type, provider, expire_date, price, cycle, status,
		       notify_days, description, created_at, updated_at
		FROM subscriptions
		WHERE status='active' AND expire_date <= ?
		ORDER BY expire_date ASC
	`, targetDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Subscription
	for rows.Next() {
		var sub Subscription
		if err := rows.Scan(&sub.ID, &sub.Name, &sub.Type, &sub.Provider, &sub.ExpireDate,
			&sub.Price, &sub.Cycle, &sub.Status, &sub.NotifyDays, &sub.Description,
			&sub.CreatedAt, &sub.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, sub)
	}
	return list, rows.Err()
}
