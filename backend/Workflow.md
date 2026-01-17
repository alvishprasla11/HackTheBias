# System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                │
│  "Find opposing views on biggest news in United States"             │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                                │
│                    (backend/src/main.py)                            │
│                                                                     │
│  POST /analyze                                                      │
│  {                                                                  │
│    "location": "United States",                                     │
│    "topic": null                                                    │
│  }                                                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   NEWS ANALYSIS AGENT                               │
│                   (backend/src/agent.py)                            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ STEP 1: Find Biggest News                               │        │
│  │ ────────────────────────────────────────────────────    │        │
│  │ Agent searches web for breaking news in location        │        │
│  │ Returns: "Supreme Court ruling on..."                   │        │
│  └───────────────────────┬─────────────────────────────────┘        │
│                          ↓                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ STEP 2: Identify Opposing Perspectives                  │        │
│  │ ────────────────────────────────────────────────────    │        │
│  │ Analyzes the story to find main conflicts               │        │
│  │ Returns: ["Liberal Position", "Conservative Position"]  │        │
│  └───────────────────────┬─────────────────────────────────┘        │
│                          ↓                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ STEP 3: Research Each Perspective (PARALLEL)            │        │
│  │ ────────────────────────────────────────────────────    │        │
│  │                                                         │        │
│  │ For "Liberal Position":          For "Conservative":    │        │
│  │ • Search for sources             • Search for sources   │        │
│  │ • Extract key claims             • Extract key claims   │        │
│  │ • Find supporters                • Find supporters      │        │
│  │ • Track funding                  • Track funding        │        │
│  │ • Detect bias                    • Detect bias          │        │
│  │ • Score bias (0-10)              • Score bias (0-10)    │        │
│  │                                                         │        │
│  │ Returns:                         Returns:               │        │
│  │ Perspective {                    Perspective {          │        │
│  │   sources: [MSNBC, CNN],           sources: [Fox, WSJ], │        │
│  │   supporters: [Dems],              supporters: [GOP],   │        │
│  │   bias_score: 6.5                  bias_score: 7.2      │        │
│  │ }                                }                      │        │
│  └───────────────────────┬─────────────────────────────────┘        │
│                          ↓                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ STEP 4: Find Social Media Voices                        │        │
│  │ ────────────────────────────────────────────────────    │        │
│  │ Search for independent journalists on:                  │        │
│  │ • Twitter/X                                             │        │
│  │ • TikTok                                                │        │
│  │ • Instagram                                             │        │
│  │ • YouTube                                               │        │
│  │ Returns: List of independent sources                    │        │
│  └───────────────────────┬─────────────────────────────────┘        │
│                          ↓                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ STEP 5: Compare & Analyze                               │        │
│  │ ────────────────────────────────────────────────────    │        │
│  │ • What facts do all sides agree on?                     │        │
│  │ • What are the key disagreements?                       │        │
│  │ • How reliable is the information?                      │        │
│  │ • Generate neutral summary                              │        │
│  └───────────────────────┬─────────────────────────────────┘        │
│                          ↓                                          │
└──────────────────────────┼──────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     STRUCTURED OUTPUT                               │
│                                                                     │
│  NewsAnalysis {                                                     │
│    location: "United States"                                        │
│    topic: "Supreme Court ruling on..."                              │
│    headline: "Supreme Court Decision Sparks Debate"                 │
│    date_analyzed: "2026-01-17T..."                                  │
│                                                                     │
│    perspectives: [                                                  │
│      {                                                              │
│        side_name: "Liberal Position"                                │
│        summary: "Decision threatens established rights..."          │
│        sources: [                                                   │
│          {name: "MSNBC", url: "...", leaning: "left"}               │
│          {name: "CNN", url: "...", leaning: "center-left"}          │
│        ]                                                            │
│        supporter_info: {                                            │
│          supporters: ["Democratic Party", "ACLU"]                   │
│          funding: ["Liberal donors"]                                │
│          ownership: "Comcast/NBCUniversal"                          │
│        }                                                            │
│        bias_indicators: ["Emotional language", "Omits context"]     │
│        bias_score: 6.5                                              │
│      },                                                             │
│      {                                                              │
│        side_name: "Conservative Position"                           │
│        summary: "Decision restores constitutional balance..."        │
│        sources: [...]                                                │
│        supporter_info: {...}                                         │
│        bias_score: 7.2                                               │
│      }                                                               │
│    ]                                                                 │
│                                                                       │
│    common_facts: [                                                   │
│      "Supreme Court ruled 6-3",                                      │
│      "Decision overturns previous ruling"                            │
│    ]                                                                 │
│                                                                       │
│    key_disagreements: [                                              │
│      "Impact on individual rights",                                  │
│      "Constitutional interpretation"                                 │
│    ]                                                                 │
│                                                                       │
│    social_media_voices: [...]                                        │
│    summary: "..."                                                    │
│    information_quality: "High - multiple verified sources"           │
│  }                                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND DISPLAY                                │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐                         │
│  │ Liberal View     │  │ Conservative View│                         │
│  │ ──────────────── │  │ ──────────────── │                         │
│  │ Bias: 6.5/10    │  │ Bias: 7.2/10    │                         │
│  │ Sources: 5      │  │ Sources: 4      │                         │
│  │ Supporters:     │  │ Supporters:     │                         │
│  │ • Democrats     │  │ • Republicans   │                         │
│  │ • ACLU          │  │ • Heritage Fdn  │                         │
│  └──────────────────┘  └──────────────────┘                         │
│                                                                       │
│  Common Ground:                                                      │
│  ✓ Supreme Court ruled 6-3                                           │
│  ✓ Decision overturns precedent                                      │
│                                                                       │
│  Disagreements:                                                      │
│  ⚔️ Impact on rights                                                 │
│  ⚔️ Constitutional interpretation                                    │
└─────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                    TECHNICAL COMPONENTS
═══════════════════════════════════════════════════════════════════════

┌─────────────────┐
│  GEMINI 2.0     │  AI Reasoning & Analysis
│  FLASH          │  • Understands queries
└────────┬────────┘  • Processes search results
         │           • Detects bias
         │           • Structures output
         ↓
┌─────────────────┐
│  LANGCHAIN      │  Orchestration Layer
│                 │  • Agent creation
└────────┬────────┘  • Tool calling
         │           • Prompt management
         │           • Chain execution
         ↓
┌─────────────────┐
│  TAVILY API     │  Internet Access
│                 │  • Real-time web search
└────────┬────────┘  • News article retrieval
         │           • Source discovery
         │           • Content extraction
         ↓
┌─────────────────┐
│  PYDANTIC       │  Data Validation
│                 │  • Type safety
└─────────────────┘  • Structure enforcement
                     • Auto-validation
                     • JSON serialization


═══════════════════════════════════════════════════════════════════════
                    DATA FLOW
═══════════════════════════════════════════════════════════════════════

USER → FastAPI → Agent → Gemini → Tavily → Web
                   ↓                ↓
                   ←────────────────┘
                   ↓
              Process Results
                   ↓
              Structure Data
                   ↓
         Return NewsAnalysis
                   ↓
             User/Frontend


═══════════════════════════════════════════════════════════════════════
                    KEY FEATURES
═══════════════════════════════════════════════════════════════════════

✅ Multi-Perspective Analysis
   • Automatically finds opposing viewpoints
   • Not limited to left/right - finds actual conflicts

✅ Source Transparency
   • Tracks ownership (Comcast, NewsCorp, etc)
   • Identifies funding sources
   • Shows political supporters

✅ Bias Detection
   • Detects loaded language
   • Identifies omissions
   • Scores bias 0-10
   • Explains indicators

✅ Independent Voices
   • Finds social media perspectives
   • Includes citizen journalists
   • Platform-agnostic (Twitter, TikTok, etc)

✅ Common Ground Finding
   • Extracts agreed-upon facts
   • Highlights disagreements
   • Provides neutral context

✅ Location-Aware
   • Works at country/state/city level
   • Finds local news sources
   • Respects regional perspectives
```
