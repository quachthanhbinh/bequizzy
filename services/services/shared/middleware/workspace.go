package middleware

import (
	"github.com/gin-gonic/gin"
)

func WorkspaceScope() gin.HandlerFunc {
	return func(c *gin.Context) {
		workspaceID := c.GetHeader("X-Workspace-ID")
		if workspaceID == "" {
			workspaceID, _ = c.Get("workspace_id")
		}

		if workspaceID == "" {
			c.JSON(400, gin.H{"error": "workspace_id required"})
			c.Abort()
			return
		}

		c.Set("workspace_id", workspaceID)
		c.Next()
	}
}
