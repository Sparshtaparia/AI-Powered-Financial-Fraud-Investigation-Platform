class EvidenceFusionEngine:
    """
    Hybrid Evidence Fusion Engine.
    Combines rule-based evidence, graph intelligence, temporal behaviour, 
    and ML anomaly scores into a calibrated risk estimate.
    """
    def __init__(self):
        self.weights = {
            "graph_score": 0.4,
            "ml_anomaly_score": 0.4,
            "rule_score": 0.2
        }

    def fuse_evidence(self, graph_evidence_dict, ml_evidence_dict, rule_evidence_dict):
        """
        Fuses different streams of evidence.
        In a real system, these would be numeric scores or logits.
        """
        # Mock calculation
        graph_score = graph_evidence_dict.get("score", 0.0)
        ml_score = ml_evidence_dict.get("score", 0.0)
        rule_score = rule_evidence_dict.get("score", 0.0)

        final_risk = (
            (graph_score * self.weights["graph_score"]) +
            (ml_score * self.weights["ml_anomaly_score"]) +
            (rule_score * self.weights["rule_score"])
        )

        classification = "HIGH_RISK" if final_risk > 0.75 else "MEDIUM_RISK" if final_risk > 0.5 else "LOW_RISK"

        return {
            "final_risk_score": final_risk,
            "classification": classification,
            "contributions": {
                "graph": graph_score * self.weights["graph_score"],
                "ml": ml_score * self.weights["ml_anomaly_score"],
                "rule": rule_score * self.weights["rule_score"]
            }
        }

fusion_engine = EvidenceFusionEngine()
