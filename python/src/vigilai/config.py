"""Configuration loader for VigilAI SDK"""

import os
import json
import re
from pathlib import Path
from typing import Optional, Dict, Any
from .types import (
    VigilAIConfig,
    GitHubConfig,
    MonitoringConfig,
    ThresholdsConfig,
    AnomalyDetectionConfig,
    SecurityConfig,
)


class ConfigLoader:
    """
    Configuration loader that supports multiple sources with priority:
    1. Programmatic configuration (passed to constructor)
    2. Environment variables
    3. Configuration file (vigilai.config.json or vigilai.config.yaml)
    """

    @staticmethod
    def load(programmatic_config: VigilAIConfig) -> VigilAIConfig:
        """Load and merge configuration from all sources"""
        # Start with programmatic config
        config = programmatic_config

        # Load from config file (lowest priority)
        file_config = ConfigLoader._load_from_file()
        if file_config:
            config = ConfigLoader._merge_config(config, file_config)

        # Load from environment variables (medium priority)
        env_config = ConfigLoader._load_from_env()
        config = ConfigLoader._merge_config(config, env_config)

        # Apply programmatic config again (highest priority)
        config = ConfigLoader._merge_config(config, programmatic_config)

        # Validate configuration
        ConfigLoader._validate(config)

        return config

    @staticmethod
    def _load_from_file() -> Optional[Dict[str, Any]]:
        """Load configuration from file"""
        config_paths = [
            "vigilai.config.json",
            "vigilai.config.yaml",
            ".vigilai.json",
        ]

        for config_path in config_paths:
            full_path = Path.cwd() / config_path
            if full_path.exists():
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        if config_path.endswith(".json"):
                            return json.load(f)
                        # YAML parsing would require PyYAML, skip for now
                except Exception as e:
                    print(f"Warning: Failed to load config from {config_path}: {e}")

        return None

    @staticmethod
    def _load_from_env() -> Dict[str, Any]:
        """Load configuration from environment variables"""
        config: Dict[str, Any] = {}

        if os.getenv("VIGILAI_API_KEY"):
            config["api_key"] = os.getenv("VIGILAI_API_KEY")

        if os.getenv("VIGILAI_GITHUB_TOKEN"):
            config["github"] = {
                "token": os.getenv("VIGILAI_GITHUB_TOKEN"),
                "owner": os.getenv("VIGILAI_GITHUB_OWNER", ""),
                "repo": os.getenv("VIGILAI_GITHUB_REPO", ""),
            }

        if os.getenv("VIGILAI_MONITORING_INTERVAL"):
            config["monitoring"] = {
                "interval": int(os.getenv("VIGILAI_MONITORING_INTERVAL", "60000"))
            }

        if os.getenv("VIGILAI_THRESHOLD_RESPONSE_TIME"):
            config["thresholds"] = {
                "response_time": int(os.getenv("VIGILAI_THRESHOLD_RESPONSE_TIME", "1000"))
            }

        return config

    @staticmethod
    def _merge_config(target: VigilAIConfig, source: Any) -> VigilAIConfig:
        """Merge source config into target config"""
        # If source is a dict, convert relevant fields
        if isinstance(source, dict):
            if "api_key" in source and source["api_key"]:
                target.api_key = source["api_key"]

            if "github" in source and source["github"]:
                gh = source["github"]
                target.github = GitHubConfig(
                    token=gh.get("token", ""),
                    owner=gh.get("owner", ""),
                    repo=gh.get("repo", ""),
                    base_branch=gh.get("base_branch", "main"),
                    branch_prefix=gh.get("branch_prefix", "vigilai-fix"),
                    labels=gh.get("labels", []),
                    assignees=gh.get("assignees", []),
                )

            if "monitoring" in source and source["monitoring"]:
                mon = source["monitoring"]
                target.monitoring = MonitoringConfig(
                    interval=mon.get("interval", target.monitoring.interval),
                    sampling_rate=mon.get("sampling_rate", target.monitoring.sampling_rate),
                    buffer_size=mon.get("buffer_size", target.monitoring.buffer_size),
                )

            if "thresholds" in source and source["thresholds"]:
                th = source["thresholds"]
                target.thresholds = ThresholdsConfig(
                    response_time=th.get("response_time", target.thresholds.response_time),
                    error_rate=th.get("error_rate", target.thresholds.error_rate),
                    memory_usage=th.get("memory_usage", target.thresholds.memory_usage),
                    cpu_usage=th.get("cpu_usage", target.thresholds.cpu_usage),
                )

            if "anomaly_detection" in source and source["anomaly_detection"]:
                ad = source["anomaly_detection"]
                target.anomaly_detection = AnomalyDetectionConfig(
                    sensitivity=ad.get("sensitivity", target.anomaly_detection.sensitivity),
                    deduplication_window=ad.get(
                        "deduplication_window", target.anomaly_detection.deduplication_window
                    ),
                )

            if "security" in source and source["security"]:
                sec = source["security"]
                target.security = SecurityConfig(
                    redaction_rules=sec.get("redaction_rules", target.security.redaction_rules),
                    enable_pii_redaction=sec.get(
                        "enable_pii_redaction", target.security.enable_pii_redaction
                    ),
                )

        return target

    @staticmethod
    def _validate(config: VigilAIConfig) -> None:
        """Validate configuration"""
        # API key is required
        if not config.api_key or not config.api_key.strip():
            raise ValueError(
                "API key is required. Provide it via config, environment variable "
                "VIGILAI_API_KEY, or config file."
            )

        # Validate monitoring interval
        if config.monitoring.interval <= 0:
            raise ValueError("Monitoring interval must be positive")

        # Validate sampling rate
        if not 0 <= config.monitoring.sampling_rate <= 1:
            raise ValueError("Sampling rate must be between 0 and 1")

        # Validate buffer size
        if config.monitoring.buffer_size <= 0:
            raise ValueError("Buffer size must be positive")

        # Validate thresholds
        if config.thresholds.response_time <= 0:
            raise ValueError("Response time threshold must be positive")
        if not 0 <= config.thresholds.error_rate <= 100:
            raise ValueError("Error rate threshold must be between 0 and 100")
        if config.thresholds.memory_usage <= 0:
            raise ValueError("Memory usage threshold must be positive")
        if not 0 <= config.thresholds.cpu_usage <= 100:
            raise ValueError("CPU usage threshold must be between 0 and 100")

        # Validate anomaly detection
        if config.anomaly_detection.sensitivity <= 0:
            raise ValueError("Anomaly detection sensitivity must be positive")
        if config.anomaly_detection.deduplication_window <= 0:
            raise ValueError("Deduplication window must be positive")

        # Validate GitHub config if provided
        if config.github:
            if not config.github.token or not config.github.token.strip():
                raise ValueError("GitHub token is required when GitHub integration is configured")
            if not config.github.owner or not config.github.owner.strip():
                raise ValueError("GitHub owner is required when GitHub integration is configured")
            if not config.github.repo or not config.github.repo.strip():
                raise ValueError("GitHub repo is required when GitHub integration is configured")

        # Validate redaction rules (must be valid regex)
        for rule in config.security.redaction_rules:
            try:
                re.compile(rule)
            except re.error as e:
                raise ValueError(f"Invalid redaction rule regex: {rule}") from e
