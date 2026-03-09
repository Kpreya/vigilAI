"""Type definitions for VigilAI SDK"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Literal


@dataclass
class GitHubConfig:
    """GitHub integration configuration"""
    token: str
    owner: str
    repo: str
    base_branch: str = "main"
    branch_prefix: str = "vigilai-fix"
    labels: List[str] = field(default_factory=list)
    assignees: List[str] = field(default_factory=list)


@dataclass
class MonitoringConfig:
    """Monitoring configuration"""
    interval: int = 60000  # milliseconds
    sampling_rate: float = 1.0
    buffer_size: int = 1000


@dataclass
class ThresholdsConfig:
    """Threshold configuration"""
    response_time: int = 1000  # ms
    error_rate: float = 5.0  # percentage
    memory_usage: int = 500  # MB
    cpu_usage: float = 80.0  # percentage


@dataclass
class AnomalyDetectionConfig:
    """Anomaly detection configuration"""
    sensitivity: float = 2.0
    deduplication_window: int = 300000  # ms


@dataclass
class SecurityConfig:
    """Security configuration"""
    redaction_rules: List[str] = field(default_factory=list)
    enable_pii_redaction: bool = True
    data_retention_period: int = 604800000  # 7 days in milliseconds


@dataclass
class VigilAIConfig:
    """Configuration for the VigilAI SDK"""
    api_key: str
    github: Optional[GitHubConfig] = None
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)
    thresholds: ThresholdsConfig = field(default_factory=ThresholdsConfig)
    anomaly_detection: AnomalyDetectionConfig = field(default_factory=AnomalyDetectionConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)


@dataclass
class ComponentHealth:
    """Health status for a single component"""
    status: Literal['up', 'down', 'degraded']
    last_error: Optional[str] = None
    last_success: Optional[int] = None


@dataclass
class HealthStatus:
    """Overall health status for the SDK"""
    status: Literal['healthy', 'degraded', 'unhealthy']
    components: Dict[str, ComponentHealth]
    metrics: Dict[str, float]


@dataclass
class Metric:
    """Metric data structure"""
    name: str
    value: float
    timestamp: int
    tags: Optional[Dict[str, str]] = None


@dataclass
class ErrorEvent:
    """Error event data structure"""
    message: str
    stack: str
    timestamp: int
    context: Optional[Dict[str, any]] = None


@dataclass
class MonitoringData:
    """Monitoring data containing metrics and errors"""
    metrics: List[Metric]
    errors: List[ErrorEvent]


# Type aliases for incident classification
IncidentType = Literal['performance', 'error', 'resource']
Severity = Literal['low', 'medium', 'high', 'critical']
IncidentStatus = Literal['detected', 'diagnosed', 'fix_generated', 'pr_created']


@dataclass
class Incident:
    """Incident data structure"""
    id: str
    type: IncidentType
    severity: Severity
    timestamp: int
    metrics: List[Metric]
    errors: List[ErrorEvent]
    context: Dict[str, any]
    status: IncidentStatus


@dataclass
class Baseline:
    """Baseline data for anomaly detection"""
    metric: str
    mean: float
    std_dev: float
    threshold: float
