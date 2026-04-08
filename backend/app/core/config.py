from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DayPilot API"
    environment: str = Field(default="development")
    database_url: str = Field(default="sqlite:///./daypilot.db")  # overridden in prod via DATABASE_URL env var

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()