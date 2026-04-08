import re
from app.integrations.hn_service import fetch_top_hn_items
from app.models.context import FocusItem, NewsItem

STOPWORDS = {
    "the", "a", "an", "to", "and", "or", "for", "of", "in", "on", "with",
    "clean", "refactor", "read", "docs", "code", "task"
}

def _keywords_from_focus(focus: list[FocusItem]) -> list[str]:
    words: list[str] = []
    for item in focus:
        parts = re.findall(r"[a-zA-Z0-9\-]+", item.title.lower())
        words.extend([p for p in parts if len(p) > 2 and p not in STOPWORDS])
    # preserve order, dedupe
    seen = set()
    result = []
    for w in words:
        if w not in seen:
            seen.add(w)
            result.append(w)
    return result[:8]

def _score_title(title: str, keywords: list[str]) -> int:
    lower = title.lower()
    return sum(1 for kw in keywords if kw in lower)

async def maybe_get_news(
    include_news: bool,
    focus: list[FocusItem],
    max_news: int,
) -> list[NewsItem]:
    if not include_news or not focus or max_news <= 0:
        return []

    keywords = _keywords_from_focus(focus)
    if not keywords:
        return []

    candidates = await fetch_top_hn_items(limit=20)

    ranked = []
    for item in candidates:
        score = _score_title(item["title"], keywords)
        if score > 0:
            ranked.append((score, item))

    ranked.sort(key=lambda x: x[0], reverse=True)
    selected = ranked[:max_news]

    return [
        NewsItem(
            title=item["title"],
            source=item["source"],
            url=item["url"],
            relevance_note=f"Related to {', '.join(keywords[:2])}",
        )
        for _, item in selected
    ]