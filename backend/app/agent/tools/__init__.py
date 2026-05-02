from app.agent.tools.base import ToolRegistry
from app.agent.tools.canvas_tools import canvas_list, canvas_read, canvas_create, canvas_edit
from app.agent.tools.fs_tools import fs_read, fs_write, fs_list, fs_search
from app.agent.tools.file_tools import file_write, file_list, file_read, file_delete
from app.agent.tools.ask_user_tool import ask_user
from app.agent.tools.scope_tool import set_scope
from app.agent.tools.middleware import TimeoutMiddleware
from app.agent.tools.circuit_breaker import CircuitBreakerMiddleware
from app.agent.tools.result_truncator import ResultTruncatorMiddleware

tool_registry = ToolRegistry()

tool_registry.use(CircuitBreakerMiddleware())
tool_registry.use(TimeoutMiddleware())
tool_registry.use(ResultTruncatorMiddleware())

for tool in [
    canvas_list, canvas_read, canvas_create, canvas_edit,
    fs_read, fs_write, fs_list, fs_search,
    file_write, file_list, file_read, file_delete,
    ask_user,
    set_scope,
]:
    tool_registry.register(tool)
