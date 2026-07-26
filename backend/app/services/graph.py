from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from app.services.planner_agent import planner_agent
from app.services.graph_agent import graph_agent
from app.services.explainability_agent import explainability_agent

# Define the State
class AgentState(TypedDict):
    query: str
    target_account_id: Optional[str]
    plan: List[str]
    planner_reasoning: str
    current_step_idx: int
    graph_evidence: str
    ml_evidence: str
    final_report: str

# Define the router logic
def route_next_step(state: AgentState):
    plan = state.get("plan", [])
    idx = state.get("current_step_idx", 0)
    
    if idx >= len(plan):
        return END
        
    next_agent = plan[idx]
    return next_agent

def increment_step(state: AgentState):
    return {"current_step_idx": state.get("current_step_idx", 0) + 1}

# Create the Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("planner_agent", planner_agent)
workflow.add_node("graph_agent", graph_agent)
workflow.add_node("explainability_agent", explainability_agent)
workflow.add_node("increment_step", increment_step)

# A dummy ml_agent for now
def ml_agent(state):
    print("ML Agent executing...")
    return {"ml_evidence": "Isolation Forest anomaly score: 0.89 (High Risk)"}
workflow.add_node("ml_agent", ml_agent)

# Add Edges
workflow.set_entry_point("planner_agent")

workflow.add_conditional_edges(
    "planner_agent",
    route_next_step,
    {
        "graph_agent": "graph_agent",
        "ml_agent": "ml_agent",
        "explainability_agent": "explainability_agent",
        END: END
    }
)

workflow.add_edge("graph_agent", "increment_step")
workflow.add_edge("ml_agent", "increment_step")
workflow.add_edge("explainability_agent", "increment_step")

workflow.add_conditional_edges(
    "increment_step",
    route_next_step,
    {
        "graph_agent": "graph_agent",
        "ml_agent": "ml_agent",
        "explainability_agent": "explainability_agent",
        END: END
    }
)

# Compile
app = workflow.compile()
