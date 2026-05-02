from collections import Counter

from app.config import settings


def compact_messages(messages: list[dict]) -> tuple[list[dict], int]:
    trigger = settings.context_compaction_trigger
    if len(messages) <= trigger:
        return messages, 0

    system_msg = messages[0]
    first_user = messages[1] if len(messages) > 1 and messages[1].get("role") == "user" else None
    keep_recent = settings.context_compaction_keep_recent

    recent = messages[-keep_recent:]
    middle = messages[1:-keep_recent] if first_user else messages[1:-keep_recent]
    if first_user:
        middle = messages[2:-keep_recent]

    tool_counts: Counter[str] = Counter()
    error_count = 0
    for m in middle:
        role = m.get("role", "")
        if role == "tool":
            tool_name = m.get("tool_name", "unknown")
            tool_counts[tool_name] += 1
        if m.get("is_error", False):
            error_count += 1

    compacted_count = len(middle)
    summary_parts = []
    if tool_counts:
        tool_summary = ", ".join(f"{name}({count})" for name, count in sorted(tool_counts.items()))
        summary_parts.append(f"Tools: {tool_summary}")
    if error_count:
        summary_parts.append(f"Errors: {error_count}")
    summary_str = "; ".join(summary_parts)

    compacted_msg = {
        "role": "system",
        "content": f"[Context compacted: {compacted_count} messages removed. {summary_str}]",
    }

    result = [system_msg]
    if first_user:
        result.append(first_user)
    result.append(compacted_msg)
    result.extend(recent)

    hard_cap = settings.max_context_messages
    if len(result) > hard_cap:
        keep = hard_cap - 1
        result = [result[0]] + result[-keep:]

    return result, compacted_count
