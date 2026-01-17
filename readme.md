# All-in-One Unbiased News Platform

## HackTheBias Hackathon Submission

A revolutionary news platform that mitigates knowledge bias and cognitive bias while amplifying silenced voices of independent journalists and oppressed news organizations. We cut through the noise created by powerful entities and surface authentic perspectives that challenge dominant narratives.

**Hackathon:** HackTheBias  
**Challenge:** Creating technology solutions that combat information bias and promote truth

---

## The Problem

**Knowledge Bias** - Powerful media conglomerates control what stories get coverage, creating systematic gaps in our understanding. Geographic bias favors Western perspectives while marginalizing Global South voices. Structural blindspots exclude narratives that challenge power.

**Cognitive Bias** - Algorithms create filter bubbles, confirmation bias traps us in echo chambers, and framing effects manipulate our perception. Repeated narratives from major outlets become "truth" through sheer repetition.

**The Noise and Silence Gap** - Powerful entities flood the landscape with corporate propaganda, state-sponsored narratives, and PR journalism, while independent journalists, whistleblowers, and community-led media struggle for visibility and are usally silenced.

---

## Our Solution: "Amplify the Silenced, Question the Powerful"

We don't just present "both sides" - we actively **filter out power-backed noise** and **amplify marginalized voices**.

### Core Approach

**Mitigating Knowledge Bias:** Surface perspectives from underrepresented regions, break geographic monopolies, highlight suppressed stories, fill systematic gaps in mainstream coverage.

**Combating Cognitive Bias:** Expose framing techniques through side-by-side comparison, break filter bubbles, elevate underreported stories, teach users to recognize manipulation in real-time.

**Filtering Power's Noise:** Flag content funded by corporations/governments, track ownership and conflicts of interest, detect propaganda campaigns, deprioritize PR journalism.

**Amplifying Silenced Voices:** Partner with independent journalists in conflict zones, elevate news organizations serving marginalized communities, translate non-English reporting, direct traffic and revenue to underfunded truth-tellers.

---

## Sustainability & Reducing Inequalities

This platform creates a **sustainable model for informational justice** by redistributing power in the media ecosystem:

**Economic Sustainability:**
- Directs revenue and attention away from corporate media toward independent journalists
- Provides sustainable income streams for oppressed news organizations  
- Creates market value for authentic reporting over sensationalism
- Reduces dependency on advertising that compromises editorial independence

**Reducing Information Inequality:**
- Breaks down barriers between Global North and Global South journalism
- Gives equal platform to under-resourced outlets and well-funded corporations
- Eliminates language barriers through translation infrastructure
- Ensures marginalized communities see their realities reflected in news coverage

**Long-term Impact:**
- Builds infrastructure that survives beyond profit motives
- Creates accountability systems that protect journalists at risk
- Develops cognitive resistance in populations to propaganda
- Democratizes who gets to shape public discourse

By changing **who benefits** from news consumption, we make truth-telling economically viable and reduce the information gap between the powerful and the marginalized.

---

## Key Features

**Voice Amplification** - Algorithm prioritizes independent sources, automatic translation, equal visibility for grassroots outlets

**Power Filter** - Identifies corporate/state narratives, tracks ownership, detects propaganda, warns about conflicts of interest

**Cognitive Bias Tools** - Side-by-side framing analysis, interactive bias training, logical fallacy detection

**Knowledge Gap Mapper** - Identifies suppressed stories, highlights systematic coverage gaps, surfaces missing perspectives

---

## Technology Stack

- **Backend:** Python FastAPI with AI agent for multi-perspective news analysis
- **Frontend:** Next.js web interface
- **AI/ML:** 
  - Gemini 2.0 Flash for natural language understanding
  - LangChain for agent orchestration
  - Tavily for real-time web search (gives AI internet access)
  - Pydantic for structured data validation
- **Agent Capabilities:**
  - Finds biggest news stories by location
  - Identifies opposing perspectives (political, ideological, conflict-based)
  - Analyzes bias and tracks source ownership/funding
  - Discovers independent journalists and social media voices
  - Compares perspectives to find common facts vs disagreements

---

## How to Run

### Backend Setup

1. **Get API Keys (Free)**
   - Gemini: https://aistudio.google.com/app/apikey
   - Tavily: https://tavily.com/ (1000 free searches/month)

2. **Install and Configure**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Copy environment template
   cp .env.example .env
   
   # Edit .env and add your API keys
   nano .env
   ```

3. **Run the API**
   ```bash
   # Start FastAPI server
   uvicorn src.main:app --reload --port 8000
   
   # Or test agent directly
   python src/test_agent.py
   ```

4. **Test the API**
   ```bash
   # Health check
   curl http://localhost:8000/health
   
   # Analyze news
   curl -X POST http://localhost:8000/analyze \
     -H "Content-Type: application/json" \
     -d '{"location": "United States", "topic": null}'
   ```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

**Frontend:** http://localhost:3000  
**Backend API:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

For detailed agent architecture and workflow, see [backend/AGENT_GUIDE.md](backend/AGENT_GUIDE.md)

The frontend will be available at `http://localhost:3000`

---

*"Amplify the Silenced, Question the Powerful"*

We're not here to be neutral. We're here to level the playing field.

**HackTheBias Hackathon** - Because truth doesn't come from those who benefit from lies.