package models

import "time"

type User struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` // "-" prevents password from being included in JSON
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
