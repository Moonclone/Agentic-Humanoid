from fastapi import FastAPI

app = FastAPI(title="Agentic AI Supermodel")

@app.get("/")
def root():
    return {"message": "🚀 Agentic AI Supermodel Backend is Running!"}
