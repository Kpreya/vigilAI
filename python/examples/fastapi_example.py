"""
Example FastAPI application with VigilAI SDK integration.

This example demonstrates how to integrate VigilAI monitoring into a FastAPI application.
"""

from fastapi import FastAPI, HTTPException
from vigilai import VigilAI, VigilAIConfig
import asyncio

# Initialize VigilAI SDK
config = VigilAIConfig(
    api_key="your-api-key-here",
    monitoring={"interval": 60000, "sampling_rate": 1.0},
    thresholds={
        "response_time": 1000,
        "error_rate": 5,
        "memory_usage": 500,
        "cpu_usage": 80,
    }
)

vigilai = VigilAI(config)

# Create FastAPI app
app = FastAPI(title="VigilAI FastAPI Example")

# Add VigilAI middleware
app.middleware("http")(vigilai.fastapi_middleware())


@app.on_event("startup")
async def startup_event():
    """Initialize VigilAI on startup"""
    await vigilai.initialize()
    print("VigilAI SDK initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Gracefully shutdown VigilAI"""
    await vigilai.shutdown()
    print("VigilAI SDK shutdown complete")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Hello from VigilAI FastAPI Example"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/slow")
async def slow_endpoint():
    """Simulates a slow endpoint"""
    await asyncio.sleep(2)
    return {"message": "This was slow"}


@app.get("/error")
async def error_endpoint():
    """Simulates an error"""
    raise HTTPException(status_code=500, detail="Simulated error")


@app.get("/exception")
async def exception_endpoint():
    """Simulates an unhandled exception"""
    raise ValueError("Simulated unhandled exception")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
