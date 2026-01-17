"""
Multi-Perspective News Analysis Agent
Finds opposing viewpoints on major news stories and analyzes bias/support
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_tavily import TavilySearch
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from langgraph.checkpoint.memory import InMemorySaver
import os
import time


# ============= OUTPUT STRUCTURES =============

class NewsSource(BaseModel):
    """Information about a news source"""
    name: str = Field(description="Name of the news organization or platform")
    url: str = Field(description="URL to the article or source")
    type: str = Field(description="Type: 'mainstream_media', 'independent_journalist', 'social_media', 'government'")
    political_leaning: str = Field(description="Political leaning: 'left', 'center', 'right', 'unknown'")
    

class SupporterInfo(BaseModel):
    """Who supports or funds this source"""
    supporters: List[str] = Field(description="List of supporters (political parties, governments, corporations)")
    funding_sources: List[str] = Field(description="Known funding sources")
    ownership: str = Field(description="Who owns or controls this outlet")


class Perspective(BaseModel):
    """One side of the story"""
    side_name: str = Field(description="Name of this perspective (e.g., 'Pro-Government', 'Opposition', 'Left-Wing', 'Right-Wing')")
    summary: str = Field(description="Summary of this perspective's main arguments and framing")
    key_claims: List[str] = Field(description="Key claims made by this side")
    sources: List[NewsSource] = Field(description="News sources presenting this perspective")
    supporter_info: SupporterInfo = Field(description="Who supports these sources")
    bias_indicators: List[str] = Field(description="Detected bias indicators (loaded language, omissions, framing)")
    bias_score: float = Field(description="Bias score from 0 (neutral) to 10 (highly biased)")


class NewsAnalysis(BaseModel):
    """Complete analysis of a news story from multiple perspectives"""
    location: str = Field(description="Geographic location (country, state, city)")
    topic: str = Field(description="Main news topic being analyzed")
    headline: str = Field(description="Neutral headline summarizing the story")
    date_analyzed: str = Field(description="When this analysis was performed")
    
    perspectives: List[Perspective] = Field(description="Different perspectives on this story (minimum 2)")
    
    common_facts: List[str] = Field(description="Facts agreed upon by all sides")
    key_disagreements: List[str] = Field(description="Main points of disagreement between sides")
    
    social_media_voices: List[NewsSource] = Field(description="Independent journalists and social media perspectives")
    
    summary: str = Field(description="Neutral summary explaining the situation and different viewpoints")
    information_quality: str = Field(description="Assessment of information quality and reliability")


# ============= AGENT CONFIGURATION =============

# Comprehensive system prompt that guides the agent through the entire analysis
SYSTEM_PROMPT = """You are an expert news analyst specializing in multi-perspective analysis and bias detection.

Your task is to analyze news stories from multiple opposing viewpoints and provide a comprehensive, balanced analysis.

WORKFLOW - Follow these steps in order:

1. FIND THE NEWS:
   - If no topic is provided, search for the biggest current news story in the specified location
   - If a topic is provided, search for details about that specific story
   - Determine the main topic/headline

2. IDENTIFY OPPOSING PERSPECTIVES:
   - Identify the TWO main opposing sides/perspectives on this story
   - These could be: political parties, ideological positions, stakeholders, etc.
   - Name each perspective clearly (e.g., "Liberal Position", "Conservative Position")
   - Create a neutral headline for the story

3. RESEARCH EACH PERSPECTIVE (do this for BOTH perspectives):
   For each perspective, search and find:
   - At least 3-5 news sources representing this view
   - **IMPORTANT: For each source, include the full article URL**
   - Their main arguments and key claims
   - Who supports/funds these sources (political parties, corporations, governments)
   - Media ownership information
   - Bias indicators (loaded language, emotional appeals, omissions, selective facts)
   - Assign a bias score from 0 (neutral) to 10 (highly biased)

4. FIND INDEPENDENT VOICES:
   - Search for independent journalists and social media voices
   - Look for citizen journalists, grassroots media, non-mainstream perspectives
   - Include platforms like Twitter/X, TikTok, YouTube, Instagram
   - **IMPORTANT: Include URLs for all sources**

5. COMPARE AND SYNTHESIZE:
   - Identify facts that all sides agree on (common ground)
   - Identify key points of disagreement
   - Assess overall information quality and reliability
   - Provide a balanced, neutral summary
API call counter
        self.api_counter = APICallCounter()
        
        # Initialize Gemini LLM
        llm = ChatGoogleGenerativeAI(
            model="gemini-flash-lite-latest",
            google_api_key=gemini_api_key,
            temperature=0.3,
            callbacks=[self.api_counter]- aim for comprehensive coverage in minimal searches
- Remain objective and balanced - don't favor any perspective
- Focus on factual analysis, not opinions

Return your complete analysis in the structured format provided."""

class NewsAnalysisAgent:
    """Agent that analyzes news from multiple perspectives"""
    
    def __init__(self, gemini_api_key: str, tavily_api_key: str):
        """Initialize the agent with API keys"""
        
        # Initialize Gemini LLM
        llm = ChatGoogleGenerativeAI(
            model="gemini-flash-lite-latest",
            google_api_key=gemini_api_key,
            temperature=0.3,
        )
        
        # Initialize web search tool
        search_tool = TavilySearch(
            api_key=tavily_api_key,
            max_results=10
        )
        
        # Initialize memory/checkpointer
        checkpointer = InMemorySaver()
        
        # Create ONE agent that does research
        self.agent = create_agent(
            model=llm,
            tools=[search_tool],
            system_prompt=SYSTEM_PROMPT,
            checkpointer=checkpointer
        )
        
        # Separate model with structured output for final parsing
        self.structured_model = llm.with_structured_output(NewsAnalysis)
    
    
    async def analyze_news(self, location: str, topic: Optional[str] = None) -> NewsAnalysis:
        """
        Main method to analyze news from multiple perspectives
        
        Args:
            location: Geographic location (e.g., "United States", "California", "New York City")
            topic: Optional specific topic. If None, finds biggest current news in location
        
        Returns:
            NewsAnalysis: Complete analysis with multiple perspectives
        """
        from datetime import datetime
        
        # Start timer
        start_time = time.time()
        
        # Prepare the query for the agent
        if topic:
            query = f"Analyze the news story about '{topic}' in {location}. Provide a complete multi-perspective analysis. IMPORTANT: Include the full article URL for every news source you cite."
        else:
            query = f"Find the biggest current news story in {location} and provide a complete multi-perspective analysis. IMPORTANT: Include the full article URL for every news source you cite."
        
        print(f"\n{'='*80}")
        print(f"🔍 Analyzing news in {location}...")
        print(f"⏱️  Started at: {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'='*80}\n")
        
        # Use a unique thread_id for this analysis
        config = {"configurable": {"thread_id": f"{location}_{datetime.now().timestamp()}"}}
        
        # Single agent call - it orchestrates everything internally
        result = await self.agent.ainvoke(
            {"messages": [{"role": "user", "content": query}]},
            config=config
        )
        
        # Get the agent's research output
        research_output = result['messages'][-1].content
        
        print(f"\n📊 Structuring analysis...")
        
        # Parse into structured format with a single LLM call
        analysis = await self.structured_model.ainvoke([
            {"role": "system", "content": "You are a data structuring assistant. Convert the news analysis into the required NewsAnalysis format. Be accurate and preserve all information. CRITICAL: Ensure all NewsSource objects include their full article URLs - do not omit or leave URLs empty."},
            {"role": "user", "content": f"Location: {location}\n\nAnalysis:\n{research_output}"}
        ])
        
        # Ensure date_analyzed is set
        if not analysis.date_analyzed:
            analysis.date_analyzed = datetime.now().isoformat()
        
        # Calculate total time
        total_time = time.time() - start_time
        
        # Print metrics
        print(f"\n{'='*80}")
        print(f"✅ Analysis complete!")
        print(f"⏱️  Total time: {total_time:.2f}s ({total_time/60:.2f} minutes)")
        print(f"{'='*80}\n")
        
        return analysis


# ============= EXAMPLE USAGE =============

async def main():
    """Example usage of the NewsAnalysisAgent"""
    
    # Get API keys from environment
    gemini_key = os.getenv("GEMINI_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    if not gemini_key or not tavily_key:
        print("⚠️  Please set GEMINI_API_KEY and TAVILY_API_KEY environment variables")
        return
    
    # Create agent
    agent = NewsAnalysisAgent(
        gemini_api_key=gemini_key,
        tavily_api_key=tavily_key
    )
    
    # Analyze news
    analysis = await agent.analyze_news(
        location="United States",
        topic=None  # Will find biggest current news
        # topic="immigration policy"  # Or specify a topic
    )
    
    # Print results
    print("\n" + "="*80)
    print(f"📰 {analysis.headline}")
    print(f"📍 Location: {analysis.location}")
    print(f"📅 Analyzed: {analysis.date_analyzed}")
    print("="*80)
    
    for persp in analysis.perspectives:
        print(f"\n🎯 {persp.side_name}")
        print(f"   Bias Score: {persp.bias_score}/10")
        print(f"   Summary: {persp.summary}")
        print(f"   Sources: {len(persp.sources)} sources")
        print(f"   Supporters: {', '.join(persp.supporter_info.supporters)}")
    
    print(f"\n📊 Summary:\n{analysis.summary}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
