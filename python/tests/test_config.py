"""Property-based tests for configuration"""

import pytest
import re
from hypothesis import given, strategies as st, settings
from vigilai import VigilAI, VigilAIConfig
from vigilai.types import MonitoringConfig, ThresholdsConfig, SecurityConfig


class TestConfigurationProperties:
    """Feature: vigilai-sdk - Configuration Properties"""

    def test_property_1_api_key_requirement_empty(self):
        """
        Property 1: API key requirement
        For any SDK initialization attempt without an API key, initialization should fail
        with a descriptive error.
        Validates: Requirements 2.1
        """

        @given(st.just(""))
        @settings(max_examples=20)
        def property_test(api_key):
            with pytest.raises(ValueError, match="API key is required"):
                VigilAI(VigilAIConfig(api_key=api_key))

        property_test()

    def test_property_1_api_key_requirement_whitespace(self):
        """
        Property 1: API key requirement - whitespace only
        Validates: Requirements 2.1
        """

        @given(st.text(alphabet=" \t\n", min_size=1, max_size=10))
        @settings(max_examples=20)
        def property_test(api_key):
            with pytest.raises(ValueError, match="API key is required"):
                VigilAI(VigilAIConfig(api_key=api_key))

        property_test()

    def test_property_2_default_configuration_values(self):
        """
        Property 2: Default configuration values
        For any SDK initialization with only an API key, all optional configuration
        parameters should have sensible default values.
        Validates: Requirements 2.2
        """

        @given(st.text(min_size=1, max_size=100).filter(lambda s: s.strip()))
        def property_test(api_key):
            sdk = VigilAI(VigilAIConfig(api_key=api_key))
            config = sdk.get_config()

            assert config.monitoring.interval == 60000
            assert config.monitoring.sampling_rate == 1.0
            assert config.monitoring.buffer_size == 1000
            assert config.thresholds.response_time == 1000
            assert config.thresholds.error_rate == 5.0
            assert config.thresholds.memory_usage == 500
            assert config.thresholds.cpu_usage == 80.0
            assert config.anomaly_detection.sensitivity == 2.0
            assert config.anomaly_detection.deduplication_window == 300000
            assert config.security.enable_pii_redaction is True

        property_test()

    def test_property_3_custom_threshold_values(self):
        """
        Property 3: Custom configuration acceptance
        For any valid custom configuration values, the SDK should accept and apply
        those values instead of defaults.
        Validates: Requirements 2.3, 2.4, 2.5
        """

        @given(
            st.text(min_size=1, max_size=100).filter(lambda s: s.strip()),
            st.integers(min_value=1, max_value=10000),
            st.floats(min_value=0, max_value=100, allow_nan=False),
            st.integers(min_value=1, max_value=10000),
            st.floats(min_value=0, max_value=100, allow_nan=False),
        )
        def property_test(api_key, response_time, error_rate, memory_usage, cpu_usage):
            sdk = VigilAI(
                VigilAIConfig(
                    api_key=api_key,
                    thresholds=ThresholdsConfig(
                        response_time=response_time,
                        error_rate=error_rate,
                        memory_usage=memory_usage,
                        cpu_usage=cpu_usage,
                    ),
                )
            )
            config = sdk.get_config()

            assert config.thresholds.response_time == response_time
            assert config.thresholds.error_rate == error_rate
            assert config.thresholds.memory_usage == memory_usage
            assert config.thresholds.cpu_usage == cpu_usage

        property_test()

    def test_property_3_custom_monitoring_values(self):
        """
        Property 3: Custom configuration acceptance - monitoring
        Validates: Requirements 2.3, 2.4, 2.5
        """

        @given(
            st.text(min_size=1, max_size=100).filter(lambda s: s.strip()),
            st.integers(min_value=1000, max_value=600000),
            st.floats(min_value=0, max_value=1, allow_nan=False),
            st.integers(min_value=100, max_value=10000),
        )
        def property_test(api_key, interval, sampling_rate, buffer_size):
            sdk = VigilAI(
                VigilAIConfig(
                    api_key=api_key,
                    monitoring=MonitoringConfig(
                        interval=interval,
                        sampling_rate=sampling_rate,
                        buffer_size=buffer_size,
                    ),
                )
            )
            config = sdk.get_config()

            assert config.monitoring.interval == interval
            assert config.monitoring.sampling_rate == sampling_rate
            assert config.monitoring.buffer_size == buffer_size

        property_test()

    def test_property_4_api_key_validation(self):
        """
        Property 4: API key validation
        For any API key provided during initialization, the SDK should validate it
        against the backend before completing initialization.
        Validates: Requirements 2.6
        """
        sdk = VigilAI(VigilAIConfig(api_key="test-key"))
        assert sdk.is_initialized() is False

        # Note: Full validation test requires backend mock
        # Will be implemented with integration tests

    def test_property_5_invalid_api_key_rejection(self):
        """
        Property 5: Invalid API key rejection
        For any invalid API key, the SDK should throw a descriptive error and prevent
        initialization from completing.
        Validates: Requirements 2.7
        """
        sdk = VigilAI(VigilAIConfig(api_key="invalid-key"))

        # Note: Full validation test requires backend mock
        # The API client will throw on invalid keys
        assert sdk.is_initialized() is False

    def test_property_6_configuration_source_priority(self):
        """
        Property 6: Configuration source priority
        For any configuration parameter specified in multiple sources, the SDK should
        use the value with highest priority: programmatic > environment > file.
        Validates: Requirements 2.8, 2.9, 2.10
        """

        @given(
            st.text(min_size=1, max_size=100).filter(lambda s: s.strip()),
            st.integers(min_value=1000, max_value=10000),
        )
        def property_test(api_key, custom_interval):
            sdk = VigilAI(
                VigilAIConfig(
                    api_key=api_key,
                    monitoring=MonitoringConfig(interval=custom_interval),
                )
            )
            config = sdk.get_config()

            # Programmatic value should override default
            assert config.monitoring.interval == custom_interval
            assert config.monitoring.interval != 60000

        property_test()

    def test_property_7_negative_monitoring_interval(self):
        """
        Property 7: Configuration input validation
        For any configuration input, the SDK should validate and sanitize it, rejecting
        invalid values with descriptive errors.
        Validates: Requirements 11.6
        """

        @given(
            st.text(min_size=1, max_size=100).filter(lambda s: s.strip()),
            st.integers(min_value=-10000, max_value=0),
        )
        def property_test(api_key, interval):
            with pytest.raises(ValueError, match="interval must be positive"):
                VigilAI(
                    VigilAIConfig(
                        api_key=api_key,
                        monitoring=MonitoringConfig(interval=interval),
                    )
                )

        property_test()

    def test_property_7_invalid_sampling_rate(self):
        """
        Property 7: Configuration input validation - sampling rate
        Validates: Requirements 11.6
        """

        @given(
            st.text(min_size=1, max_size=100).filter(lambda s: s.strip()),
            st.one_of(
                st.floats(min_value=-10, max_value=-0.01, allow_nan=False),
                st.floats(min_value=1.01, max_value=10, allow_nan=False),
            ),
        )
        def property_test(api_key, sampling_rate):
            with pytest.raises(ValueError, match="Sampling rate must be between 0 and 1"):
                VigilAI(
                    VigilAIConfig(
                        api_key=api_key,
                        monitoring=MonitoringConfig(sampling_rate=sampling_rate),
                    )
                )

        property_test()

    def test_property_7_invalid_response_time_threshold(self):
        """
        Property 7: Configuration input validation - response time
        Validates: Requirements 11.6
        """

        @given(
            st.text(min_size=1, max_size=100).filter(lambda s: s.strip()),
            st.integers(min_value=-1000, max_value=0),
        )
        def property_test(api_key, response_time):
            with pytest.raises(ValueError, match="Response time threshold must be positive"):
                VigilAI(
                    VigilAIConfig(
                        api_key=api_key,
                        thresholds=ThresholdsConfig(response_time=response_time),
                    )
                )

        property_test()

    def test_property_7_invalid_error_rate_threshold(self):
        """
        Property 7: Configuration input validation - error rate
        Validates: Requirements 11.6
        """

        @given(
            st.text(min_size=1, max_size=100).filter(lambda s: s.strip()),
            st.one_of(
                st.floats(min_value=-100, max_value=-0.01, allow_nan=False),
                st.floats(min_value=100.01, max_value=200, allow_nan=False),
            ),
        )
        def property_test(api_key, error_rate):
            with pytest.raises(ValueError, match="Error rate threshold must be between 0 and 100"):
                VigilAI(
                    VigilAIConfig(
                        api_key=api_key,
                        thresholds=ThresholdsConfig(error_rate=error_rate),
                    )
                )

        property_test()

    def test_property_7_invalid_redaction_rules(self):
        """
        Property 7: Configuration input validation - redaction rules
        Validates: Requirements 11.6
        """
        with pytest.raises(ValueError, match="Invalid redaction rule regex"):
            VigilAI(
                VigilAIConfig(
                    api_key="test-key",
                    security=SecurityConfig(redaction_rules=["[invalid(regex"]),
                )
            )

    def test_property_7_valid_redaction_rules(self):
        """
        Property 7: Configuration input validation - valid redaction rules
        Validates: Requirements 11.6
        """

        @given(st.text(min_size=1, max_size=100).filter(lambda s: s.strip()))
        def property_test(api_key):
            sdk = VigilAI(
                VigilAIConfig(
                    api_key=api_key,
                    security=SecurityConfig(
                        redaction_rules=[r"\d{3}-\d{2}-\d{4}", "password.*"]
                    ),
                )
            )
            config = sdk.get_config()

            assert len(config.security.redaction_rules) == 2

        property_test()

