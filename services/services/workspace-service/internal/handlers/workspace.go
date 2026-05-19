package handlers

import (
	"github.com/gin-gonic/gin"
)

func ListWorkspaces(c *gin.Context) {
	c.JSON(200, gin.H{"data": []interface{}{}})
}

func CreateWorkspace(c *gin.Context) {
	c.JSON(201, gin.H{"data": gin.H{"id": "00000000-0000-0000-0000-000000000000"}})
}

func GetWorkspace(c *gin.Context) {
	c.JSON(200, gin.H{"data": gin.H{"id": c.Param("id")}})
}

func UpdateWorkspace(c *gin.Context) {
	c.JSON(200, gin.H{"data": gin.H{"id": c.Param("id")}})
}

func DeleteWorkspace(c *gin.Context) {
	c.JSON(204, nil)
}

func ListMembers(c *gin.Context) {
	c.JSON(200, gin.H{"data": []interface{}{}})
}

func InviteMember(c *gin.Context) {
	c.JSON(201, gin.H{"data": gin.H{"id": "00000000-0000-0000-0000-000000000000"}})
}

func RemoveMember(c *gin.Context) {
	c.JSON(204, nil)
}
