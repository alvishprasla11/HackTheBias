from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
from datetime import datetime
from pathlib import Path
from agent import NewsAnalysisAgent, NewsAnalysis

app = FastAPI(
    title="Multi-Perspective News Analysis API",
    description="API for analyzing news from multiple perspectives and detecting bias",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class AnalysisRequest(BaseModel):
    location: str
    topic: Optional[str] = None


# Initialize agent (will be done on startup)
agent: Optional[NewsAnalysisAgent] = None

# Daily news cache file path
CACHE_FILE = Path(__file__).parent.parent / "daily_news_cache.json"


def load_daily_news() -> Optional[Dict[str, Any]]:
    """Load daily news from cache file"""
    if not CACHE_FILE.exists():
        return None
    
    try:
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️  Error loading cache: {e}")
        return None


def save_daily_news(news_data: Dict[str, Any]):
    """Save daily news to cache file"""
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(news_data, f, indent=2)
        print(f"✅ Daily news cache saved: {CACHE_FILE}")
    except Exception as e:
        print(f"⚠️  Error saving cache: {e}")


def is_cache_valid() -> bool:
    """Check if cache exists and is from today"""
    cache = load_daily_news()
    if not cache:
        return False
    
    cache_date = cache.get('date')
    today = datetime.now().strftime('%Y-%m-%d')
    
    return cache_date == today


async def fetch_daily_news() -> Dict[str, Any]:
    """Fetch top 10 global news headlines using Tavily search"""
    if agent is None:
        return {"error": "Agent not initialized"}
    
    try:
        # Use Tavily search directly to get top headlines
        from langchain_tavily import TavilySearch
        
        tavily_key = os.getenv("TAVILY_API_KEY")
        search = TavilySearch(api_key=tavily_key, max_results=10)
        
        print("🌍 Fetching top 10 global news headlines...")
        results = await search.ainvoke("top 10 global news headlines today")
        
        # Parse results into structured format
        news_items = []
        if isinstance(results, str):
            # Parse the string response
            lines = results.split('\n')
            for line in lines[:10]:
                if line.strip():
                    news_items.append({
                        "headline": line.strip(),
                        "source": "Global News"
                    })
        elif isinstance(results, list):
            # Tavily returns list of dicts
            for item in results[:10]:
                news_items.append({
                    "headline": item.get('title', item.get('content', '')[:100]),
                    "source": item.get('source', 'Unknown'),
                    "url": item.get('url', '')
                })
        
        news_data = {
            "date": datetime.now().strftime('%Y-%m-%d'),
            "fetched_at": datetime.now().isoformat(),
            "count": len(news_items),
            "news": news_items
        }
        
        save_daily_news(news_data)
        print(f"✅ Fetched {len(news_items)} news headlines")
        
        return news_data
        
    except Exception as e:
        print(f"⚠️  Error fetching daily news: {e}")
        return {
            "error": str(e),
            "date": datetime.now().strftime('%Y-%m-%d'),
            "news": []
        }


@app.on_event("startup")
async def startup_event():
    """Initialize the agent on startup and fetch daily news if needed"""
    global agent
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    if not gemini_key or not tavily_key:
        print("⚠️  WARNING: GEMINI_API_KEY and TAVILY_API_KEY must be set in environment")
        print("   The API will not work without these keys.")
    else:
        agent = NewsAnalysisAgent(
            gemini_api_key=gemini_key,
            tavily_api_key=tavily_key
        )
        print("✅ News Analysis Agent initialized successfully")
        
        # Check if we need to fetch daily news
        print("\n📰 Checking daily news cache...")
        if is_cache_valid():
            cache = load_daily_news()
            print(f"✅ Using cached daily news from {cache.get('date')} ({cache.get('count', 0)} headlines)")
        else:
            print("🔄 Cache missing or outdated, fetching new daily news...")
            await fetch_daily_news()


@app.get("/")
def hello():
    return {
        "message": "Multi-Perspective News Analysis API",
        "status": "running",
        "endpoints": {
            "POST /analyze": "Analyze news from multiple perspectives",
            "GET /daily-news": "Get top 10 global news headlines (cached daily)",
            "GET /health": "Health check"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent_initialized": agent is not None
    }


@app.get("/daily-news")
def get_daily_news():
    """
    Get top 10 global news headlines
    
    Returns cached data from today. Cache is updated once per day on server startup.
    This endpoint does NOT make new API calls - it serves cached data only.
    """
    cache = load_daily_news()
    
    if not cache:
        raise HTTPException(
            status_code=404,
            detail="No daily news available. Server may still be initializing."
        )
    
    # Check if cache is from today
    today = datetime.now().strftime('%Y-%m-%d')
    if cache.get('date') != today:
        raise HTTPException(
            status_code=503,
            detail=f"Daily news cache is outdated (from {cache.get('date')}). Please restart the server to fetch today's news."
        )
    
    return cache


@app.post("/analyze", response_model=NewsAnalysis)
async def analyze_news(request: AnalysisRequest):
    """
    Analyze news from multiple perspectives
    
    - **location**: Geographic location (country, state, city)
    - **topic**: Optional specific topic (if None, finds biggest current news)
    
    Returns comprehensive analysis with:
    - Multiple perspectives (typically opposing viewpoints)
    - Source information and bias indicators
    - Who supports each perspective
    - Common facts vs disagreements
    - Social media and independent voices
    """
    
    if agent is None:
        raise HTTPException(
            status_code=503,
            detail="Agent not initialized. Please set GEMINI_API_KEY and TAVILY_API_KEY environment variables."
        )
    
    try:
        analysis = await agent.analyze_news(
            location=request.location,
            topic=request.topic
        )
        
        # Convert Pydantic model to dict for JSON serialization
        return analysis
    
    except Exception as e:
        # Fallback: Try USA if there's an error with the original request
        print(f"⚠️  Error analyzing {request.location}: {str(e)}")
        print(f"🔄 Falling back to United States...")
        
        try:
            fallback_analysis = await agent.analyze_news(
                location="United States",
                topic=request.topic
            )
            return fallback_analysis
        except Exception as fallback_error:
            raise HTTPException(
                status_code=500,
                detail=f"Error analyzing news: {str(e)}. Fallback also failed: {str(fallback_error)}"
            )


@app.get("/examples")
def get_examples():
    """Get example queries"""
    return {
        "examples": [
            {
                "location": "United States",
                "topic": None,
                "description": "Find biggest current US news"
            },
            {
                "location": "California",
                "topic": "housing crisis",
                "description": "Analyze California housing crisis perspectives"
            },
            {
                "location": "New York City",
                "topic": "subway safety",
                "description": "NYC subway safety from multiple angles"
            },
            {
                "location": "United Kingdom",
                "topic": "NHS funding",
                "description": "UK healthcare funding perspectives"
            }
        ]
    }

