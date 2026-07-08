import httpx
import re
import asyncio
import json
from groq import Groq
from core.vector_store import store_scraped_data
import os
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# ── Raw scraper functions ──────────────────────────────────────────────────────

async def scrape_hn(query: str) -> list:
    """Search HackerNews comments"""
    results = []
    url = f"https://hn.algolia.com/api/v1/search?query={query.replace(' ', '+')}&tags=comment&hitsPerPage=15"
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
            response = await c.get(url)
            if response.status_code != 200:
                return results
            for hit in response.json().get("hits", []):
                text = hit.get("comment_text", "") or hit.get("title", "")
                if text and len(text) > 30:
                    results.append(re.sub(r'<[^>]+>', '', text).strip()[:400])
    except Exception as e:
        print(f"⚠️ HN comments search failed: {e}")
    return results


async def scrape_hn_stories(query: str) -> list:
    """Search HackerNews stories"""
    results = []
    url = f"https://hn.algolia.com/api/v1/search?query={query.replace(' ', '+')}&tags=story&hitsPerPage=10"
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
            response = await c.get(url)
            if response.status_code != 200:
                return results
            for hit in response.json().get("hits", []):
                title = hit.get("title", "")
                text = hit.get("story_text", "") or ""
                if title and len(title) > 10:
                    results.append(title)
                if text and len(text) > 50:
                    results.append(re.sub(r'<[^>]+>', '', text).strip()[:400])
    except Exception as e:
        print(f"⚠️ HN stories search failed: {e}")
    return results


async def scrape_remotive(role: str) -> list:
    """Search Remotive for job listings"""
    results = []
    url = f"https://remotive.com/api/remote-jobs?search={role.replace(' ', '+')}&limit=10"
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
            response = await c.get(url)
            if response.status_code != 200:
                return results
            for job in response.json().get("jobs", []):
                desc = job.get("description", "")
                title = job.get("title", "")
                company = job.get("company_name", "")
                if desc and len(desc) > 50:
                    clean = re.sub(r'<[^>]+>', '', desc).strip()
                    results.append(f"{title} at {company}: {clean[:300]}")
    except Exception as e:
        print(f"⚠️ Remotive search failed: {e}")
    return results


# ── Tool executor ──────────────────────────────────────────────────────────────

async def execute_tool(tool_name: str, tool_input: dict) -> str:
    if tool_name == "search_hn_comments":
        results = await scrape_hn(tool_input.get("query", ""))
        return json.dumps(results[:10]) if results else "No results found."
    if tool_name == "search_hn_stories":
        results = await scrape_hn_stories(tool_input.get("query", ""))
        return json.dumps(results[:10]) if results else "No results found."
    if tool_name == "search_remotive":
        results = await scrape_remotive(tool_input.get("role", ""))
        return json.dumps(results[:10]) if results else "No results found."
    return "Unknown tool."


# ── Tool definitions for Groq function calling ─────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_hn_comments",
            "description": "Search HackerNews comments for interview experiences, company culture, and engineering discussions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query e.g. 'Google interview experience' or 'senior engineer interview questions'"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_hn_stories",
            "description": "Search HackerNews stories and articles about companies, engineering culture, and job market trends.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query e.g. 'Google engineering culture' or 'software engineer hiring'"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_remotive",
            "description": "Search Remotive for real job listings to understand required skills and qualifications for a role.",
            "parameters": {
                "type": "object",
                "properties": {
                    "role": {
                        "type": "string",
                        "description": "Job role to search for e.g. 'senior software engineer' or 'data scientist'"
                    }
                },
                "required": ["role"]
            }
        }
    }
]


# ── Research Agent ─────────────────────────────────────────────────────────────

async def research_agent(session_id: int, company_name: str, role: str) -> str:
    print(f"\n🤖 Research agent starting for {company_name} — {role}")

    MAX_ITERATIONS = 4
    all_collected = []

    messages = [
        {
            "role": "system",
            "content": (
                f"You are a research agent preparing interview context for a candidate. "
                f"Your goal is to gather useful, specific insights about interviewing at {company_name} "
                f"for a {role} position. "
                "Use the available tools to search for interview experiences, company culture, "
                "technical expectations, and role-specific skills. "
                "Be strategic — vary your queries to cover different angles. "
                "When you have gathered sufficient context (at least 15-20 useful insights), "
                "stop calling tools and summarize what you found."
            )
        },
        {
            "role": "user",
            "content": (
                f"Research interview context for a {role} position at {company_name}. "
                "Use the search tools to gather relevant insights. "
                "Be thorough but efficient — aim for quality over quantity."
            )
        }
    ]

    for iteration in range(MAX_ITERATIONS):
        print(f"  🔄 Agent iteration {iteration + 1}/{MAX_ITERATIONS}")

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=1000,
            temperature=0.3,
        )

        message = response.choices[0].message
        finish_reason = response.choices[0].finish_reason

        # Build assistant message dict carefully
        assistant_msg = {
            "role": "assistant",
            "content": message.content or "",
        }
        if message.tool_calls:
            assistant_msg["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                }
                for tc in message.tool_calls
            ]
        messages.append(assistant_msg)

        # If no tool calls, agent decided it's done
        if finish_reason == "stop" or not message.tool_calls:
            print(f"  ✅ Agent finished after {iteration + 1} iterations")
            break

        # Execute tool calls
        tool_results = []
        for tool_call in message.tool_calls:
            tool_name = tool_call.function.name
            try:
                tool_input = json.loads(tool_call.function.arguments)
            except Exception:
                tool_input = {}

            print(f"  🔧 Calling {tool_name}: {tool_input}")
            result = await execute_tool(tool_name, tool_input)

            try:
                parsed = json.loads(result)
                if isinstance(parsed, list):
                    all_collected.extend(parsed)
            except Exception:
                pass

            tool_results.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result
            })

        messages.extend(tool_results)

    # Deduplicate and store
    seen = set()
    unique_data = []
    for item in all_collected:
        if isinstance(item, str) and len(item) > 30 and item[:50] not in seen:
            seen.add(item[:50])
            unique_data.append(item)

    if unique_data:
        store_scraped_data(session_id, unique_data)
        print(f"✅ Agent stored {len(unique_data)} unique insights")
        return f"Research agent found {len(unique_data)} interview insights from the web."
    else:
        return "Research agent found no web data. Using job description only."


# ── Public interface (same signature as before) ────────────────────────────────

async def run_research(session_id: int, company_name: str, role: str) -> str:
    return await research_agent(session_id, company_name, role)