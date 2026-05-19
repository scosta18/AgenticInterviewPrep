import asyncio
from playwright.async_api import async_playwright
from core.vectore_store import store_scraped_data
from core.config import get_settings

settings = get_settings()

async def scrape_glassdoor(company_name: str, role: str) -> list:
    "Scrape Glassdoor for interview experience"
    results = []
    query = f"{company_name} {role} interview experience"
    
    url = f"https://www.glassdoor.com/Interview/{company_name.replace(' ', '-')}-Interview-Questions-E0.htm"
    
    print(f"Scraping Glassdoor for:  {query}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await brower.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )    
        page = await context.new_page()
        
        try:
            await page.goto(url, timeout=15000)
            await page.wait_for_timeout(3000)
            
            elements = await page.query_selector_all('.interview-question, .css-1g5a6bg, p')
            for el in elements:
                text = await el.inner_text()
                if text and len(text.strip()) > 50:
                    results.append(text)
                    
        except Exception as e:
            print(f"Error scraping Glassdoor: {e}")
            
        finally:
            await browser.close()
    print(f"✅ Scraped {len(results)} items from Glassdoor")
    return results
    
    
async def scrape_google(company_name: str, role: str) -> list:
    "Scrape Google for interview experience"
    
    results = []
    query = f"{company_name} {role} interview experience"
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()
        
        try:
            await page.goto(url, timeout=15000)
            await page.wait_for_timeout(3000)
            
            
            elements = await page.query_selector_all('VwiC3b, .yXK7lf, span')
            for el in elements[:15]:
                text = await el.inner_text()
                if text and len(text.strip()) > 50:
                    results.append(text)
                    
        except Exception as e:
            print(f"Error scraping Google: {e}")
        
        finally:
            await browser.close()
    
    print(f"✅ Scraped {len(results)} items from Google")
    return results


async def research_company(session_id: int, company_name: str, role: str) -> str:
    """Main research function — scrapes multiple sources and stores in vector DB"""
    print(f"\n Researching {company_name}for {role} role")
    
    glassdoor_data, google_data = await asyncio.gather(
        scrape_glassdoor(company_name, role),
        scrape_google(company_name, role)
        
    )
    
    all_data = glassdoor_data + google_data
    
    if all_data:
        store_scraped_data(session_id, all_data)
        return f"found {len(all_data)} interview insights from the web."
    else:
        return "No web data found. Using job description only."
    
    
def run_research(session_id: int, company_name: str, role:str) -> str:
    """Sync wrapper so FastAPI can call the async scraper"""
    return asyncio.run(research_company(session_id, company_name, role))