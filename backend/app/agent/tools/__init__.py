from app.agent.tools.base import ToolRegistry
from app.agent.tools.canvas_tools import canvas_list, canvas_read, canvas_create, canvas_edit
from app.agent.tools.fs_tools import fs_read, fs_write, fs_list, fs_search
from app.agent.tools.file_tools import file_write, file_list, file_read, file_delete
from app.agent.tools.ask_user_tool import ask_user
from app.agent.tools.scope_tool import set_scope

tool_registry = ToolRegistry()

for tool in [
    canvas_list, canvas_read, canvas_create, canvas_edit,
    fs_read, fs_write, fs_list, fs_search,
    file_write, file_list, file_read, file_delete,
    ask_user,
    set_scope,
]:
    tool_registry.register(tool)
