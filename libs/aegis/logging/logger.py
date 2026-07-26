import logging
import sys
import json
from datetime import datetime

# We must import contextvar safely if not running in web context
try:
    from aegis.middleware.correlation import request_id_var
except ImportError:
    request_id_var = None

class JsonFormatter(logging.Formatter):
    def format(self, record):
        req_id = request_id_var.get("") if request_id_var else ""
        log_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": record.name,
            "request_id": req_id,
            "level": record.levelname,
            "message": record.getMessage()
        }
        return json.dumps(log_record)

def get_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.hasHandlers():
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        # Propagate off to avoid root logger duplication
        logger.propagate = False
    return logger
