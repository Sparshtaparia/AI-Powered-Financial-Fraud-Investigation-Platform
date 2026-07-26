from aegis.schemas.planner import InvestigationSummary
from core.state import InvestigationState
from langgraph.graph import END, StateGraph
from llm.gemini_client import gemini_client
from tools.database_tool import run as database_tool
from tools.eda_tool import run as eda_tool
from tools.evidence_tool import run as evidence_tool
from tools.graph_tool import run as graph_tool
from tools.ml_tool import run as ml_tool


async def intent_parser_node(state: InvestigationState) -> InvestigationState:
    query = state.get("query")
    if not query:
        raise ValueError("Query is required for LLM planning")

    plan = gemini_client.parse_intent(query)

    state["metadata"]["intent"] = plan.get("intent", "Unknown")

    if plan.get("customer_id") and not state.get("customer_id"):
        state["customer_id"] = plan.get("customer_id")

    state["tools_to_run"] = plan.get("tools", [])

    return state


def router_node(state: InvestigationState):
    tools = state.get("tools_to_run", [])
    if not tools:
        return ["summary"]

    routes = []
    if "predict_risk" in tools or "ml_tool" in tools:
        routes.append("ml")
    if "graph_analysis" in tools or "graph_tool" in tools:
        routes.append("graph")
    if "verify_evidence" in tools or "evidence_tool" in tools:
        routes.append("evidence")
    if "query_database" in tools or "database_tool" in tools:
        routes.append("database")
    if "perform_eda" in tools or "eda_tool" in tools:
        routes.append("eda")

    if not routes:
        return ["summary"]

    return routes


async def llm_summary_node(state: InvestigationState) -> InvestigationState:
    try:
        report = gemini_client.generate_summary(state)
        # Parse it into InvestigationSummary just for compatibility or attach as raw
        state["summary"] = InvestigationSummary(
            recommendations=[report], audit=[{"action": "llm_summary_generated"}]
        )
    except Exception as e:
        state["errors"].append(f"Failed to generate summary: {str(e)}")
    return state


def build_llm_graph():
    workflow = StateGraph(InvestigationState)

    workflow.add_node("intent_parser", intent_parser_node)

    workflow.add_node("ml", ml_tool)
    workflow.add_node("graph", graph_tool)
    workflow.add_node("evidence", evidence_tool)
    workflow.add_node("database", database_tool)
    workflow.add_node("eda", eda_tool)

    workflow.add_node("summary", llm_summary_node)

    workflow.set_entry_point("intent_parser")

    workflow.add_conditional_edges(
        "intent_parser",
        router_node,
        {
            "ml": "ml",
            "graph": "graph",
            "evidence": "evidence",
            "database": "database",
            "eda": "eda",
            "summary": "summary",
        },
    )

    # All tools go to summary
    workflow.add_edge("ml", "summary")
    workflow.add_edge("graph", "summary")
    workflow.add_edge("evidence", "summary")
    workflow.add_edge("database", "summary")
    workflow.add_edge("eda", "summary")

    workflow.add_edge("summary", END)

    return workflow.compile()


llm_workflow = build_llm_graph()
