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
    en_art_pieces_path = LOCALES_DIR / "en/art-pieces.json"
    assert en_art_pieces_path.is_file()
    en_json = _load_json(en_art_pieces_path)
    assert type(en_json) == dict
    assert "capoo" in en_json
    assert "asdf" not in en_json
    for art_id, art_info in en_json.items():
        assert "title" in art_info
        assert type(art_info["title"]) == str
        assert len(art_info["title"]) > 0
        assert "blurb" in art_info
        assert type(art_info["blurb"]) == str
        assert len(art_info["blurb"]) > 0
        assert "desc" in art_info
        assert type(art_info["desc"]) == str
        assert len(art_info["desc"]) > 0
        assert "links" in art_info
        assert type(art_info["links"]) == list
