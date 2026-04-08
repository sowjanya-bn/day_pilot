from typing import Any
import httpx

HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search"


async def search_hn(topics: list[str], per_topic: int = 5) -> list[dict[str, Any]]:
    if not topics:
        return []

    timeout = httpx.Timeout(6.0, connect=3.0)
    results: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    async with httpx.AsyncClient(timeout=timeout) as client:
        for topic in topics[:4]:  # cap at 4 topics to avoid hammering
            try:
                resp = await client.get(
                    HN_SEARCH_URL,
                    params={"query": topic, "tags": "story", "hitsPerPage": per_topic},
                )
                resp.raise_for_status()
                hits = resp.json().get("hits", [])

                for hit in hits:
                    url = hit.get("url")
                    title = hit.get("title")
                    if not url or not title or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    results.append(
                        {
                            "title": title,
                            "url": url,
                            "source": "Hacker News",
                            "tags": [],
                            "matched_topic": topic,
                        }
                    )
            except Exception:
                continue

    return results
