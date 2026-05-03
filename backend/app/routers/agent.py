from fastapi import APIRouter
from pydantic import BaseModel
from app.agent import prompts as prompts_module

router = APIRouter()


class RulesPayload(BaseModel):
    content: str


@router.get("/rules")
def get_rules():
    return {"content": prompts_module.load_prompt()}


@router.put("/rules")
def put_rules(body: RulesPayload):
    prompts_module.save_prompt(body.content)
    prompts_module.DOMAIN_AGENT_PROMPT = body.content
    return {"ok": True}
