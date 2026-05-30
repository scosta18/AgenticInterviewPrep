import httpx
import re
import asyncio
from core.vector_store import store_scraped_data

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

async def scrape_hn(query: str) -> list:
    """Search HackerNews — open API, never blocks"""
    results = []
    url = f"https://hn.algolia.com/api/v1/search?query={query.replace(' ', '+')}&tags=comment&hitsPerPage=15"

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url)

            if response.status_code != 200:
                return results

            data = response.json()
            hits = data.get("hits", [])

            for hit in hits:
                text = hit.get("comment_text", "") or hit.get("title", "")
                if text and len(text) > 30:
                    clean = re.sub(r'<[^>]+>', '', text).strip()
                    results.append(clean[:400])

    except Exception as e:
        print(f"⚠️ HackerNews search failed: {e}")

    return results

async def scrape_hn_stories(query: str) -> list:
    """Search HackerNews stories specifically"""
    results = []
    url = f"https://hn.algolia.com/api/v1/search?query={query.replace(' ', '+')}&tags=story&hitsPerPage=10"

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url)

            if response.status_code != 200:
                return results

            data = response.json()
            hits = data.get("hits", [])

            for hit in hits:
                title = hit.get("title", "")
                text = hit.get("story_text", "") or ""
                if title and len(title) > 10:
                    results.append(title)
                if text and len(text) > 50:
                    clean = re.sub(r'<[^>]+>', '', text).strip()
                    results.append(clean[:400])

    except Exception as e:
        print(f"⚠️ HackerNews stories search failed: {e}")

    return results

async def scrape_remotive(company_name: str, role: str) -> list:
    """Search Remotive API — open, no auth needed"""
    results = []
    url = f"https://remotive.com/api/remote-jobs?search={role.replace(' ', '+')}&limit=10"

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url)

            if response.status_code != 200:
                return results

            data = response.json()
            jobs = data.get("jobs", [])

            for job in jobs:
                desc = job.get("description", "")
                title = job.get("title", "")
                company = job.get("company_name", "")
                if desc and len(desc) > 50:
                    clean = re.sub(r'<[^>]+>', '', desc).strip()
                    results.append(f"{title} at {company}: {clean[:300]}")

    except Exception as e:
        print(f"⚠️ Remotive search failed: {e}")

    return results

async def research_company(session_id: int, company_name: str, role: str) -> str:
    print(f"\n🔎 Researching {company_name} for {role} role")

    # Run multiple HN queries + Remotive concurrently
    hn_company, hn_role, hn_interview, hn_stories, remotive = await asyncio.gather(
        scrape_hn(f"{company_name} interview"),
        scrape_hn(f"{role} interview experience"),
        scrape_hn(f"{company_name} {role}"),
        scrape_hn_stories(f"{company_name} software engineering"),
        scrape_remotive(company_name, role)
    )

    all_data = hn_company + hn_role + hn_interview + hn_stories + remotive

    # Deduplicate
    seen = set()
    unique_data = []
    for item in all_data:
        if item[:50] not in seen:
            seen.add(item[:50])
            unique_data.append(item)

    if unique_data:
        store_scraped_data(session_id, unique_data)
        print(f"✅ Stored {len(unique_data)} unique insights")
        return f"Found {len(unique_data)} interview insights from the web."
    else:
        return "No web data found. Using job description only."

async def run_research(session_id: int, company_name: str, role: str) -> str:
    return await research_company(session_id, company_name, role)