package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/gzip"
)

func GZip() gin.HandlerFunc {
	return gzip.Gzip(gzip.DefaultCompression)
}
