import json

def canonicalize(data: dict) -> bytes:
    """
    Converts a dictionary into a canonical JSON byte string.
    Sorting keys, removing whitespace, encoding to UTF-8.
    """
    return json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
