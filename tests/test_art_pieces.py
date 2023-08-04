"""This file tests if the json files in the locals are properly formatted."""

import json
from pathlib import Path

LOCALES_DIR = Path(__file__).parent / "../public/locales"


def _load_json(path):
    with open(path) as f:
        return json.load(f)


def test_art_en():
    """
    EN is subject to more rigourous testing since
    it's the basis of other translations.
    """
    en_json = _load_json(LOCALES_DIR / "en/art-pieces.json")
    assert type(en_json) == dict
