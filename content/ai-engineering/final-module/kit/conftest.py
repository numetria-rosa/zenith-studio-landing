from pathlib import Path

import pytest

from core.config import load_client
from core.retrieval import KeywordRetriever, load_chunks

CLIENTS = Path(__file__).parent / "clients"


@pytest.fixture
def client():
    return load_client(CLIENTS / "sunrise-dental.json")


@pytest.fixture
def retriever(client):
    return KeywordRetriever(load_chunks(CLIENTS / client.kb_dir))
