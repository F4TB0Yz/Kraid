import asyncio
import json
import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from app.agent.context.user_context import get_kraid_dir

logger = logging.getLogger("kraid.memory_watcher")

class MemoryEventHandler(FileSystemEventHandler):
    def __init__(self, queue: asyncio.Queue):
        self.queue = queue
        self.loop = asyncio.get_running_loop()
        super().__init__()

    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith(".md"):
            self._notify(event.src_path, "update")

    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith(".md"):
            self._notify(event.src_path, "create")

    def on_deleted(self, event):
        if not event.is_directory and event.src_path.endswith(".md"):
            self._notify(event.src_path, "delete")
            
    def _notify(self, src_path, action):
        try:
            kraid_dir = get_kraid_dir()
            path = Path(src_path)
            # Must be within a valid type directory: profile, feedback, projects, references
            rel_path = path.relative_to(kraid_dir)
            if len(rel_path.parts) == 2:
                mem_type = rel_path.parts[0]
                if mem_type in {"profile", "feedback", "projects", "references"}:
                    event_data = {
                        "event": "memory_changed",
                        "data": {
                            "type": mem_type,
                            "filename": rel_path.parts[1],
                            "action": action
                        }
                    }
                    # Run coroutine threadsafe
                    asyncio.run_coroutine_threadsafe(self.queue.put(event_data), self.loop)
        except ValueError:
            pass # Not relative to kraid_dir

class MemoryWatcher:
    def __init__(self):
        self.observer = Observer()
        self.queue = None
        self.kraid_dir = get_kraid_dir()
        self.is_running = False

    async def start(self):
        if self.is_running:
            return
            
        self.kraid_dir.mkdir(parents=True, exist_ok=True)
        for t in ["profile", "feedback", "projects", "references"]:
            (self.kraid_dir / t).mkdir(parents=True, exist_ok=True)
            
        self.queue = asyncio.Queue()
        event_handler = MemoryEventHandler(self.queue)
        
        self.observer.schedule(event_handler, str(self.kraid_dir), recursive=True)
        self.observer.start()
        self.is_running = True
        logger.info(f"Memory watcher started on {self.kraid_dir}")

    def stop(self):
        if self.is_running:
            self.observer.stop()
            self.observer.join()
            self.is_running = False
            logger.info("Memory watcher stopped")

    async def event_generator(self):
        if not self.is_running:
            await self.start()
            
        try:
            while True:
                event = await self.queue.get()
                yield event
        except asyncio.CancelledError:
            pass

watcher = MemoryWatcher()
