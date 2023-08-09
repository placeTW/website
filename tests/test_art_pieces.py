"""This file tests if the json files in the locals are properly formatted."""

import json
from pytest import fixture
from pathlib import Path

LOCALES_DIR = (Path(__file__).parent / "../public/locales").resolve()


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
    assert len(en_json.keys()) == 15
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


@fixture
def all_json_art_langs():
    all_langs = LOCALES_DIR.glob("*/")
    all_jsons = []
    for lang in all_langs:
        lang_json_path = lang / "art-pieces.json"
        if lang_json_path.is_file():
            lang_json = _load_json(lang_json_path)
            all_jsons.append(lang_json)
    return all_jsons


def test_json_general(all_json_art_langs):
    for art_json in all_json_art_langs:
        for art_id, art_item in art_json.items():
            assert type(art_item) is dict
            assert type(art_item["title"]) is str
            assert type(art_item["blurb"]) is str
            assert type(art_item["desc"]) is str
            assert type(art_item["links"]) is list
