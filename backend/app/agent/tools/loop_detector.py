import hashlib
from collections import deque
from typing import Optional

from app.config import settings


class LoopDetector:
    def __init__(self) -> None:
        self._history: deque[tuple[str, str]] = deque(maxlen=settings.loop_detection_window)
        self._window = settings.loop_detection_window
        self._max_repeats = settings.loop_detection_max_repeats

    def record_and_check(self, name: str, args: dict[str, object]) -> Optional[str]:
        args_bytes = str(sorted(args.items())).encode("utf-8")
        sig = hashlib.sha256(args_bytes).hexdigest()[:16]
        self._history.append((name, sig))
        if len(self._history) < 3:
            return None
        h = list(self._history)
        counts: dict[tuple[str, str], int] = {}
        for entry in h:
            counts[entry] = counts.get(entry, 0) + 1
        for (tool, sig), count in counts.items():
            if count > self._max_repeats and tool == name:
                return (
                    f"[System Warning: La tool '{tool}' ha sido llamada {count+1} veces "
                    f"con los mismos argumentos en las últimas {len(h)} llamadas. "
                    f"Esto puede indicar un loop. Cambia de estrategia.]"
                )
        return None
