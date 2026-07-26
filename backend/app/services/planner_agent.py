from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List
import os

# We would normally instantiate a real LLM here, like GPT-4o
# For demonstration without an API key, we mock the behavior or use a fallback.
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0) if os.getenv("OPENAI_API_KEY") else None

class ExecutionPlan(BaseModel):
    steps: List[str] = Field(description="The sequence of agents or tools to execute (e.g., ['graph_agent', 'ml_agent', 'explainability_agent'])")
    reasoning: str = Field(description="Why this plan was chosen")

def planner_agent(state):
    """
    Typology-Conditioned Dynamic Investigation Planner.
    Analyzes the user's intent or alert and creates an execution DAG.
    """
    query = state.get("query", "")
    
    print(f"Planner Agent analyzing query: {query}")
    
    # Mock behavior if LLM is not available
    if not llm:
        if "structuring" in query.lower() or "smurfing" in query.lower():
            plan = ["graph_agent", "ml_agent", "explainability_agent"]
            reasoning = "Query suggests structuring/smurfing. Graph analysis needed for multi-hop paths, ML for anomaly scoring, and Explainability to synthesize."
        else:
            plan = ["graph_agent", "explainability_agent"]
            reasoning = "Default investigation path."
        
        return {"plan": plan, "planner_reasoning": reasoning, "current_step_idx": 0}

    # Real LLM behavior (if API key is present)
    system_prompt = """You are the Principal AI Planner Agent for AegisAML.
Your job is to read the investigation query and output a dynamic execution plan.
Available agents: [graph_agent, ml_agent, compliance_agent, explainability_agent]
"""
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=query)
    ]
    
    # Note: structured_llm = llm.with_structured_output(ExecutionPlan) would be used here.
    # For simplicity, returning mock
    return {"plan": ["graph_agent", "explainability_agent"], "planner_reasoning": "Standard plan", "current_step_idx": 0}
