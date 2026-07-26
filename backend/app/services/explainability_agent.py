import os
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0) if os.getenv("OPENAI_API_KEY") else None

def explainability_agent(state):
    """
    Generates a regulator-grade SAR (Suspicious Activity Report) explanation based on all gathered evidence.
    """
    print("Explainability Agent executing...")
    
    graph_evidence = state.get("graph_evidence", "No graph evidence.")
    ml_evidence = state.get("ml_evidence", "No ML evidence.")
    query = state.get("query", "")
    
    prompt = f"""
You are an expert AML Investigator at a Tier-1 Bank.
Write a concise, regulator-grade summary of the following evidence regarding an alert for '{query}'.

Graph Evidence: {graph_evidence}
ML Evidence: {ml_evidence}

Structure the report clearly with:
1. Trigger Event
2. Behavioral Analysis
3. Recommendation (File SAR or Dismiss)
"""

    if not llm:
        report = f"""
--- SUSPICIOUS ACTIVITY REPORT SUMMARY ---
1. Trigger Event: Alert for '{query}'
2. Behavioral Analysis: 
   - Graph: {graph_evidence}
   - ML: {ml_evidence}
3. Recommendation: File SAR based on multi-hop money movement indicating potential structuring.
------------------------------------------
"""
        return {"final_report": report}

    messages = [
        SystemMessage(content="You are an expert AML investigator."),
        HumanMessage(content=prompt)
    ]
    response = llm.invoke(messages)
    
    return {"final_report": response.content}
