from typing import Dict, Any

def planner_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulates the Intent Parser & Execution Planner.
    Determines if the investigation requires Graph Intelligence, ML Scoring, or both.
    """
    query = state.get("query", "")
    print(f"[PLANNER AGENT] Analyzing intent: {query}")
    
    # Deterministic dynamic routing based on the Enterprise workflow
    plan = ["graph_agent", "ml_agent", "explainability_agent"]
    
    return {
        "plan": plan,
        "planner_reasoning": "Detected request for structuring and layering analysis. Orchestrating Multi-hop Graph Execution followed by Anomaly Scoring.",
        "current_step_idx": 0
    }
