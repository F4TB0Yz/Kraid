import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("kraid.agent")


@dataclass
class ToolCallRecord:
    tool_name: str
    is_error: bool
    execution_time_ms: float
    truncated: bool = False


@dataclass
class IterationMetrics:
    iterations: int = 0
    tool_calls: list[ToolCallRecord] = field(default_factory=list)
    error_count: int = 0
    loop_warnings: int = 0
    compactions: int = 0
    exit_reason: str = "unknown"

    @property
    def total_errors(self) -> int:
        return self.error_count

    def tool_summary(self) -> dict[str, dict]:
        summary: dict[str, dict] = {}
        for rec in self.tool_calls:
            entry = summary.setdefault(rec.tool_name, {"calls": 0, "errors": 0, "total_ms": 0.0, "truncated": 0})
            entry["calls"] += 1
            if rec.is_error:
                entry["errors"] += 1
            entry["total_ms"] += rec.execution_time_ms
            if rec.truncated:
                entry["truncated"] += 1
        for v in summary.values():
            if v["calls"]:
                v["avg_ms"] = round(v["total_ms"] / v["calls"], 1)
            del v["total_ms"]
        return summary

    def log_summary(self) -> None:
        ts = self.tool_summary()
        tool_stats = "; ".join(
            f"{name}: {info['calls']}calls/{info['errors']}errs/{info.get('avg_ms', 0)}ms"
            for name, info in ts.items()
        )
        logger.info(
            "Agent stream done | iterations=%d errors=%d loops=%d compactions=%d exit=%s | tools: %s",
            self.iterations,
            self.error_count,
            self.loop_warnings,
            self.compactions,
            self.exit_reason,
            tool_stats or "none",
        )
