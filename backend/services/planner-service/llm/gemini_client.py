import json
import os
from typing import Any, Dict

from google import genai
from google.genai import types


class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def parse_intent(self, query: str) -> Dict[str, Any]:
        """
        Parses a natural language query into a structured JSON plan.
        Raises an exception if the API fails, which triggers the fallback planner.
        """
        if not self.client:
            raise ValueError("Gemini API key not configured")

        prompt = f"""You are an AML Investigation Planning Agent.
Available tools:
- query_database
- perform_eda
- predict_risk
- graph_analysis
- verify_evidence

Understand the user's natural language query.
Determine the investigation intent.
Decide which tools are required.
If the user mentions a specific customer (e.g. C1023), extract it.

Return ONLY JSON. Never return markdown.

Example response:
{{
    "intent": "Structuring Investigation",
    "customer_id": "C1023",
    "time_window": "90 days",
    "tools": [
        "query_database",
        "predict_risk",
        "graph_analysis",
        "verify_evidence"
    ]
}}

User Query: "{query}"
"""
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        return json.loads(response.text)

    def generate_summary(self, execution_state: Dict[str, Any]) -> str:
        """
        Generates a final explainable markdown report.
        """
        if not self.client:
            raise ValueError("Gemini API key not configured")

        state_str = json.dumps(
            {
                k: v
                for k, v in execution_state.items()
                if k not in ["timeline", "metadata"] and v is not None
            },
            default=str,
        )

        prompt = f"""Generate an explainable AML investigation report based on the following tool execution results.

Include:
- Risk score
- Suspicious behaviours
- Connected entities
- Evidence integrity
- Recommended analyst action
- Confidence score

Return structured markdown.

Execution State:
{state_str}
"""
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        return response.text


gemini_client = GeminiClient()
