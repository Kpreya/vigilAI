"""
Anomaly Detector

Analyzes metrics against baselines, detects statistical outliers,
creates incidents for anomalies, and deduplicates similar incidents.
"""

import math
import time
from typing import Dict, List, Optional
from collections import defaultdict

from .types import (
    MonitoringData,
    Incident,
    Baseline,
    Metric,
    IncidentType,
    Severity,
    VigilAIConfig
)


class AnomalyDetector:
    """Detects anomalies in monitoring data"""

    def __init__(self, config: VigilAIConfig):
        self.config = config
        self.baselines: Dict[str, Baseline] = {}
        self.recent_incidents: List[Incident] = []

    def analyze_metrics(self, data: MonitoringData) -> List[Incident]:
        """Analyze metrics for anomalies and create incidents"""
        incidents: List[Incident] = []

        # Check threshold violations for all metric types
        for metric in data.metrics:
            incident = self._check_threshold_violation(metric, data)
            if incident:
                incidents.append(incident)

        # Check for statistical outliers using Z-score
        for metric in data.metrics:
            incident = self._check_statistical_outlier(metric, data)
            if incident:
                incidents.append(incident)

        # Deduplicate incidents
        deduplicated = self.deduplicate_incidents(incidents)

        # Store recent incidents for deduplication
        self.recent_incidents.extend(deduplicated)
        self._cleanup_old_incidents()

        return deduplicated

    def update_baselines(self, data: MonitoringData) -> None:
        """Update baselines using historical data"""
        metric_groups = self._group_metrics_by_name(data.metrics)

        for metric_name, metrics in metric_groups.items():
            if not metrics:
                continue

            values = [m.value for m in metrics]
            mean = self._calculate_mean(values)
            std_dev = self._calculate_std_dev(values, mean)
            threshold = mean + (self.config.anomaly_detection.sensitivity * std_dev)

            self.baselines[metric_name] = Baseline(
                metric=metric_name,
                mean=mean,
                std_dev=std_dev,
                threshold=threshold
            )

    def deduplicate_incidents(self, incidents: List[Incident]) -> List[Incident]:
        """Deduplicate similar incidents within time window"""
        deduplicated: List[Incident] = []

        for incident in incidents:
            is_duplicate = any(
                self._are_similar_incidents(incident, recent)
                for recent in self.recent_incidents
            )

            if not is_duplicate:
                deduplicated.append(incident)

        return deduplicated

    def _check_threshold_violation(
        self, 
        metric: Metric, 
        data: MonitoringData
    ) -> Optional[Incident]:
        """Check if metric violates configured threshold"""
        thresholds = self.config.thresholds
        violated = False
        incident_type: IncidentType = 'performance'
        severity: Severity = 'medium'

        # Check response time threshold
        if metric.name == 'http.response_time' and metric.value > thresholds.response_time:
            violated = True
            incident_type = 'performance'
            severity = self._calculate_severity(metric.value, thresholds.response_time)

        # Check error rate threshold
        elif metric.name == 'http.error_rate' and metric.value > thresholds.error_rate:
            violated = True
            incident_type = 'error'
            severity = self._calculate_severity(metric.value, thresholds.error_rate)

        # Check memory usage threshold
        elif metric.name == 'system.memory_usage' and metric.value > thresholds.memory_usage:
            violated = True
            incident_type = 'resource'
            severity = self._calculate_severity(metric.value, thresholds.memory_usage)

        # Check CPU usage threshold
        elif metric.name == 'system.cpu_usage' and metric.value > thresholds.cpu_usage:
            violated = True
            incident_type = 'resource'
            severity = self._calculate_severity(metric.value, thresholds.cpu_usage)

        if not violated:
            return None

        return self._create_incident(
            incident_type,
            severity,
            [metric],
            data.errors,
            {
                'endpoint': metric.tags.get('endpoint') if metric.tags else None,
                'detection_method': 'threshold'
            }
        )

    def _check_statistical_outlier(
        self, 
        metric: Metric, 
        data: MonitoringData
    ) -> Optional[Incident]:
        """Check if metric is a statistical outlier using Z-score"""
        baseline = self.baselines.get(metric.name)
        if not baseline:
            return None

        # Calculate Z-score
        z_score = 0 if baseline.std_dev == 0 else (
            (metric.value - baseline.mean) / baseline.std_dev
        )

        # Check if Z-score exceeds sensitivity threshold
        if abs(z_score) < self.config.anomaly_detection.sensitivity:
            return None

        # Determine incident type based on metric name
        incident_type: IncidentType = 'performance'
        if 'error' in metric.name:
            incident_type = 'error'
        elif 'memory' in metric.name or 'cpu' in metric.name:
            incident_type = 'resource'

        severity = self._calculate_severity_from_z_score(z_score)

        return self._create_incident(
            incident_type,
            severity,
            [metric],
            data.errors,
            {
                'endpoint': metric.tags.get('endpoint') if metric.tags else None,
                'detection_method': 'z-score',
                'z_score': f'{z_score:.2f}'
            }
        )

    def _create_incident(
        self,
        incident_type: IncidentType,
        severity: Severity,
        metrics: List[Metric],
        errors: List,
        additional_context: Dict
    ) -> Incident:
        """Create an incident with context"""
        timestamp = int(time.time() * 1000)
        incident_id = f"inc-{timestamp}-{hash(str(timestamp)) % 1000000000:09d}"

        return Incident(
            id=incident_id,
            type=incident_type,
            severity=severity,
            timestamp=timestamp,
            metrics=metrics,
            errors=errors,
            context={
                **additional_context,
                'duration': 0
            },
            status='detected'
        )

    def _calculate_severity(self, value: float, threshold: float) -> Severity:
        """Calculate severity based on how much threshold is exceeded"""
        ratio = value / threshold

        if ratio >= 3:
            return 'critical'
        elif ratio >= 2:
            return 'high'
        elif ratio >= 1.5:
            return 'medium'
        else:
            return 'low'

    def _calculate_severity_from_z_score(self, z_score: float) -> Severity:
        """Calculate severity from Z-score"""
        abs_z_score = abs(z_score)

        if abs_z_score >= 4:
            return 'critical'
        elif abs_z_score >= 3:
            return 'high'
        elif abs_z_score >= 2.5:
            return 'medium'
        else:
            return 'low'

    def _are_similar_incidents(self, incident1: Incident, incident2: Incident) -> bool:
        """Check if two incidents are similar (for deduplication)"""
        # Check if within deduplication window
        time_diff = abs(incident1.timestamp - incident2.timestamp)
        if time_diff > self.config.anomaly_detection.deduplication_window:
            return False

        # Check if same type
        if incident1.type != incident2.type:
            return False

        # Check if same affected metric
        metric1_names = {m.name for m in incident1.metrics}
        metric2_names = {m.name for m in incident2.metrics}
        has_common_metric = bool(metric1_names & metric2_names)

        if not has_common_metric:
            return False

        # Check if similar values (within 20%)
        for m1 in incident1.metrics:
            m2 = next((m for m in incident2.metrics if m.name == m1.name), None)
            if m2:
                diff = abs(m1.value - m2.value)
                avg = (m1.value + m2.value) / 2
                if avg > 0 and diff / avg > 0.2:
                    return False

        return True

    def _group_metrics_by_name(self, metrics: List[Metric]) -> Dict[str, List[Metric]]:
        """Group metrics by name"""
        groups: Dict[str, List[Metric]] = defaultdict(list)
        for metric in metrics:
            groups[metric.name].append(metric)
        return dict(groups)

    def _calculate_mean(self, values: List[float]) -> float:
        """Calculate mean of values"""
        if not values:
            return 0.0
        return sum(values) / len(values)

    def _calculate_std_dev(self, values: List[float], mean: float) -> float:
        """Calculate standard deviation"""
        if not values:
            return 0.0
        squared_diffs = [(val - mean) ** 2 for val in values]
        variance = sum(squared_diffs) / len(values)
        return math.sqrt(variance)

    def _cleanup_old_incidents(self) -> None:
        """Clean up old incidents outside deduplication window"""
        cutoff = int(time.time() * 1000) - self.config.anomaly_detection.deduplication_window
        self.recent_incidents = [
            incident for incident in self.recent_incidents
            if incident.timestamp > cutoff
        ]
