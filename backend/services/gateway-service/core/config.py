from aegis.config.settings import AegisSettings


class GatewayServiceSettings(AegisSettings):
    jwt_secret: str = "super-secret-aegis-key-for-local-dev-only"
    planner_service_url: str = "http://planner-service:8003"


settings = GatewayServiceSettings()
