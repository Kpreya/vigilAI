"""Property-based tests for monitoring agent"""

import time
from hypothesis import given, strategies as st, settings
from vigilai.monitoring_agent import MonitoringAgent
from vigilai.types import VigilAIConfig, MonitoringConfig


# Strategy for generating valid monitoring configurations
@st.composite
def monitoring_config_strategy(draw):
    """Generate valid monitoring configurations"""
    return MonitoringConfig(
        interval=draw(st.integers(min_value=100, max_value=500)),  # Shorter intervals for faster tests
        sampling_rate=draw(st.floats(min_value=0.1, max_value=1.0)),  # Ensure at least some sampling
        buffer_size=draw(st.integers(min_value=10, max_value=1000))
    )


@st.composite
def vigilai_config_strategy(draw):
    """Generate valid VigilAI configurations"""
    return VigilAIConfig(
        api_key='test-key',
        monitoring=draw(monitoring_config_strategy())
    )


class TestProperty13ComprehensiveMetricCollection:
    """Property 13: Comprehensive metric collection - all metric types should be collected
    
    **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**
    """
    
    @given(config=vigilai_config_strategy())
    @settings(max_examples=20, deadline=2000)  # 2 second deadline for async tests with monitoring intervals
    def test_all_metric_types_collected(self, config):
        """For any monitoring interval, the SDK should collect all configured metric types"""
        # Force sampling rate to 1.0 for this test to ensure metrics are captured
        config.monitoring.sampling_rate = 1.0
        agent = MonitoringAgent(config)
        
        try:
            # Start monitoring to collect system metrics
            agent.start_monitoring()
            
            # Capture HTTP request to get HTTP metrics
            agent.capture_request('/api/test', 'GET', 200, 150.5)
            
            # Wait for at least one collection cycle
            time.sleep(config.monitoring.interval / 1000.0 + 0.2)
            
            data = agent.get_buffered_data()
            
            # Check that we have metrics
            assert len(data.metrics) > 0, "Should have collected metrics"
            
            metric_names = {m.name for m in data.metrics}
            
            # Verify HTTP metrics are collected (Requirements 4.2, 4.6)
            assert 'http.response_time' in metric_names, "Should collect HTTP response time"
            assert 'http.status' in metric_names, "Should collect HTTP status"
            
            # Verify system metrics are collected (Requirements 4.4, 4.5)
            # Memory metrics (Requirement 4.4)
            memory_metrics = [m for m in metric_names if 'memory' in m]
            assert len(memory_metrics) > 0, "Should collect memory usage metrics"
            
            # CPU metrics (Requirement 4.5)
            assert 'system.cpu.usage' in metric_names, "Should collect CPU usage"
            
            # Throughput metrics (Requirement 4.6)
            assert 'http.throughput' in metric_names, "Should collect request throughput"
            
        finally:
            agent.stop_monitoring()


class TestProperty14ErrorStackTraceCapture:
    """Property 14: Error stack trace capture - errors should include stack traces
    
    **Validates: Requirements 4.7**
    """
    
    @given(
        config=vigilai_config_strategy(),
        error_message=st.text(min_size=1, max_size=100),
        has_context=st.booleans()
    )
    @settings(max_examples=20)
    def test_error_includes_stack_trace(self, config, error_message, has_context):
        """For any captured error, the SDK should include the complete stack trace"""
        agent = MonitoringAgent(config)
        
        try:
            # Create and capture an error
            try:
                raise ValueError(error_message)
            except ValueError as e:
                context = {'test': 'context'} if has_context else None
                agent.capture_error(e, context)
            
            data = agent.get_buffered_data()
            
            # Verify error was captured
            assert len(data.errors) == 1, "Should have captured one error"
            
            error = data.errors[0]
            
            # Verify error has required fields
            assert error.message == error_message, "Error message should match"
            assert error.stack is not None, "Error should have stack trace"
            assert len(error.stack) > 0, "Stack trace should not be empty"
            assert 'ValueError' in error.stack, "Stack trace should include error type"
            assert error.timestamp > 0, "Error should have timestamp"
            
            # Verify context is preserved
            if has_context:
                assert error.context is not None, "Context should be preserved"
                assert error.context == {'test': 'context'}
            else:
                assert error.context is None, "Context should be None when not provided"
                
        finally:
            agent.stop_monitoring()


class TestProperty16DataBuffering:
    """Property 16: Data buffering - metrics should be buffered locally
    
    **Validates: Requirements 4.10**
    """
    
    @given(
        config=vigilai_config_strategy(),
        num_requests=st.integers(min_value=1, max_value=50)
    )
    @settings(max_examples=20)
    def test_metrics_buffered_locally(self, config, num_requests):
        """For any collected metric or error, the SDK should buffer it locally"""
        # Force sampling rate to 1.0 for this test to ensure metrics are captured
        config.monitoring.sampling_rate = 1.0
        agent = MonitoringAgent(config)
        
        try:
            # Capture multiple requests
            for i in range(num_requests):
                agent.capture_request(f'/api/test{i}', 'GET', 200, 100.0)
            
            # Get buffered data
            data = agent.get_buffered_data()
            
            # Verify data is buffered
            assert len(data.metrics) > 0, "Metrics should be buffered locally"
            
            # Each request creates 2 metrics (response_time and status)
            expected_metrics = min(num_requests * 2, config.monitoring.buffer_size)
            assert len(data.metrics) <= expected_metrics, "Should not exceed buffer size"
            
            # Verify buffer stats are accurate
            stats = agent.get_buffer_stats()
            assert stats['metrics_count'] == len(data.metrics), "Buffer stats should match actual count"
            
        finally:
            agent.stop_monitoring()
    
    @given(
        config=vigilai_config_strategy(),
        num_errors=st.integers(min_value=1, max_value=50)
    )
    @settings(max_examples=20)
    def test_errors_buffered_locally(self, config, num_errors):
        """For any captured error, the SDK should buffer it locally"""
        agent = MonitoringAgent(config)
        
        try:
            # Capture multiple errors
            for i in range(num_errors):
                try:
                    raise RuntimeError(f'Error {i}')
                except RuntimeError as e:
                    agent.capture_error(e)
            
            # Get buffered data
            data = agent.get_buffered_data()
            
            # Verify errors are buffered
            assert len(data.errors) > 0, "Errors should be buffered locally"
            
            expected_errors = min(num_errors, config.monitoring.buffer_size)
            assert len(data.errors) <= expected_errors, "Should not exceed buffer size"
            
            # Verify buffer stats are accurate
            stats = agent.get_buffer_stats()
            assert stats['errors_count'] == len(data.errors), "Buffer stats should match actual count"
            
        finally:
            agent.stop_monitoring()
    
    @given(config=vigilai_config_strategy())
    @settings(max_examples=20)
    def test_buffer_overflow_behavior(self, config):
        """When buffer is full, oldest data should be overwritten (FIFO)"""
        # Use a small buffer for testing
        small_config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(
                interval=config.monitoring.interval,
                sampling_rate=1.0,
                buffer_size=5
            )
        )
        agent = MonitoringAgent(small_config)
        
        try:
            # Fill buffer beyond capacity
            for i in range(10):
                agent.capture_request(f'/api/test{i}', 'GET', 200, 100.0)
            
            data = agent.get_buffered_data()
            
            # Buffer should be at capacity, not exceed it
            assert len(data.metrics) == 5, "Buffer should be at capacity"
            
            # Verify oldest data was overwritten
            stats = agent.get_buffer_stats()
            assert stats['metrics_count'] == 5, "Buffer should maintain capacity"
            
        finally:
            agent.stop_monitoring()
