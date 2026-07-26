from langgraph.graph import StateGraph, END
from core.state import InvestigationState

from agents.planning_agent import run as planning_node
from agents.ml_agent import run as ml_node
from agents.graph_agent import run as graph_node
from agents.evidence_agent import run as evidence_node
from agents.summary_agent import run as summary_node

def build_graph():
    workflow = StateGraph(InvestigationState)

    workflow.add_node("planning", planning_node)
    workflow.add_node("ml", ml_node)
    workflow.add_node("graph", graph_node)
    workflow.add_node("evidence", evidence_node)
    workflow.add_node("summary", summary_node)

    workflow.set_entry_point("planning")

    workflow.add_edge("planning", "ml")
    workflow.add_edge("ml", "graph")
    workflow.add_edge("graph", "evidence")
    workflow.add_edge("evidence", "summary")
    workflow.add_edge("summary", END)

    return workflow.compile()

app_workflow = build_graph()
