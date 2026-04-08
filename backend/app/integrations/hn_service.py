from typing import Any
import httpx

HN_TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/{item_id}.json"


async def fetch_top_hn_items(limit: int = 20) -> list[dict[str, Any]]:
    timeout = httpx.Timeout(6.0, connect=3.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        ids_resp = await client.get(HN_TOP_URL)
        ids_resp.raise_for_status()
        ids = ids_resp.json()[:limit]

        items: list[dict[str, Any]] = []
        for item_id in ids:
            item_resp = await client.get(HN_ITEM_URL.format(item_id=item_id))
            item_resp.raise_for_status()
            data = item_resp.json()

            if not data:
                continue

            title = data.get("title")
            url = data.get("url")
            item_type = data.get("type")

            if item_type == "story" and title and url:
                items.append(
                    {
                        "title": title,
                        "url": url,
                        "source": "Hacker News",
                    }
                )

        return items