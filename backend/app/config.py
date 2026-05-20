from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://recall:recall@postgres:5432/recall"
    sync_database_url: str = "postgresql://recall:recall@postgres:5432/recall"
    redis_url: str = "redis://redis:6379"
    anthropic_api_key: str = ""
    secret_key: str = "changeme-secret-key-for-jwt"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    model_config = {"env_file": ".env"}


settings = Settings()
