from app.agent.tools.base import ToolRegistry
from app.agent.tools.canvas_tools import canvas_list, canvas_read, canvas_create, canvas_edit
from app.agent.tools.memory_tools import memory_list, memory_read, memory_write
from app.agent.tools.user_memory_tools import user_memory_save, user_memory_delete
from app.agent.tools.fs_tools import fs_read, fs_write, fs_list, fs_search

tool_registry = ToolRegistry()

for tool in [
    canvas_list, canvas_read, canvas_create, canvas_edit,
    memory_list, memory_read, memory_write,
    user_memory_save, user_memory_delete,
    fs_read, fs_write, fs_list, fs_search,
]:
    tool_registry.register(tool)
