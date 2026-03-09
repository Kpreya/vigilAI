"""
Verification tests for non-blocking operations (Task 10.3)

These tests verify that:
- All monitoring operations are asynchronous
- SDK doesn't block host application request/response cycle
"""

import time
import pytest
from unittest.mock import Mock, patch
from vigilai import VigilAI
from vigilai.types import VigilAIConfig


@pytest.fixture
def vigilai_instance():
    """Create a VigilAI instance for testing"""
    config = VigilAIConfig(
        api_key='test-api-key'
    )
    
    vigilai = VigilAI(config)
    
    # Mock the API client to avoid actual network calls
    vigilai.api_client.validate_api_key = Mock()
    vigilai.api_client.transmit_monitoring_data = Mock()
    
    return vigilai


def test_track_metric_should_not_block_execution(vigilai_instance):
    """Verify that trackMetric does not block execution"""
    vigilai_instance._initialized = True
    
    start_time = time.time()
    
    # Track multiple metrics
    for i in range(100):
        vigilai_instance.track_metric('test.metric', float(i))
    
    duration = (time.time() - start_time) * 1000  # Convert to ms
    
    # Should complete almost instantly (< 50ms) since operations are deferred to threads
    assert duration < 50, f"trackMetric took {duration}ms, expected < 50ms"


def test_track_error_should_not_block_execution(vigilai_instance):
    """Verify that trackError does not block execution"""
    vigilai_instance._initialized = True
    
    start_time = time.time()
    
    # Track multiple errors
    for i in range(100):
        vigilai_instance.track_error(Exception(f"Test error {i}"))
    
    duration = (time.time() - start_time) * 1000  # Convert to ms
    
    # Should complete almost instantly (< 50ms) since operations are deferred to threads
    assert duration < 50, f"trackError took {duration}ms, expected < 50ms"


def test_monitoring_operations_should_not_throw_errors(vigilai_instance):
    """Verify that monitoring operations don't throw errors to host application"""
    vigilai_instance._initialized = True
    
    # Mock transmit_data to raise an error
    vigilai_instance.monitoring_agent.transmit_data = Mock(side_effect=Exception("Network error"))
    
    # These operations should not throw even if internal operations fail
    try:
        vigilai_instance.track_metric('test.metric', 123.0)
        vigilai_instance.track_error(Exception("Test error"))
        # Give threads time to execute
        time.sleep(0.1)
    except Exception as e:
        pytest.fail(f"Monitoring operations should not throw errors: {e}")


def test_health_check_should_execute_synchronously_and_quickly(vigilai_instance):
    """Verify that health check executes synchronously and quickly"""
    start_time = time.time()
    
    health = vigilai_instance.health_check()
    
    duration = (time.time() - start_time) * 1000  # Convert to ms
    
    # Health check should be synchronous and fast
    assert health is not None
    assert health.status in ['healthy', 'degraded', 'unhealthy']
    assert duration < 10, f"Health check took {duration}ms, expected < 10ms"


def test_django_middleware_should_not_block_request_processing(vigilai_instance):
    """Verify that Django middleware does not block request processing"""
    vigilai_instance._initialized = True
    
    middleware_class = vigilai_instance.django_middleware()
    
    # Create mock request and response
    mock_request = Mock()
    mock_request.method = 'GET'
    mock_request.path = '/test'
    mock_request.META = {}
    mock_request.GET = {}
    
    mock_response = Mock()
    mock_response.status_code = 200
    
    def mock_get_response(request):
        return mock_response
    
    middleware = middleware_class(mock_get_response)
    
    start_time = time.time()
    
    # Execute middleware
    response = middleware(mock_request)
    
    duration = (time.time() - start_time) * 1000  # Convert to ms
    
    # Middleware should return response immediately without blocking
    assert response == mock_response
    assert duration < 10, f"Middleware took {duration}ms, expected < 10ms"


def test_fastapi_middleware_should_not_block_request_processing(vigilai_instance):
    """Verify that FastAPI middleware does not block request processing"""
    import asyncio
    
    vigilai_instance._initialized = True
    
    middleware = vigilai_instance.fastapi_middleware()
    
    # Create mock request
    mock_request = Mock()
    mock_request.method = 'GET'
    mock_request.url = Mock()
    mock_request.url.path = '/test'
    mock_request.headers = Mock()
    mock_request.headers.items = Mock(return_value=[])
    mock_request.query_params = {}
    
    mock_response = Mock()
    mock_response.status_code = 200
    
    async def mock_call_next(request):
        return mock_response
    
    async def run_test():
        start_time = time.time()
        
        # Execute middleware
        response = await middleware(mock_request, mock_call_next)
        
        duration = (time.time() - start_time) * 1000  # Convert to ms
        
        # Middleware should return response quickly without blocking
        assert response == mock_response
        assert duration < 20, f"Middleware took {duration}ms, expected < 20ms"
    
    asyncio.run(run_test())


def test_monitoring_agent_operations_are_asynchronous(vigilai_instance):
    """Verify that monitoring agent operations are asynchronous"""
    vigilai_instance._initialized = True
    
    monitoring_agent = vigilai_instance.monitoring_agent
    
    start_time = time.time()
    
    # Capture multiple requests
    for i in range(100):
        monitoring_agent.capture_request('/test', 'GET', 200, 10.0)
    
    duration = (time.time() - start_time) * 1000  # Convert to ms
    
    # Should complete quickly since operations are buffered
    assert duration < 50, f"Capture operations took {duration}ms, expected < 50ms"
