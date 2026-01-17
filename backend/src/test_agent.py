"""
Quick test script for the News Analysis Agent
"""

import asyncio
import os
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(__file__))

from agent import NewsAnalysisAgent


async def test_agent():
    """Test the agent with a simple query"""
    
    # Load environment variables
    load_dotenv()
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    if not gemini_key:
        print("❌ GEMINI_API_KEY not found in environment")
        print("Get your key from: https://aistudio.google.com/app/apikey")
        return
    
    if not tavily_key:
        print("❌ TAVILY_API_KEY not found in environment")
        print("Get your key from: https://tavily.com/")
        return
    
    print("✅ API keys loaded")
    print("🚀 Initializing agent...")
    
    # Create agent
    agent = NewsAnalysisAgent(
        gemini_api_key=gemini_key,
        tavily_api_key=tavily_key
    )
    
    print("\n" + "="*80)
    print("🧪 TESTING NEWS ANALYSIS AGENT")
    print("="*80)
    
    # Test 1: Find biggest news in a location
    print("\n📍 Test 1: Find biggest news in United States")
    print("-" * 80)
    
    try:
        analysis = await agent.analyze_news(
            location="United States",
            topic=None  # Auto-detect biggest news
        )
        
        print(f"\n✅ Analysis complete!")
        print(f"\n📰 Headline: {analysis.headline}")
        print(f"📍 Location: {analysis.location}")
        print(f"📅 Date: {analysis.date_analyzed}")
        
        print(f"\n🎯 Found {len(analysis.perspectives)} perspectives:")
        for i, persp in enumerate(analysis.perspectives, 1):
            print(f"\n  {i}. {persp.side_name}")
            print(f"     Bias Score: {persp.bias_score}/10")
            print(f"     Summary: {persp.summary[:150]}...")
            print(f"     Sources: {len(persp.sources)}")
            
        print(f"\n📊 Common Facts: {len(analysis.common_facts)}")
        print(f"⚔️  Key Disagreements: {len(analysis.key_disagreements)}")
        print(f"📱 Social Media Voices: {len(analysis.social_media_voices)}")
        
        print(f"\n📝 Summary:")
        print(f"{analysis.summary[:300]}...")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Test 2: Specific topic
    print("\n" + "="*80)
    print("\n📍 Test 2: Analyze specific topic")
    print("-" * 80)
    
    try:
        analysis = await agent.analyze_news(
            location="California",
            topic="immigration policy"
        )
        
        print(f"\n✅ Analysis complete!")
        print(f"📰 Topic: {analysis.topic}")
        print(f"🎯 Perspectives: {', '.join([p.side_name for p in analysis.perspectives])}")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
    
    print("\n" + "="*80)
    print("✅ TESTING COMPLETE")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(test_agent())
