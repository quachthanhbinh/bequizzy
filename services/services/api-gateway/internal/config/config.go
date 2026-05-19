package config

import (
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	SupabaseURL          string
	SupabaseAnonKey      string
	WorkspaceServiceURL  string
	LeadServiceURL       string
	CampaignServiceURL   string
	BillingServiceURL    string
	AIServiceURL         string
	NotificationServiceURL string
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		Port:                  getEnv("PORT", "8000"),
		SupabaseURL:          getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:      getEnv("SUPABASE_ANON_KEY", ""),
		WorkspaceServiceURL:  getEnv("WORKSPACE_SERVICE_URL", "http://localhost:8001"),
		LeadServiceURL:       getEnv("LEAD_SERVICE_URL", "http://localhost:8002"),
		CampaignServiceURL:   getEnv("CAMPAIGN_SERVICE_URL", "http://localhost:8003"),
		BillingServiceURL:    getEnv("BILLING_SERVICE_URL", "http://localhost:8004"),
		AIServiceURL:         getEnv("AI_SERVICE_URL", "http://localhost:8005"),
		NotificationServiceURL: getEnv("NOTIFICATION_SERVICE_URL", "http://localhost:8006"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
