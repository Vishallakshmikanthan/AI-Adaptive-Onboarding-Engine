from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_pathway():
    return {"message": "Pathway router is under construction"}
