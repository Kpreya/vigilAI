"""Manual tests for Django middleware integration"""

import time
from unittest.mock import Mock, MagicMock, patch
from vigilai import VigilAI, VigilAIConfig


def test_django_middleware_basic_request():
    """Test that Django middleware captures basic request metrics"""
    # Create SDK instance
    config = VigilAIConfig(api_key="test-key-123")
    
    with patch.object(config, 'api_key', 'test-key-123'):
        vigilai = VigilAI(config)
        
        # Get the middleware class
        middleware_class = vigilai.django_middleware()
        
        # Create mock Django request and response
        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.path = "/api/test"
        mock_request.GET = {}
        mock_request.META = {'HTTP_USER_AGENT': 'test-agent'}
        mock_request.resolver_match = None
        
        mock_response = Mock()
        mock_response.status_code = 200
        
        # Create mock get_response function
        def mock_get_response(request):
            time.sleep(0.01)  # Simulate some processing time
            return mock_response
        
        # Instantiate middleware
        middleware = middleware_class(mock_get_response)
        
        # Process request
        response = middleware(mock_request)
        
        # Verify response is returned correctly
        assert response == mock_response
        assert response.status_code == 200
        
        # Give async thread time to capture metrics
        time.sleep(0.1)
        
        # Verify metrics were captured
        buffer_stats = vigilai.monitoring_agent.get_buffer_stats()
        assert buffer_stats['metrics_count'] > 0, "Metrics should be captured"
        
        print("✓ Django middleware basic request test passed")


def test_django_middleware_error_capture():
    """Test that Django middleware captures errors"""
    # Create SDK instance
    config = VigilAIConfig(api_key="test-key-123")
    
    with patch.object(config, 'api_key', 'test-key-123'):
        vigilai = VigilAI(config)
        
        # Get the middleware class
        middleware_class = vigilai.django_middleware()
        
        # Create mock Django request
        mock_request = Mock()
        mock_request.method = "POST"
        mock_request.path = "/api/error"
        mock_request.GET = {}
        mock_request.META = {'HTTP_USER_AGENT': 'test-agent'}
        mock_request.resolver_match = None
        
        # Create mock get_response that raises an error
        def mock_get_response_with_error(request):
            raise ValueError("Test error from view")
        
        # Instantiate middleware
        middleware = middleware_class(mock_get_response_with_error)
        
        # Process request - should raise the error
        try:
            middleware(mock_request)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert str(e) == "Test error from view"
        
        # Give async thread time to capture error
        time.sleep(0.1)
        
        # Verify error was captured
        buffer_stats = vigilai.monitoring_agent.get_buffer_stats()
        assert buffer_stats['errors_count'] > 0, "Error should be captured"
        
        # Verify error details
        buffered_data = vigilai.monitoring_agent.get_buffered_data()
        assert len(buffered_data.errors) > 0
        error_event = buffered_data.errors[0]
        assert "Test error from view" in error_event.message
        assert error_event.context is not None
        assert error_event.context['method'] == 'POST'
        assert error_event.context['endpoint'] == '/api/error'
        
        print("✓ Django middleware error capture test passed")


def test_django_middleware_process_exception():
    """Test that Django middleware process_exception hook works"""
    # Create SDK instance
    config = VigilAIConfig(api_key="test-key-123")
    
    with patch.object(config, 'api_key', 'test-key-123'):
        vigilai = VigilAI(config)
        
        # Get the middleware class
        middleware_class = vigilai.django_middleware()
        
        # Create mock Django request
        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.path = "/api/exception"
        mock_request.GET = {}
        mock_request.META = {}
        mock_request.resolver_match = None
        
        # Instantiate middleware
        mock_get_response = Mock()
        middleware = middleware_class(mock_get_response)
        
        # Call process_exception
        test_exception = RuntimeError("Test exception")
        result = middleware.process_exception(mock_request, test_exception)
        
        # Should return None to allow other middleware to process
        assert result is None
        
        # Give async thread time to capture error
        time.sleep(0.1)
        
        # Verify error was captured
        buffer_stats = vigilai.monitoring_agent.get_buffer_stats()
        assert buffer_stats['errors_count'] > 0, "Error should be captured"
        
        print("✓ Django middleware process_exception test passed")


def test_django_middleware_with_resolver_match():
    """Test that Django middleware extracts endpoint from resolver_match"""
    # Create SDK instance
    config = VigilAIConfig(api_key="test-key-123")
    
    with patch.object(config, 'api_key', 'test-key-123'):
        vigilai = VigilAI(config)
        
        # Get the middleware class
        middleware_class = vigilai.django_middleware()
        
        # Create mock Django request with resolver_match
        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.path = "/api/users/123"
        mock_request.GET = {}
        mock_request.META = {}
        
        # Mock resolver_match with route
        mock_resolver = Mock()
        mock_resolver.route = "api/users/<int:id>"
        mock_resolver.url_name = "user-detail"
        mock_request.resolver_match = mock_resolver
        
        mock_response = Mock()
        mock_response.status_code = 200
        
        def mock_get_response(request):
            return mock_response
        
        # Instantiate middleware
        middleware = middleware_class(mock_get_response)
        
        # Process request
        response = middleware(mock_request)
        
        # Give async thread time to capture metrics
        time.sleep(0.1)
        
        # Verify metrics were captured with correct endpoint
        buffered_data = vigilai.monitoring_agent.get_buffered_data()
        assert len(buffered_data.metrics) > 0
        
        # Find the response time metric
        response_time_metrics = [
            m for m in buffered_data.metrics 
            if m.name == 'http.response_time'
        ]
        assert len(response_time_metrics) > 0
        
        # Check that endpoint was extracted from resolver_match
        metric = response_time_metrics[0]
        assert metric.tags is not None
        assert '/api/users/<int:id>' in metric.tags['endpoint']
        
        print("✓ Django middleware resolver_match test passed")


def test_django_middleware_error_isolation():
    """Test that middleware errors don't crash the application"""
    # Create SDK instance
    config = VigilAIConfig(api_key="test-key-123")
    
    with patch.object(config, 'api_key', 'test-key-123'):
        vigilai = VigilAI(config)
        
        # Mock the monitoring agent to raise an error
        original_capture = vigilai.monitoring_agent.capture_request
        
        def failing_capture(*args, **kwargs):
            raise RuntimeError("Monitoring agent failure")
        
        vigilai.monitoring_agent.capture_request = failing_capture
        
        # Get the middleware class
        middleware_class = vigilai.django_middleware()
        
        # Create mock Django request
        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.path = "/api/test"
        mock_request.GET = {}
        mock_request.META = {}
        mock_request.resolver_match = None
        
        mock_response = Mock()
        mock_response.status_code = 200
        
        def mock_get_response(request):
            return mock_response
        
        # Instantiate middleware
        middleware = middleware_class(mock_get_response)
        
        # Process request - should not raise despite monitoring failure
        response = middleware(mock_request)
        
        # Verify response is still returned correctly
        assert response == mock_response
        assert response.status_code == 200
        
        # Restore original method
        vigilai.monitoring_agent.capture_request = original_capture
        
        print("✓ Django middleware error isolation test passed")


if __name__ == "__main__":
    print("\nRunning Django middleware tests...\n")
    
    test_django_middleware_basic_request()
    test_django_middleware_error_capture()
    test_django_middleware_process_exception()
    test_django_middleware_with_resolver_match()
    test_django_middleware_error_isolation()
    
    print("\n✓ All Django middleware tests passed!\n")
