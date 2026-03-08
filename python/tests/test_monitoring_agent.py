"""Unit tests for monitoring agent"""

import time
import pytest
from unittest.mock import Mock
from vigilai.monitoring_agent import MonitoringAgent, CircularBuffer
from vigilai.types import VigilAIConfig, MonitoringConfig
from vigilai.api_client import APIClient


@pytest.fixture
def config():
    """Create test configuration"""
    return VigilAIConfig(
        api_key='test-key',
        monitoring=MonitoringConfig(
            interval=1000,
            sampling_rate=1.0,
            buffer_size=100
        )
    )


@pytest.fixture
def mock_api_client():
    """Create mock API client"""
    client = Mock(spec=APIClient)
    client.transmit_monitoring_data = Mock()
    return client


@pytest.fixture
def agent(config, mock_api_client):
    """Create monitoring agent"""
    agent = MonitoringAgent(config, mock_api_client)
    yield agent
    agent.stop_monitoring()


class TestCircularBuffer:
    """Test circular buffer implementation"""
    
    def test_push_and_get(self):
        """Test pushing and retrieving items"""
        buffer = CircularBuffer(5)
        
        buffer.push(1)
        buffer.push(2)
        buffer.push(3)
        
        items = buffer.get_all()
        assert items == [1, 2, 3]
        assert buffer.get_size() == 3
    
    def test_overflow(self):
        """Test buffer overflow behavior"""
        buffer = CircularBuffer(3)
        
        # Fill buffer
        buffer.push(1)
        buffer.push(2)
        buffer.push(3)
        
        assert buffer.is_full()
        
        # Overflow - should overwrite oldest
        buffer.push(4)
        buffer.push(5)
        
        items = buffer.get_all()
        assert items == [3, 4, 5]
        assert buffer.get_size() == 3
    
    def test_clear(self):
        """Test clearing buffer"""
        buffer = CircularBuffer(5)
        buffer.push(1)
        buffer.push(2)
        
        buffer.clear()
        
        assert buffer.get_size() == 0
        assert buffer.get_all() == []


class TestHTTPRequestMetrics:
    """Test HTTP request metric collection"""
    
    def test_capture_request(self, agent):
        """Test capturing HTTP request metrics"""
        agent.capture_request('/api/users', 'GET', 200, 150.5)
        
        data = agent.get_buffered_data()
        assert len(data.metrics) >= 2
        
        # Find response time metric
        response_time_metric = next(
            (m for m in data.metrics if m.name == 'http.response_time'),
            None
        )
        assert response_time_metric is not None
        assert response_time_metric.value == 150.5
        assert response_time_metric.tags['endpoint'] == '/api/users'
        assert response_time_metric.tags['method'] == 'GET'
        assert response_time_metric.tags['status'] == '200'
        
        # Find status metric
        status_metric = next(
            (m for m in data.metrics if m.name == 'http.status'),
            None
        )
        assert status_metric is not None
        assert status_metric.value == 200.0
    
    def test_sampling_rate(self):
        """Test sampling rate application"""
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(sampling_rate=0.0)
        )
        mock_client = Mock(spec=APIClient)
        agent = MonitoringAgent(config, mock_client)
        
        agent.capture_request('/api/test', 'GET', 200, 100)
        
        data = agent.get_buffered_data()
        assert len(data.metrics) == 0


class TestErrorCapture:
    """Test error capture functionality"""
    
    def test_capture_error_with_context(self, agent):
        """Test capturing error with context"""
        try:
            raise ValueError('Test error')
        except ValueError as e:
            context = {'user_id': '123', 'action': 'login'}
            agent.capture_error(e, context)
        
        data = agent.get_buffered_data()
        assert len(data.errors) == 1
        
        error = data.errors[0]
        assert error.message == 'Test error'
        assert 'ValueError' in error.stack
        assert error.context == context
        assert error.timestamp > 0
    
    def test_capture_error_without_context(self, agent):
        """Test capturing error without context"""
        try:
            raise RuntimeError('Another error')
        except RuntimeError as e:
            agent.capture_error(e)
        
        data = agent.get_buffered_data()
        assert len(data.errors) == 1
        
        error = data.errors[0]
        assert error.message == 'Another error'
        assert error.context is None


class TestSystemMetrics:
    """Test system metric collection"""
    
    def test_collect_system_metrics(self, agent):
        """Test collecting system metrics"""
        agent.collect_system_metrics()
        
        data = agent.get_buffered_data()
        
        # Should have memory metrics
        memory_metrics = [m for m in data.metrics if 'memory' in m.name]
        assert len(memory_metrics) > 0
        
        # Should have CPU metrics
        cpu_metrics = [m for m in data.metrics if m.name == 'system.cpu.usage']
        # CPU metric might not be present on first call
        # assert len(cpu_metrics) >= 0
    
    def test_monitoring_loop(self, agent):
        """Test monitoring loop collects metrics"""
        agent.start_monitoring()
        
        # Wait for at least one collection cycle
        time.sleep(1.5)
        
        data = agent.get_buffered_data()
        
        # Should have collected some metrics
        assert len(data.metrics) > 0
        
        agent.stop_monitoring()
    
    def test_throughput_calculation(self, agent):
        """Test throughput metric calculation"""
        agent.start_monitoring()
        
        # Simulate some requests
        agent.capture_request('/api/test1', 'GET', 200, 50)
        agent.capture_request('/api/test2', 'POST', 201, 75)
        
        # Wait for collection cycle
        time.sleep(1.5)
        
        data = agent.get_buffered_data()
        throughput_metric = next(
            (m for m in data.metrics if m.name == 'http.throughput'),
            None
        )
        
        assert throughput_metric is not None
        assert throughput_metric.value >= 0
        
        agent.stop_monitoring()


class TestBufferManagement:
    """Test buffer management functionality"""
    
    def test_buffer_stats(self, agent):
        """Test getting buffer statistics"""
        agent.capture_request('/api/test', 'GET', 200, 100)
        agent.capture_error(Exception('Test'))
        
        stats = agent.get_buffer_stats()
        assert stats['metrics_count'] > 0
        assert stats['errors_count'] > 0
    
    def test_clear_buffer(self, agent):
        """Test clearing buffer"""
        agent.capture_request('/api/test', 'GET', 200, 100)
        agent.capture_error(Exception('Test'))
        
        stats = agent.get_buffer_stats()
        assert stats['metrics_count'] > 0
        assert stats['errors_count'] > 0
        
        agent.clear_buffer()
        
        stats = agent.get_buffer_stats()
        assert stats['metrics_count'] == 0
        assert stats['errors_count'] == 0
    
    def test_should_flush_time_threshold(self):
        """Test flush trigger based on time threshold"""
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(interval=100)
        )
        mock_client = Mock(spec=APIClient)
        agent = MonitoringAgent(config, mock_client)
        
        agent.capture_request('/api/test', 'GET', 200, 100)
        
        # Should not flush immediately
        assert not agent.should_flush()
        
        # Should flush after interval
        time.sleep(0.15)
        assert agent.should_flush()
    
    def test_should_flush_capacity(self):
        """Test flush trigger based on buffer capacity"""
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(buffer_size=2)
        )
        mock_client = Mock(spec=APIClient)
        mock_client.transmit_monitoring_data = Mock()
        agent = MonitoringAgent(config, mock_client)
        
        # Fill buffer (each request creates 2 metrics)
        agent.capture_request('/api/test', 'GET', 200, 100)
        
        # Buffer should have triggered auto-flush, so transmit should have been called
        assert mock_client.transmit_monitoring_data.called
    
    def test_buffer_overflow(self):
        """Test buffer overflow behavior"""
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(buffer_size=5)
        )
        mock_client = Mock(spec=APIClient)
        mock_client.transmit_monitoring_data = Mock()
        agent = MonitoringAgent(config, mock_client)
        
        # Add more items than buffer capacity
        for i in range(10):
            agent.capture_request(f'/api/test{i}', 'GET', 200, 100)
        
        # Buffer should have auto-flushed multiple times
        # Each request creates 2 metrics, so with buffer size 5, it should flush after 3 requests
        assert mock_client.transmit_monitoring_data.call_count >= 1


class TestMonitoringLifecycle:
    """Test monitoring lifecycle"""
    
    def test_start_stop_monitoring(self, agent):
        """Test starting and stopping monitoring"""
        agent.start_monitoring()
        
        # Starting again should be idempotent
        agent.start_monitoring()
        
        agent.stop_monitoring()
        
        # Stopping again should be safe
        agent.stop_monitoring()
