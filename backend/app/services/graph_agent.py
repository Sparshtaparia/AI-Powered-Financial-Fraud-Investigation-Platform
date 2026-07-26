from app.models.neo4j_client import neo4j_client

def graph_agent(state):
    """
    Graph Intelligence Agent.
    Executes graph algorithms or queries based on the investigation context.
    """
    print("Graph Agent executing...")
    account_id = state.get("target_account_id")
    
    if not account_id:
        return {"graph_evidence": "No target account specified for graph analysis."}
        
    try:
        paths = neo4j_client.get_multi_hop_path(account_id)
        evidence = f"Found {len(paths)} multi-hop paths connected to account {account_id}."
        if paths:
            # Format the paths for the LLM
            evidence += " Potential circular transfers or structuring detected."
    except Exception as e:
        evidence = f"Graph analysis failed: {str(e)}"
        
    return {"graph_evidence": evidence}
