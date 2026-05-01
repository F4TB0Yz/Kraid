from pydantic_settings import BaseSettings
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_base_url: str = ""
    openai_model: str = "gpt-4o-mini"
    repo_root: str = str(Path(__file__).resolve().parent.parent.parent)
    max_tool_iterations: int = 10

    @property
    def resolved_repo_root(self) -> Path:
        return Path(self.repo_root).resolve()

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
