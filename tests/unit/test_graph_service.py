import os
import sys
from unittest.mock import patch

sys.path.append(os.path.abspath("./services/graph-service"))
sys.path.append(os.path.abspath("./libs"))

from services.graph_queries import get_customer


@patch("repositories.neo4j_repository.neo4j_repo.execute_query")
def test_get_customer(mock_execute):
    # Mocking the repository layer
    mock_execute.return_value = [
        {
            "c": {"id": "CUST_521", "name": "Alice"},
            "accounts": [{"id": "ACC_100", "balance": 5000}],
        }
    ]

    res = get_customer("CUST_521")
    assert res is not None
    assert res["customer"]["id"] == "CUST_521"
    assert len(res["accounts"]) == 1
    assert res["accounts"][0]["id"] == "ACC_100"
