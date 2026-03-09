"""VigilAI SDK - Automated incident detection, AI-powered diagnosis, and automatic code fix generation"""

from .vigilai import VigilAI
from .anomaly_detector import AnomalyDetector
from .ai_diagnostician import AIDiagnostician, Diagnosis, CodeLocation
from .code_generator import CodeGenerator, FixProposal, FileChange
from .github_integrator import GitHubIntegrator, GitHubConfig, PullRequest
from .types import (
    VigilAIConfig, 
    HealthStatus, 
    ComponentHealth,
    Incident,
    Baseline,
    IncidentType,
    Severity,
    IncidentStatus,
    Metric,
    ErrorEvent,
    MonitoringData
)

__version__ = "0.1.0"
__all__ = [
    "VigilAI", 
    "AnomalyDetector",
    "AIDiagnostician",
    "Diagnosis",
    "CodeLocation",
    "CodeGenerator",
    "FixProposal",
    "FileChange",
    "GitHubIntegrator",
    "GitHubConfig",
    "PullRequest",
    "VigilAIConfig", 
    "HealthStatus", 
    "ComponentHealth",
    "Incident",
    "Baseline",
    "IncidentType",
    "Severity",
    "IncidentStatus",
    "Metric",
    "ErrorEvent",
    "MonitoringData"
]
