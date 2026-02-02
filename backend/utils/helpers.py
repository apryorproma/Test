import json
from pathlib import Path


def load_json(path: Path) -> dict | list:
    with open(path, "r") as f:
        return json.load(f)
