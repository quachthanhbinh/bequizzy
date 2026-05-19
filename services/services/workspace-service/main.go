package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"workspace-service/internal/config"
	"workspace-service/internal/handlers"
)

func main() {
	cfg := config.Load()

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	v1 := router.Group("/v1")
	{
		workspaces := v1.Group("/workspaces")
		{
			workspaces.GET("", handlers.ListWorkspaces)
			workspaces.POST("", handlers.CreateWorkspace)
			workspaces.GET("/:id", handlers.GetWorkspace)
			workspaces.PATCH("/:id", handlers.UpdateWorkspace)
			workspaces.DELETE("/:id", handlers.DeleteWorkspace)
		}

		members := v1.Group("/members")
		{
			members.GET("", handlers.ListMembers)
			members.POST("", handlers.InviteMember)
			members.DELETE("/:id", handlers.RemoveMember)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	log.Printf("Workspace Service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
