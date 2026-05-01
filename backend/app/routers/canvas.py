from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.services.canvas_store import canvas_store

router = APIRouter()


class UpdateBody(BaseModel):
    content: str


class CreateBody(BaseModel):
    title: str
    content: str = ""


@router.get("/documents")
def list_documents():
    return canvas_store.list()


@router.get("/document/{doc_id}")
def get_document(doc_id: str):
    doc = canvas_store.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.put("/document/{doc_id}")
def update_document(doc_id: str, body: UpdateBody):
    doc = canvas_store.update(doc_id, body.content)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/documents")
def create_document(body: CreateBody):
    return canvas_store.create(body.title, body.content)