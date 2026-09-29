"""Retrieval behind a tiny interface.

`KeywordRetriever` (BM25 over paragraphs) is enough for a small business knowledge base and has no
dependencies. When a client outgrows it, implement `Retriever` with embeddings and pass that
instead: agents only call `search()`.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

WORD = re.compile(r"[a-z0-9]+")


@dataclass(frozen=True)
class Chunk:
    source: str  # file name the text came from
    text: str


class Retriever(Protocol):
    def search(self, query: str, k: int = 4) -> list[Chunk]: ...


def load_chunks(kb_dir: str | Path) -> list[Chunk]:
    """One chunk per paragraph (blank-line separated) of every .txt / .md file in `kb_dir`."""
    chunks: list[Chunk] = []
    for path in sorted(Path(kb_dir).glob("*")):
        if path.suffix not in {".txt", ".md"}:
            continue
        for para in re.split(r"\n\s*\n", path.read_text(encoding="utf8")):
            if para.strip():
                chunks.append(Chunk(path.name, para.strip()))
    return chunks


class KeywordRetriever:
    def __init__(self, chunks: list[Chunk], k1: float = 1.5, b: float = 0.75):
        self.chunks = chunks
        self.k1, self.b = k1, b
        self.tokens = [WORD.findall(c.text.lower()) for c in chunks]
        self.avg_len = (sum(len(t) for t in self.tokens) / len(self.tokens)) if self.tokens else 0.0
        df: Counter[str] = Counter()
        for toks in self.tokens:
            df.update(set(toks))
        n = len(chunks)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}

    def search(self, query: str, k: int = 4) -> list[Chunk]:
        q = WORD.findall(query.lower())
        scored: list[tuple[float, int]] = []
        for i, toks in enumerate(self.tokens):
            if not toks:
                continue
            tf = Counter(toks)
            score = 0.0
            for term in q:
                if term in tf:
                    f = tf[term]
                    score += self.idf.get(term, 0.0) * f * (self.k1 + 1) / (
                        f + self.k1 * (1 - self.b + self.b * len(toks) / (self.avg_len or 1))
                    )
            if score > 0:
                scored.append((score, i))
        scored.sort(reverse=True)
        return [self.chunks[i] for _, i in scored[:k]]
