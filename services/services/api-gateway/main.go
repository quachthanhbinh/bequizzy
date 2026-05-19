package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"api-gateway/internal/config"
	"api-gateway/internal/middleware"
)

func main() {
	cfg := config.Load()

	router := gin.Default()

	router.Use(middleware.CORS())
	router.Use(middleware.GZip())
	router.Use(middleware.SupabaseJWT())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	setupRoutes(router, cfg)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("API Gateway starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func setupRoutes(router *gin.Engine, cfg *config.Config) {
	v1 := router.Group("/v1")
	{
		v1.Any("/workspaces/*path", proxyTo(cfg.WorkspaceServiceURL))
		v1.Any("/members/*path", proxyTo(cfg.WorkspaceServiceURL))
		v1.Any("/leads/*path", proxyTo(cfg.LeadServiceURL))
		v1.Any("/campaigns/*path", proxyTo(cfg.CampaignServiceURL))
		v1.Any("/billing/*path", proxyTo(cfg.BillingServiceURL))
	}
}

func proxyTo(targetURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(501, gin.H{"error": "proxy not implemented"})
	}
}
