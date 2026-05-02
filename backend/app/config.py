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
    max_tool_iterations: int = 25

    tool_timeout_default: int = 30
    tool_timeout_overrides: str = "ask_user:300,fs_search:15,fs_read:10,fs_write:10"

    circuit_breaker_threshold: int = 3
    circuit_breaker_reset_seconds: int = 60

    loop_detection_window: int = 6
    loop_detection_max_repeats: int = 2

    max_context_messages: int = 80
    tool_result_max_chars: int = 12000
    context_compaction_trigger: int = 60
    context_compaction_keep_recent: int = 20

    parallel_tool_execution: bool = True
    parallel_tool_max_concurrency: int = 5

    max_consecutive_errors: int = 3
    max_total_errors: int = 8
    graceful_exit_reserve: int = 2

    @property
    def resolved_repo_root(self) -> Path:
        return Path(self.repo_root).resolve()

    @property
    def tool_timeout_map(self) -> dict[str, int]:
        mapping: dict[str, int] = {}
        for entry in self.tool_timeout_overrides.split(","):
            entry = entry.strip()
            if not entry:
                continue
            if ":" in entry:
                name, secs = entry.split(":", 1)
                mapping[name.strip()] = int(secs.strip())
        return mapping

    def tool_timeout(self, tool_name: str) -> int:
        overrides = self.tool_timeout_map
        return overrides.get(tool_name, self.tool_timeout_default)

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
