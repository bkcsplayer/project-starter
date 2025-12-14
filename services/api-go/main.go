package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

var db *sql.DB

// User represents a user record
type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ApiError represents a standardized error response
type ApiError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// UsersListResponse represents React-Admin compatible list response
type UsersListResponse struct {
	Data  []User `json:"data"`
	Total int    `json:"total"`
}

// UserResponse represents single user response
type UserResponse struct {
	Data User `json:"data"`
}

func waitForDB(maxAttempts int) error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:postgres@localhost:5432/app?sslmode=disable"
	}
	// Ensure sslmode is set for PostgreSQL
	if !strings.Contains(dbURL, "sslmode") {
		if strings.Contains(dbURL, "?") {
			dbURL += "&sslmode=disable"
		} else {
			dbURL += "?sslmode=disable"
		}
	}

	var err error
	for i := 0; i < maxAttempts; i++ {
		db, err = sql.Open("postgres", dbURL)
		if err == nil {
			err = db.Ping()
			if err == nil {
				log.Println("[db] Connected to PostgreSQL")
				return nil
			}
		}
		log.Printf("[db] Waiting for database... attempt %d/%d: %v", i+1, maxAttempts, err)
		time.Sleep(1 * time.Second)
	}
	return err
}

func main() {
	// Wait for database
	if err := waitForDB(30); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// Health check
	r.GET("/healthz", func(c *gin.Context) {
		err := db.Ping()
		c.JSON(200, gin.H{"ok": err == nil, "ts": time.Now().UTC()})
	})

	// Hello endpoint
	r.GET("/hello", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "hello", "backend": "go"})
	})

	// Admin Users - List
	r.GET("/admin/users", func(c *gin.Context) {
		// Parse React-Admin pagination params
		offset := 0
		limit := 25

		if rangeParam := c.Query("range"); rangeParam != "" {
			var rangeArr []int
			if err := json.Unmarshal([]byte(rangeParam), &rangeArr); err == nil && len(rangeArr) == 2 {
				offset = rangeArr[0]
				limit = rangeArr[1] - rangeArr[0] + 1
			}
		}

		// Parse sorting
		orderBy := "created_at"
		orderDir := "DESC"
		if sortParam := c.Query("sort"); sortParam != "" {
			var sortArr []string
			if err := json.Unmarshal([]byte(sortParam), &sortArr); err == nil && len(sortArr) == 2 {
				allowedFields := map[string]bool{"id": true, "name": true, "email": true, "created_at": true, "updated_at": true}
				if allowedFields[sortArr[0]] {
					orderBy = sortArr[0]
					if sortArr[1] == "ASC" {
						orderDir = "ASC"
					}
				}
			}
		}

		// Get total count
		var total int
		err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&total)
		if err != nil {
			c.JSON(500, ApiError{Code: "DB_ERROR", Message: "Failed to count users"})
			return
		}

		// Get users
		query := "SELECT id, name, email, created_at, updated_at FROM users ORDER BY " + orderBy + " " + orderDir + " LIMIT $1 OFFSET $2"
		rows, err := db.Query(query, limit, offset)
		if err != nil {
			c.JSON(500, ApiError{Code: "DB_ERROR", Message: "Failed to fetch users"})
			return
		}
		defer rows.Close()

		users := []User{}
		for rows.Next() {
			var u User
			if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt, &u.UpdatedAt); err != nil {
				continue
			}
			users = append(users, u)
		}

		// Set Content-Range header for React-Admin
		endIndex := offset + len(users) - 1
		if endIndex < 0 {
			endIndex = 0
		}
		c.Header("Content-Range", "users "+strconv.Itoa(offset)+"-"+strconv.Itoa(endIndex)+"/"+strconv.Itoa(total))
		c.Header("Access-Control-Expose-Headers", "Content-Range")

		c.JSON(200, UsersListResponse{Data: users, Total: total})
	})

	// Admin Users - Get by ID
	r.GET("/admin/users/:id", func(c *gin.Context) {
		id := c.Param("id")

		var u User
		err := db.QueryRow("SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1", id).
			Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt, &u.UpdatedAt)

		if err == sql.ErrNoRows {
			c.JSON(404, ApiError{Code: "NOT_FOUND", Message: "User " + id + " not found"})
			return
		}
		if err != nil {
			c.JSON(500, ApiError{Code: "DB_ERROR", Message: "Failed to fetch user"})
			return
		}

		c.JSON(200, UserResponse{Data: u})
	})

	// OpenRouter AI - Not implemented for Go
	r.POST("/ai/reason", func(c *gin.Context) {
		c.JSON(501, ApiError{
			Code:    "NOT_IMPLEMENTED",
			Message: "Use Node or Python backend to call OpenRouter, or implement Go client.",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("api-go listening on %s", port)
	if err := http.ListenAndServe("0.0.0.0:"+port, r); err != nil {
		log.Fatal(err)
	}
}
