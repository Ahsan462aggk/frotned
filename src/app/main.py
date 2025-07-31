import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Detect environment
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

# Define allowed CORS origins for local development and production
if ENVIRONMENT == 'production':
    cors_origins = [
        # Add your production frontend domain(s) here
        "https://your-frontend-domain.com",
    ]
else:
    cors_origins = [
        "http://localhost:8080",
        "http://localhost:3000"
    ]

app = FastAPI(
    title="EduTech API",
    description="API for EduTech platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600  # Cache preflight requests for 1 hour
)

# ... existing code ... 