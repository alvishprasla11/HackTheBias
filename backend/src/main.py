from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from src.agent import NewsAnalysisAgent, NewsAnalysis

# Load environment variables from .env file
load_dotenv()

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


class SearchRequest(BaseModel):
    topic: str


class SearchResponse(BaseModel):
    topic: str
    searched_at: str
    count: int
    headlines: List[Dict[str, str]]  # List of {headline, source, url}


# Initialize agent (will be done on startup)
agent: Optional[NewsAnalysisAgent] = None

# Daily news cache file path
CACHE_FILE = Path(__file__).parent.parent / "daily_news_cache.json"
SEARCH_CACHE_FILE = Path(__file__).parent.parent / "search_cache.json"


def load_search_cache() -> Dict[str, Any]:
    """Load search cache from file"""
    if not SEARCH_CACHE_FILE.exists():
        return {}
    
    try:
        with open(SEARCH_CACHE_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️  Error loading search cache: {e}")
        return {}


def save_search_cache(cache: Dict[str, Any]):
    """Save search cache to file"""
    try:
        with open(SEARCH_CACHE_FILE, 'w') as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        print(f"⚠️  Error saving search cache: {e}")


def get_cached_search(topic: str) -> Optional[List[Dict[str, str]]]:
    """Get cached search results if they exist and are from today"""
    cache = load_search_cache()
    today = datetime.now().strftime('%Y-%m-%d')
    
    topic_key = topic.lower().strip()
    
    if topic_key in cache:
        cached_data = cache[topic_key]
        if cached_data.get('date') == today:
            print(f"✅ Using cached search results for: {topic}")
            return cached_data.get('headlines', [])
    
    return None


def cache_search_results(topic: str, headlines: List[Dict[str, str]]):
    """Cache search results with today's date"""
    cache = load_search_cache()
    today = datetime.now().strftime('%Y-%m-%d')
    
    topic_key = topic.lower().strip()
    
    cache[topic_key] = {
        'date': today,
        'headlines': headlines
    }
    
    save_search_cache(cache)
    print(f"💾 Cached search results for: {topic}")


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
    """Fetch top 10 global news headlines and analyze each through full unbiased pipeline"""
    if agent is None:
        return {"error": "Agent not initialized"}
    
    try:
        # Use Tavily search directly to get top headlines
        from langchain_tavily import TavilySearch
        
        tavily_key = os.getenv("TAVILY_API_KEY")
        search = TavilySearch(api_key=tavily_key, max_results=10)
        
        print("\n" + "="*80)
        print("🌍 FETCHING TOP 10 GLOBAL NEWS")
        print("="*80)
        print("📰 Step 1: Getting headlines...")
        
        # Tavily returns a list of dicts with 'content', 'title', 'url', etc.
        results = await search.ainvoke("latest breaking global news today")
        
        print(f"\n🔍 DEBUG: Type of results: {type(results)}")
        if isinstance(results, dict):
            print(f"🔍 DEBUG: Dict keys: {results.keys()}")
            if 'results' in results:
                print(f"🔍 DEBUG: Number of items in results: {len(results['results'])}")
        
        # Parse results into headlines
        headlines = []
        
        # Tavily returns a dict with 'results' key containing list of articles
        if isinstance(results, dict) and 'results' in results:
            for item in results['results']:
                if isinstance(item, dict):
                    # Get title from each result
                    headline = item.get('title', '').strip()
                    if headline and headline not in headlines:  # Avoid duplicates
                        headlines.append(headline)
        elif isinstance(results, list):
            for item in results:
                if isinstance(item, dict):
                    headline = item.get('title') or item.get('content', '')[:200]
                    if headline and headline not in headlines:
                        headlines.append(headline.strip())
        elif isinstance(results, str):
            # If it's a string, split by newlines
            lines = results.split('\n')
            for line in lines:
                if line.strip() and len(line.strip()) > 20:
                    headlines.append(line.strip())
                    if len(headlines) >= 10:
                        break
        
        # Limit to 10
        headlines = headlines[:10]
        
        print(f"✅ Found {len(headlines)} headlines")
        
        # Now analyze each headline through full pipeline
        print(f"\n🔄 Step 2: Analyzing each headline (this will take ~5-10 minutes)...\n")
        analyzed_news = []
        
        for i, headline in enumerate(headlines, 1):
            try:
                print(f"\n{'─'*80}")
                print(f"📊 Analyzing {i}/{len(headlines)}: {headline[:60]}...")
                print(f"{'─'*80}")
                
                # Run through full unbiased analysis pipeline
                analysis = await agent.analyze_news(
                    location="Global",
                    topic=headline
                )
                
                analyzed_news.append({
                    "rank": i,
                    "headline": headline,
                    "analysis": analysis.dict()  # Full NewsAnalysis object
                })
                
                print(f"✅ [{i}/{len(headlines)}] Complete!")
                
            except Exception as e:
                print(f"⚠️  Error analyzing headline {i}: {e}")
                # Still add it but with error
                analyzed_news.append({
                    "rank": i,
                    "headline": headline,
                    "error": str(e),
                    "analysis": None
                })
        
        news_data = {
            "date": datetime.now().strftime('%Y-%m-%d'),
            "fetched_at": datetime.now().isoformat(),
            "count": len(analyzed_news),
            "news": analyzed_news
        }
        
        save_daily_news(news_data)
        
        print(f"\n{'='*80}")
        print(f"✅ DAILY NEWS CACHE COMPLETE")
        print(f"   Analyzed: {len(analyzed_news)} stories")
        print(f"   Saved to: {CACHE_FILE}")
        print(f"{'='*80}\n")
        
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
            "POST /search": "Search for headlines about any topic (fast, 1-2s)",
            "POST /analyze": "Get full multi-perspective analysis (30-60s)",
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
    Get top 10 global news with FULL unbiased multi-perspective analysis
    
    Returns cached data from today. Each story includes:
    - Complete analysis with perspectives from both sides
    - Bias scores and indicators
    - Sources with article URLs and supporting information
    - Common facts vs disagreements
    
    Cache is updated once per day on server startup (takes ~5-10 minutes).
    This endpoint is INSTANT - serves fully analyzed cached data only.
    All NewsSource objects include article URLs for verification.
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


@app.post("/search", response_model=SearchResponse)
async def search_topic(request: SearchRequest):
    """
    Search for news headlines about any topic (FAST - just headlines)
    
    - **topic**: Any news topic to search (e.g., "climate change", "AI regulation")
    
    Returns list of headlines. Click on a headline to get full unbiased analysis via /analyze.
    
    This endpoint is FAST (1-2 seconds) and uses minimal API calls.
    For full multi-perspective analysis, use the returned headline with /analyze endpoint.
    """
    
    if agent is None:
        raise HTTPException(
            status_code=503,
            detail="Agent not initialized. Please set GEMINI_API_KEY and TAVILY_API_KEY environment variables."
        )
    
    # Check cache first
    cached_headlines = get_cached_search(request.topic)
    if cached_headlines:
        return SearchResponse(
            topic=request.topic,
            searched_at=datetime.now().isoformat(),
            count=len(cached_headlines),
            headlines=cached_headlines
        )
    
    try:
        # Use Tavily search to get headlines about the topic
        from langchain_tavily import TavilySearch
        
        tavily_key = os.getenv("TAVILY_API_KEY")
        search = TavilySearch(api_key=tavily_key, max_results=10)
        
        print(f"🔍 Searching for: {request.topic}...")
        results = await search.ainvoke(f"latest news about {request.topic}")
        
        # Parse results into headlines
        headlines = []
        
        # Tavily returns a dict with 'results' key containing list of articles
        if isinstance(results, dict) and 'results' in results:
            for item in results['results']:
                if isinstance(item, dict):
                    headlines.append({
                        "headline": item.get('title', '').strip(),
                        "source": item.get('url', '').split('/')[2] if item.get('url') else 'Unknown',
                        "url": item.get('url', '')
                    })
        elif isinstance(results, list):
            # Fallback: if it's a list directly
            for item in results:
                if isinstance(item, dict):
                    headlines.append({
                        "headline": item.get('title', item.get('content', '')[:100]),
                        "source": item.get('source', 'Unknown'),
                        "url": item.get('url', '')
                    })
        elif isinstance(results, str):
            # Parse string response
            lines = results.split('\n')
            for line in lines[:10]:
                if line.strip():
                    headlines.append({
                        "headline": line.strip(),
                        "source": "News",
                        "url": ""
                    })
        
        print(f"✅ Found {len(headlines)} headlines")
        
        # Cache the results
        cache_search_results(request.topic, headlines)
        
        return SearchResponse(
            topic=request.topic,
            searched_at=datetime.now().isoformat(),
            count=len(headlines),
            headlines=headlines
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching for topic '{request.topic}': {str(e)}"
        )


@app.post("/analyze", response_model=NewsAnalysis)
async def analyze_news(request: AnalysisRequest):
    """
    Analyze news from multiple perspectives
    
    - **location**: Geographic location (country, state, city)
    - **topic**: Optional specific topic (if None, finds biggest current news)
    
    Returns comprehensive analysis with:
    - Multiple perspectives (typically opposing viewpoints)
    - Source information with article URLs and bias indicators
    - Who supports each perspective
    - Common facts vs disagreements
    - Social media and independent voices with links
    
    All NewsSource objects include the article URL for verification.
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

