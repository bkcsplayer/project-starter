package main

import (
  "net/http"
  "os"
  "time"

  "github.com/gin-gonic/gin"
)

func main() {
  r := gin.New()
  r.Use(gin.Logger(), gin.Recovery())

  r.GET("/healthz", func(c *gin.Context) {
    c.JSON(200, gin.H{"ok": true, "ts": time.Now().UTC()})
  })

  r.GET("/api/hello", func(c *gin.Context) {
    c.JSON(200, gin.H{"message": "Hello from Go (Gin)!"})
  })

  // (Optional) Placeholder for OpenRouter integration.
  r.POST("/api/ai/reason", func(c *gin.Context) {
    c.JSON(501, gin.H{"code": "NOT_IMPLEMENTED", "message": "Use Node or Python backend to call OpenRouter, or implement Go client."})
  })

  port := os.Getenv("PORT")
  if port == "" {
    port = "8080"
  }
  _ = http.ListenAndServe("0.0.0.0:"+port, r)
}
