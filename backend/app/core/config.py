from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AchieveMate API"
    environment: str = Field(default="development")
    database_url: str = Field(default="sqlite:///./achievemate.db")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
