# API Documentation

## Base URL
```
http://localhost:8000
```

---

## Endpoints

### 1. POST /analyze

**Purpose:** Analyze news from multiple perspectives with bias detection

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

### 2. GET /daily-news

**Purpose:** Get top 10 global news headlines (cached daily)

**Processing:** Instant - serves cached data, no API calls

**Cache Behavior:**
- Fetches once per day on server startup
- Returns same data for all calls during the day
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
      "headline": "Breaking: Major political development...",
      "source": "Reuters",
      "url": "https://example.com/article"
    }
  ]
}
```

---

### 3. GET /health

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

### Get Daily Headlines
```javascript
const response = await fetch('http://localhost:8000/daily-news');
const data = await response.json();
console.log(data.news); // Array of 10 headlines
```

### Analyze News
```javascript
const response = await fetch('http://localhost:8000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'United States',
    topic: null  // finds biggest news
  })
});
const analysis = await response.json();
```

---

## Notes

- **Daily News:** Only fetched once per day to save API quota
- **Analysis:** Each analysis makes 5-10 API calls, takes 30-60 seconds
- **Cache:** Restart server to refresh daily news if needed
