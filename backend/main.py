from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import parse, gap, pathway, ats

app = FastAPI(
    title="AI-Adaptive Onboarding Engine",
    description="AI-powered personalized learning pathway generator",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(parse.router, prefix="/api/parse", tags=["Parsing"])
app.include_router(gap.router, prefix="/api/gap", tags=["Gap"])
app.include_router(pathway.router, prefix="/api/pathway", tags=["Pathway"])
app.include_router(ats.router, prefix="/api/ats", tags=["ATS"])

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Adaptive Onboarding Engine is running 🚀"
    }
