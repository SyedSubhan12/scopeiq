from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str
    DATABASE_URL: str
    REDIS_URL: str
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    API_BASE_URL: str = "http://localhost:4000"
    AI_CALLBACK_SECRET: str = ""
    # Object storage (MinIO / S3-compatible) — only required for PDF extraction fallback
    STORAGE_ENDPOINT: str = "localhost"
    STORAGE_PORT: str = "9000"
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_BUCKET: str = "scopeiq-assets"
    STORAGE_USE_SSL: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
