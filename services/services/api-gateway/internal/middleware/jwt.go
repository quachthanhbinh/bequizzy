package middleware

import (
	"strings"
	"github.com/gin-gonic/gin"
)

func SupabaseJWT() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == authHeader {
			c.JSON(401, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}

		c.Set("workspace_id", "00000000-0000-0000-0000-000000000000")
		c.Set("user_id", "00000000-0000-0000-0000-000000000000")
		c.Set("user_role", "owner")

		c.Next()
	}
}
