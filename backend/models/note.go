package models

import "time"

type Note struct {
	ID         string    `gorm:"primaryKey" json:"id"`
	UserID     string    `json:"userId"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	Emoji      string    `json:"emoji"`
	Categories []string  `json:"categories"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
