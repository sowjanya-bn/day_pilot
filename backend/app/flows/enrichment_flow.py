import asyncio
from datetime import date as dt_date
from typing import Any

from app.models.briefing import BriefingRequest, DailySnippet, SnippetItem
from app.integrations.hn_search_service import search_hn
from app.integrations.github_service import search_github
from app.integrations.devto_service import search_devto
from app.services.topic_extractor import extract_topics, has_learning_intent
from app.services.content_ranker import rank_and_split


def _to_snippet_item(item: dict[str, Any], topics: list[str]) -> SnippetItem:
    matched = item.get("matched_topic") or item.get("tags", [""])[0] if item.get("tags") else ""
    if matched and matched in topics:
        note = f"Related to {matched}"
    else:
        # fall back to first overlapping topic
        title_lower = item.get("title", "").lower()
        note_topic = next((t for t in topics if t in title_lower), None)
        note = f"Related to {note_topic}" if note_topic else "Relevant to your day"

    return SnippetItem(
        title=item["title"],
        url=item["url"],
        source=item["source"],
        relevance_note=note,
    )


async def run_enrichment_flow(payload: BriefingRequest) -> DailySnippet:
    target_date = dt_date.fromisoformat(payload.date) if payload.date else dt_date.today()

    topics = extract_topics(payload.tasks)
    learning_day = has_learning_intent(payload.tasks)

    # fan out to all sources in parallel
    hn_results, gh_results, devto_results = await asyncio.gather(
        search_hn(topics),
        search_github(topics),
        search_devto(topics),
    )

    all_content = hn_results + devto_results + gh_results

    max_learn = payload.max_learn + (2 if learning_day else 0)

    learn, pulse, tools = rank_and_split(
        items=all_content,
        topics=topics,
        max_learn=max_learn,
        max_pulse=payload.max_pulse,
        max_tools=payload.max_tools,
    )

    return DailySnippet(
        date=target_date.isoformat(),
        topics=topics,
        learn=[_to_snippet_item(i, topics) for i in learn],
        pulse=[_to_snippet_item(i, topics) for i in pulse],
        tools=[_to_snippet_item(i, topics) for i in tools],
    )
