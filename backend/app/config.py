from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    redis_url: str = "redis://127.0.0.1:6379/0"
    audio_service_token: str = "dev-audio-token"
    x32_ip: str = ""
    x32_osc_port: int = 10023
    meter_refresh_ms: int = 100
    listen_port: int = 10024
    default_tenant_id: str = "300-awakening"


settings = Settings()
