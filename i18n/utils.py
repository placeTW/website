import json
import hjson


def load_json(json_file: str):
    with open(json_file) as f:
        entries = json.load(f)
    return entries


def load_hjson(hjson_file: str):
    with open(hjson_file) as f:
        translated_entries = hjson.load(f, object_pairs_hook=dict)
    return translated_entries


def load_json_or_hjson(filename: str):
    if not (filename.endswith(".json") or filename.endswith(".hjson")):
        raise ValueError(f"Expected .json or .hjson file, got {filename}")
    entries = (
        load_json(filename)
        if filename.endswith(".json")
        else load_hjson(filename)
    )
    return entries
