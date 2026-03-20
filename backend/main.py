from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import parse, pathway

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
app.include_router(pathway.router, prefix="/api/pathway", tags=["Pathway"])

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Adaptive Onboarding Engine is running 🚀"
    }
