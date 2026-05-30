import httpx
from core.vector_store import store_scraped_data

async def scrape_google(company_name: str, role: str) -> list:
    """Search Google for interview experiences using httpx"""
    results = []
    query = f"{company_name} {role} interview questions experience"
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    print(f"🔍 Searching for: {query}")

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            text = response.text

            # Extract text snippets between common Google result tags
            import re
            snippets = re.findall(r'<span[^>]*>([^<]{50,300})</span>', text)
            for snippet in snippets[:15]:
                clean = re.sub(r'<[^>]+>', '', snippet).strip()
                if len(clean) > 40:
                    results.append(clean)

    except Exception as e:
        print(f"⚠️ Search failed: {e}")

    print(f"Found {len(results)} search snippets")
    return results

async def scrape_reddit(company_name: str, role: str) -> list:
    """Search Reddit for interview experiences"""
    results = []
    query = f"{company_name} {role} interview"
    url = f"https://www.reddit.com/search.json?q={query.replace(' ', '+')}&sort=relevance&limit=10"

    headers = {
        "User-Agent": "InterviewPrepAI/1.0"
    }

    print(f"🔍 Searching Reddit for: {query}")

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            data = response.json()

            posts = data.get("data", {}).get("children", [])
            for post in posts:
                post_data = post.get("data", {})
                title = post_data.get("title", "")
                selftext = post_data.get("selftext", "")

                if title and len(title) > 10:
                    results.append(title)
                if selftext and len(selftext) > 50:
                    results.append(selftext[:500])

    except Exception as e:
        print(f"⚠️ Reddit search failed: {e}")

    print(f"Found {len(results)} Reddit posts")
    return results

async def research_company(session_id: int, company_name: str, role: str) -> str:
    """Main research function"""
    print(f"\n🔎 Researching {company_name} for {role} role")

    import asyncio
    google_data, reddit_data = await asyncio.gather(
        scrape_google(company_name, role),
        scrape_reddit(company_name, role)
    )

    all_data = google_data + reddit_data

    if all_data:
        store_scraped_data(session_id, all_data)
        return f"Found {len(all_data)} interview insights from the web."
    else:
        return "No web data found. Using job description only."

async def run_research(session_id: int, company_name: str, role: str) -> str:
    return await research_company(session_id, company_name, role)