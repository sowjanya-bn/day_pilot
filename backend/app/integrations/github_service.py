from datetime import date, timedelta
from typing import Any
import httpx

GITHUB_SEARCH_URL = "https://api.github.com/search/repositories"


async def search_github(topics: list[str], max_results: int = 6) -> list[dict[str, Any]]:
    if not topics:
        return []

    since = (date.today() - timedelta(days=30)).isoformat()
    query = " OR ".join(f"topic:{t.replace(' ', '-').lower()}" for t in topics[:3])
    query += f" created:>{since}"

    timeout = httpx.Timeout(8.0, connect=3.0)
    headers = {"Accept": "application/vnd.github+json"}

    try:
        async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
            resp = await client.get(
                GITHUB_SEARCH_URL,
                params={"q": query, "sort": "stars", "order": "desc", "per_page": max_results},
            )
            resp.raise_for_status()
            items = resp.json().get("items", [])

            results = []
            for item in items:
                results.append(
                    {
                        "title": item.get("full_name", ""),
                        "url": item.get("html_url", ""),
                        "source": "GitHub",
                        "description": item.get("description") or "",
                        "tags": item.get("topics", []),
                        "stars": item.get("stargazers_count", 0),
                    }
                )
            return results
    except Exception:
        return []
