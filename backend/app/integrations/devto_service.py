from typing import Any
import httpx

DEVTO_ARTICLES_URL = "https://dev.to/api/articles"


async def search_devto(topics: list[str], per_topic: int = 4) -> list[dict[str, Any]]:
    if not topics:
        return []

    timeout = httpx.Timeout(6.0, connect=3.0)
    results: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    async with httpx.AsyncClient(timeout=timeout) as client:
        for topic in topics[:3]:  # cap to avoid rate limiting
            tag = topic.replace(" ", "").lower()
            try:
                resp = await client.get(
                    DEVTO_ARTICLES_URL,
                    params={"tag": tag, "per_page": per_topic, "state": "fresh"},
                )
                resp.raise_for_status()
                articles = resp.json()

                for article in articles:
                    url = article.get("url")
                    title = article.get("title")
                    if not url or not title or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    results.append(
                        {
                            "title": title,
                            "url": url,
                            "source": "Dev.to",
                            "tags": article.get("tag_list", []),
                            "matched_topic": topic,
                        }
                    )
            except Exception:
                continue

    return results
