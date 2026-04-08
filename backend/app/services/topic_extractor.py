from app.models.context import InputTask

STOPWORDS = {
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "and", "or", "but",
    "fix", "add", "update", "write", "build", "create", "make", "get", "set",
    "use", "run", "test", "check", "review", "work", "with", "from", "into",
    "up", "out", "by", "my", "is", "it", "do", "be", "as", "via", "new",
    "some", "also", "just", "not", "more", "this", "that", "then", "than",
}

LEARNING_KEYWORDS = {
    "learn", "study", "read", "research", "understand", "explore",
    "practice", "course", "tutorial", "guide", "intro", "introduction",
}

# Compound terms recognised before single-word extraction.
# Key: lowercase bigram (space-separated), Value: canonical topic tag.
COMPOUND_TERMS: dict[str, str] = {
    "react native": "react-native",
    "machine learning": "machine-learning",
    "deep learning": "deep-learning",
    "large language": "llm",
    "language model": "llm",
    "node js": "nodejs",
    "next js": "nextjs",
    "vue js": "vuejs",
    "type script": "typescript",
    "data science": "data-science",
    "unit test": "testing",
    "unit tests": "testing",
    "pull request": "code-review",
    "pull requests": "code-review",
    "open source": "open-source",
    "ci cd": "devops",
    "continuous integration": "devops",
    "system design": "system-design",
    "distributed systems": "distributed-systems",
}

CATEGORY_TOPICS: dict[str, list[str]] = {
    "engineering": ["software", "programming"],
    "backend": ["backend", "api", "database"],
    "frontend": ["frontend", "javascript", "css"],
    "mobile": ["mobile", "ios", "android"],
    "data": ["data", "analytics", "python"],
    "career": ["career", "interview"],
    "design": ["design", "ux", "ui"],
    "learning": ["tutorial", "guide"],
    "devops": ["devops", "docker", "kubernetes"],
    "security": ["security", "authentication"],
}


def _extract_compounds(words: list[str], seen: set[str]) -> tuple[list[str], set[int]]:
    """Scan bigrams for known compound terms. Returns matched topics and used indices."""
    found: list[str] = []
    used: set[int] = set()

    for i in range(len(words) - 1):
        bigram = f"{words[i]} {words[i + 1]}"
        tag = COMPOUND_TERMS.get(bigram)
        if tag and tag not in seen:
            seen.add(tag)
            found.append(tag)
            used.add(i)
            used.add(i + 1)

    return found, used


def extract_topics(tasks: list[InputTask]) -> list[str]:
    topics: list[str] = []
    seen: set[str] = set()

    for task in tasks:
        words = [w.strip(".,!?:;\"'()") for w in task.title.lower().split()]

        # compound terms first
        compound_topics, used_indices = _extract_compounds(words, seen)
        topics.extend(compound_topics)

        # remaining single words
        for i, word in enumerate(words):
            if i in used_indices:
                continue
            if word and len(word) > 2 and word not in STOPWORDS and word not in seen:
                seen.add(word)
                topics.append(word)

        # expand from category
        if task.category:
            for mapped in CATEGORY_TOPICS.get(task.category.lower(), []):
                if mapped not in seen:
                    seen.add(mapped)
                    topics.append(mapped)

    return topics[:10]


def has_learning_intent(tasks: list[InputTask]) -> bool:
    for task in tasks:
        words = set(task.title.lower().split())
        if words & LEARNING_KEYWORDS:
            return True
        if task.category and task.category.lower() == "learning":
            return True
    return False
