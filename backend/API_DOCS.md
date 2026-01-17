# API Documentation

## Base URL
```
http://localhost:8000
```

---

## Endpoints

### 1. POST /search

**Purpose:** Search for headlines about any topic (FAST - just headlines)

**Processing Time:** 1-2 seconds (minimal API calls)

**Request:**
```json
{
  "topic": "climate change"  // Any topic you want to search
}
```

**Response:**
```json
{
  "topic": "climate change",
  "searched_at": "2026-01-17T12:34:56",
  "count": 10,
  "headlines": [
    {
      "headline": "UN Climate Summit Reaches Historic Agreement...",
      "source": "Reuters",
      "url": "https://example.com/article"
    }
  ]
}
```

**Workflow:**
1. User enters topic → Get headlines (FAST, 1-2 seconds)
2. User clicks headline → Use `/analyze` for full multi-perspective analysis

**Use Case:** 
- Quick search to see what's happening
- Browse headlines before committing to full analysis
- Save API quota - only analyze what user actually reads

---

### 2. POST /analyze

**Purpose:** Get full unbiased multi-perspective analysis (when user clicks a headline)

**Processing Time:** 30-60 seconds

**Request:**
```json
{
  "location": "United States",
  "topic": "immigration policy"  // optional - if null, finds biggest current news
}
```

**Loading Messages** (display while waiting):
```javascript
const loadingMessages = [
  "🔍 Searching for latest news...",
  "📰 Gathering multiple perspectives...",
  "🏛️ Analyzing political viewpoints...",
  "📊 Detecting bias patterns...",
  "✍️ Structuring analysis..."
];
```
Cycle through these every 5-10 seconds.

**Response:**
```json
{
  "location": "string",
  "topic": "string",
  "headline": "string",
  "date_analyzed": "2026-01-17T12:34:56",
  "perspectives": [
    {
      "side_name": "string",
      "summary": "string",
      "key_claims": ["string"],
      "sources": [
        {
          "name": "string",
          "url": "string",
          "type": "mainstream_media | independent_journalist | social_media | government",
          "political_leaning": "left | center | right | unknown"
        }
      ],
      "supporter_info": {
        "supporters": ["string"],
        "funding_sources": ["string"],
        "ownership": "string"
      },
      "bias_indicators": ["string"],
      "bias_score": 0
    }
  ],
  "common_facts": ["string"],
  "key_disagreements": ["string"],
  "social_media_voices": [
    {
      "name": "string",
      "url": "string",
      "type": "string",
      "political_leaning": "string"
    }
  ],
  "summary": "string",
  "information_quality": "string"
}
```

---

### 3. GET /daily-news

**Purpose:** Get top 10 global news with FULL unbiased multi-perspective analysis (cached daily)

**Processing:** Instant - serves fully analyzed cached data, no API calls

**Cache Behavior:**
- Fetches and ANALYZES top 10 news on server startup (takes ~5-10 minutes)
- Each story gets full unbiased analysis: perspectives, bias scores, sources, both sides
- Returns same fully analyzed data for all calls during the day
- No quota impact on repeated calls

**Request:**
```
GET /daily-news
```

**Response:**
```json
{
  "date": "2026-01-17",
  "fetched_at": "2026-01-17T08:00:00",
  "count": 10,
  "news": [
    {
      "rank": 1,
      "headline": "Breaking: Major political development...",
      "analysis": {
        "location": "Global",
        "topic": "...",
        "headline": "...",
        "perspectives": [ /* Full perspective objects */ ],
        "common_facts": [...],
        "key_disagreements": [...],
        "social_media_voices": [...],
        "summary": "...",
        "information_quality": "..."
      }
    }
  ]
}
```

---

### 4. GET /health

**Purpose:** Health check

**Response:**
```json
{
  "status": "healthy",
  "agent_initialized": true
}
```

---

## Example Usage

### Two-Step Workflow (Recommended for API Quota Efficiency)

**Step 1: Search for headlines**
```javascript
// User enters "climate change" in search box
const searchResponse = await fetch('http://localhost:8000/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic: 'climate change' })
});
const { headlines } = await searchResponse.json();
// Returns 10 headlines in 1-2 seconds
```

**Step 2: User clicks headline → Full analysis**
```javascript
// User clicks on a specific headline
const analysisResponse = await fetch('http://localhost:8000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'Global',
    topic: headlines[0].headline  // The clicked headline
  })
});
const analysis = await analysisResponse.json();
// Returns full multi-perspective analysis in 30-60s
```

### Get Daily Headlines
```javascript
const response = await fetch('http://localhost:8000/daily-news');
const data = await response.json();
console.log(data.news); // Array of 10 headlines
```

### Analyze Location-Based News
```javascript
const response = await fetch('http://localhost:8000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON & Search:** Each request makes 5-10 API calls, takes 30-60 seconds
- **Search vs Analyze:** 
  - Use `/search` for any global topic (e.g., "AI ethics", "climate policy")
  - Use `/analyze` for location-specific news (e.g., California wildfires)
- **Cache:** Restart server to refresh daily news if needed
- **Both Sides:** All endpoints return unbiased multi-perspective analysis
    topic: null  // finds biggest news
  })
});
const analysis = await response.json();
```

---

## Testing with Postman

### 1. Start the Server
```bash
cd backend
uvicorn src.main:app --reload
```
Wait for: `Uvicorn running on http://127.0.0.1:8000`

### 2. Test Endpoints

#### Health Check (Quickest)
- **Method:** `GET`
- **URL:** `http://localhost:8000/health`
- Click **Send**
- Expected: `{"status": "healthy", "agent_initialized": true}`

#### Daily News (Instant)
- **Method:** `GET`
- **URL:** `http://localhost:8000/daily-news`
- Click **Send**
- Returns: 10 cached headlines

#### Search Headlines (1-2 seconds)
- **Method:** `POST`
- **URL:** `http://localhost:8000/search`
- **Headers:** 
  - Key: `Content-Type` 
  - Value: `application/json`
- **Body:** Select `raw` → `JSON`
```json
{
  "topic": "artificial intelligence"
}
```
- Click **Send**
- Returns: 10 headlines about AI

#### Full Analysis (30-60 seconds)
- **Method:** `POST`
- **URL:** `http://localhost:8000/analyze`
- **Headers:** 
  - Key: `Content-Type` 
  - Value: `application/json`
- **Body:** Select `raw` → `JSON`
```json
{
  "location": "United States",
  "topic": "immigration"
}
```
- Click **Send**
- **Wait 30-60 seconds** - watch the terminal for progress
- Returns: Full multi-perspective analysis

**Note:** If you get quota errors, you've hit the 20 API calls/day limit.

---

## Notes

- **Daily News:** 
  - Fetched and FULLY ANALYZED once per day on startup (~5-10 minutes)
  - Each of top 10 stories gets complete unbiased multi-perspective analysis
  - Instant access after startup - no API calls for repeated requests
- **Search:** Fast (1-2s), minimal API usage - just headlines
- **Analysis:** Intensive (30-60s, 5-10 API calls) - only when user clicks
- **Recommended Flow:** 
  1. Homepage → `/daily-news` shows 10 fully analyzed top stories (instant)
  2. Search page → `/search` for headlines, user clicks → `/analyze`
- **Cache:** Restart server to refresh daily news if needed
- **Both Sides:** All analyses return full unbiased multi-perspective breakdown
