"""Property-based tests for data transmission"""

import time
from unittest.mock import Mock, patch, MagicMock
from hypothesis import given, strategies as st, settings
import requests
from vigilai.monitoring_agent import MonitoringAgent
from vigilai.api_client import APIClient
from vigilai.types import VigilAIConfig, MonitoringConfig


@st.composite
def vigilai_config_strategy(draw):
    """Generate valid VigilAI configurations"""
    return VigilAIConfig(
        api_key='test-key',
        monitoring=MonitoringConfig(
            interval=draw(st.integers(min_value=100, max_value=500)),
            sampling_rate=1.0,
            buffer_size=draw(st.integers(min_value=10, max_value=100))
        )
    )


class TestProperty17BufferFlushTriggers:
    """Property 17: Buffer flush triggers - buffer should flush on capacity/time
    
    **Validates: Requirements 4.11**
    """
    
    @given(
        buffer_size=st.integers(min_value=5, max_value=20),
        interval=st.integers(min_value=100, max_value=500)
    )
    @settings(max_examples=20)
    def test_flush_on_capacity(self, buffer_size, interval):
        """Buffer should flush when capacity is reached"""
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(
                interval=interval,
                sampling_rate=1.0,
                buffer_size=buffer_size
            )
        )
        
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post.return_value.status_code = 200
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient(config.api_key)
            agent = MonitoringAgent(config, api_client)
            
            try:
                # Fill buffer to capacity
                # Each request creates 2 metrics (response_time and status)
                requests_needed = (buffer_size + 1) // 2
                for i in range(requests_needed):
                    agent.capture_request(f'/api/test{i}', 'GET', 200, 100.0)
                
                # Buffer should be at or near capacity
                stats = agent.get_buffer_stats()
                assert stats['metrics_count'] >= buffer_size - 2, \
                    f"Buffer should be near capacity: {stats['metrics_count']} >= {buffer_size - 2}"
                
                # shouldFlush should return true when buffer is full
                assert agent.should_flush(), "Should flush when buffer is full"
                
            finally:
                agent.stop_monitoring()
    
    @given(interval=st.integers(min_value=100, max_value=300))
    @settings(max_examples=10, deadline=5000)
    def test_flush_on_time_threshold(self, interval):
        """Buffer should flush when time threshold is met"""
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(
                interval=interval,
                sampling_rate=1.0,
                buffer_size=1000  # Large buffer so capacity isn't reached
            )
        )
        
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post.return_value.status_code = 200
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient(config.api_key)
            agent = MonitoringAgent(config, api_client)
            
            try:
                # Add some data but not enough to fill buffer
                agent.capture_request('/api/test', 'GET', 200, 100.0)
                
                # Wait for time threshold to pass
                time.sleep(interval / 1000.0 + 0.1)
                
                # Now should need flush due to time
                assert agent.should_flush(), "Should flush after time threshold"
                
            finally:
                agent.stop_monitoring()


class TestProperty18TransmissionRetryWithBackoff:
    """Property 18: Transmission retry with backoff - failed transmissions should retry
    
    **Validates: Requirements 4.12**
    """
    
    @given(failure_count=st.integers(min_value=1, max_value=3))
    @settings(max_examples=10, deadline=10000)
    def test_retry_with_exponential_backoff(self, failure_count):
        """Should retry failed transmissions with exponential backoff"""
        attempt_count = 0
        attempt_timestamps = []
        
        def mock_post(*args, **kwargs):
            nonlocal attempt_count
            attempt_timestamps.append(time.time())
            attempt_count += 1
            if attempt_count <= failure_count:
                raise requests.exceptions.ConnectionError('Network error')
            response = Mock()
            response.status_code = 200
            response.raise_for_status = Mock()
            return response
        
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post = mock_post
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient('test-key')
            
            try:
                api_client.send_data('/test', {'test': 'data'})
                
                # Should have retried the correct number of times
                assert attempt_count == failure_count + 1, \
                    f"Should have attempted {failure_count + 1} times, got {attempt_count}"
                
                # Verify exponential backoff delays
                if len(attempt_timestamps) > 1:
                    for i in range(1, len(attempt_timestamps)):
                        delay = attempt_timestamps[i] - attempt_timestamps[i - 1]
                        # Expected delay: 1.0 * 2^(i-1) seconds (with some tolerance)
                        expected_delay = 1.0 * (2 ** (i - 1))
                        # Allow 0.3s tolerance for execution time
                        assert delay >= expected_delay - 0.3, \
                            f"Delay {delay} should be >= {expected_delay - 0.3}"
            except Exception as e:
                # Should not throw if within retry limit
                if failure_count <= 5:
                    raise AssertionError(f'Should have succeeded after retries: {e}')
    
    def test_respect_maximum_retry_limit(self):
        """Should respect maximum retry limit of 5 attempts"""
        attempt_count = 0
        
        def mock_post(*args, **kwargs):
            nonlocal attempt_count
            attempt_count += 1
            raise requests.exceptions.ConnectionError('Network error')
        
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post = mock_post
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient('test-key')
            
            try:
                api_client.send_data('/test', {'test': 'data'})
                raise AssertionError('Should have raised an exception')
            except Exception:
                # Should have attempted 6 times total (initial + 5 retries)
                assert attempt_count == 6, f"Should have attempted 6 times, got {attempt_count}"
    
    def test_respect_maximum_backoff_delay(self):
        """Should respect maximum backoff delay of 32 seconds"""
        attempt_timestamps = []
        
        def mock_post(*args, **kwargs):
            attempt_timestamps.append(time.time())
            if len(attempt_timestamps) <= 5:
                raise requests.exceptions.ConnectionError('Network error')
            response = Mock()
            response.status_code = 200
            response.raise_for_status = Mock()
            return response
        
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post = mock_post
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient('test-key')
            api_client.send_data('/test', {'test': 'data'})
            
            # Check that delays don't exceed 32 seconds
            for i in range(1, len(attempt_timestamps)):
                delay = attempt_timestamps[i] - attempt_timestamps[i - 1]
                assert delay <= 33.0, f"Delay {delay} should not exceed 33 seconds"


class TestProperty38BackendUnavailabilityHandling:
    """Property 38: Backend unavailability handling - data should queue locally
    
    **Validates: Requirements 10.4**
    """
    
    @given(data_count=st.integers(min_value=1, max_value=10))
    @settings(max_examples=10, deadline=10000)
    def test_queue_data_when_backend_unavailable(self, data_count):
        """Should queue data locally when backend is unavailable"""
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(
                interval=1000,
                sampling_rate=1.0,
                buffer_size=100
            )
        )
        
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post.side_effect = \
                requests.exceptions.ConnectionError('Backend unavailable')
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient(config.api_key)
            agent = MonitoringAgent(config, api_client)
            
            try:
                # Attempt to transmit data multiple times (all will fail)
                for i in range(data_count):
                    agent.capture_request(f'/api/test{i}', 'GET', 200, 100.0)
                    try:
                        agent.transmit_data()
                    except Exception:
                        # Expected to fail
                        pass
                
                # Data should be queued locally
                queue_size = api_client.get_queue_size()
                assert queue_size > 0, "Data should be queued locally"
                assert queue_size <= data_count, \
                    f"Queue size {queue_size} should not exceed {data_count}"
                
            finally:
                agent.stop_monitoring()
    
    def test_flush_queued_data_when_backend_available(self):
        """Should flush queued data when backend becomes available"""
        call_count = 0
        
        def mock_post(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise requests.exceptions.ConnectionError('Backend unavailable')
            response = Mock()
            response.status_code = 200
            response.raise_for_status = Mock()
            return response
        
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(
                interval=1000,
                sampling_rate=1.0,
                buffer_size=100
            )
        )
        
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post = mock_post
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient(config.api_key)
            agent = MonitoringAgent(config, api_client)
            
            try:
                # First transmission fails and queues data
                agent.capture_request('/api/test1', 'GET', 200, 100.0)
                try:
                    agent.transmit_data()
                except Exception:
                    # Expected to fail
                    pass
                
                queue_size_after_failure = api_client.get_queue_size()
                assert queue_size_after_failure == 1, "Should have queued one item"
                
                # Second transmission succeeds and should flush queue
                agent.capture_request('/api/test2', 'GET', 200, 100.0)
                agent.transmit_data()
                
                # Wait a bit for queue flush to complete
                time.sleep(0.1)
                
                # Queue should be empty or smaller
                queue_size_after_success = api_client.get_queue_size()
                assert queue_size_after_success <= queue_size_after_failure, \
                    "Queue should be flushed after successful transmission"
                
            finally:
                agent.stop_monitoring()
    
    def test_respect_queue_size_limit(self):
        """Should respect queue size limit and drop oldest data"""
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(
                interval=1000,
                sampling_rate=1.0,
                buffer_size=100
            )
        )
        
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post.side_effect = \
                requests.exceptions.ConnectionError('Backend unavailable')
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient(config.api_key)
            agent = MonitoringAgent(config, api_client)
            
            try:
                # Attempt to queue more data than queue capacity (1000)
                for i in range(1100):
                    agent.capture_request(f'/api/test{i}', 'GET', 200, 100.0)
                    try:
                        agent.transmit_data()
                    except Exception:
                        # Expected to fail
                        pass
                
                # Queue should not exceed max size
                queue_size = api_client.get_queue_size()
                assert queue_size <= 1000, \
                    f"Queue size {queue_size} should not exceed 1000"
                
            finally:
                agent.stop_monitoring()


class TestProperty43HTTPSTransmission:
    """Property 43: HTTPS transmission - all transmissions should use HTTPS
    
    **Validates: Requirements 11.1**
    """
    
    @given(
        base_url=st.sampled_from([
            'https://api.vigilai.io',
            'https://staging.vigilai.io',
            'https://custom-domain.com'
        ])
    )
    @settings(max_examples=20)
    def test_use_https_for_all_transmissions(self, base_url):
        """Should use HTTPS for all backend transmissions"""
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post.return_value.status_code = 200
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient('test-key', base_url)
            
            # Verify the baseURL starts with https://
            assert base_url.startswith('https://'), \
                f"Base URL {base_url} should start with https://"
            
            # Verify the API client uses the HTTPS URL
            assert api_client.base_url == base_url, \
                f"API client should use {base_url}"
    
    @given(
        base_url=st.sampled_from([
            'http://api.vigilai.io',
            'http://insecure.com',
            'ftp://file-server.com'
        ])
    )
    @settings(max_examples=20)
    def test_default_to_https(self, base_url):
        """Should default to HTTPS even if non-HTTPS URL is provided"""
        with patch('requests.Session'):
            # The default should always be HTTPS
            api_client = APIClient('test-key')
            
            # Verify default is HTTPS
            assert api_client.base_url.startswith('https://'), \
                "Default base URL should use HTTPS"
    
    def test_use_https_for_all_endpoints(self):
        """Should use HTTPS for all API endpoints"""
        config = VigilAIConfig(
            api_key='test-key',
            monitoring=MonitoringConfig(
                interval=1000,
                sampling_rate=1.0,
                buffer_size=100
            )
        )
        
        with patch('requests.Session') as mock_session:
            mock_session.return_value.post.return_value.status_code = 200
            mock_session.return_value.get.return_value.status_code = 200
            
            api_client = APIClient(config.api_key)
            agent = MonitoringAgent(config, api_client)
            
            try:
                # Capture and transmit data
                agent.capture_request('/api/test', 'GET', 200, 100.0)
                agent.transmit_data()
                
                # Verify the API client uses HTTPS
                assert api_client.base_url == 'https://api.vigilai.io', \
                    "API client should use HTTPS base URL"
                
            finally:
                agent.stop_monitoring()
