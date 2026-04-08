from typing import Any

LEARN_SIGNALS = {
    "tutorial", "guide", "how to", "how-to", "introduction", "intro",
    "getting started", "learn", "beginner", "explained", "deep dive",
    "understanding", "course", "lesson", "walkthrough",
}

TOOL_SIGNALS = {
    "library", "framework", "sdk", "cli", "tool", "package",
    "open source", "open-source", "release", "v1", "v2",
}


def _score(item: dict[str, Any], topics: list[str]) -> float:
    text = (
        item.get("title", "") + " " +
        item.get("description", "") + " " +
        " ".join(item.get("tags", []))
    ).lower()

    score = 0.0
    for topic in topics:
        if topic.lower() in text:
            score += 1.0

    # boost for exact match in title
    title = item.get("title", "").lower()
    for topic in topics:
        if topic.lower() in title:
            score += 0.5

    return score


def _is_learn_content(item: dict[str, Any]) -> bool:
    text = (item.get("title", "") + " " + " ".join(item.get("tags", []))).lower()
    return any(signal in text for signal in LEARN_SIGNALS)


def _is_tool_content(item: dict[str, Any]) -> bool:
    if item.get("source") == "GitHub":
        return True
    text = (item.get("title", "") + " " + item.get("description", "")).lower()
    return any(signal in text for signal in TOOL_SIGNALS)


def rank_and_split(
    items: list[dict[str, Any]],
    topics: list[str],
    max_learn: int = 5,
    max_pulse: int = 5,
    max_tools: int = 3,
) -> tuple[list[dict], list[dict], list[dict]]:
    seen_urls: set[str] = set()
    unique: list[dict[str, Any]] = []

    for item in items:
        url = item.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            item["_score"] = _score(item, topics)
            unique.append(item)

    ranked = sorted(unique, key=lambda x: x["_score"], reverse=True)

    learn: list[dict] = []
    tools: list[dict] = []
    pulse: list[dict] = []

    for item in ranked:
        if _is_tool_content(item) and len(tools) < max_tools:
            tools.append(item)
        elif _is_learn_content(item) and len(learn) < max_learn:
            learn.append(item)
        elif len(pulse) < max_pulse:
            pulse.append(item)

    return learn, pulse, tools
