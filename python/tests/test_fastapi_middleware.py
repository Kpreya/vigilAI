"""
Basic tests for FastAPI middleware integration.
"""

from vigilai import VigilAI, VigilAIConfig
import time


class MockRequest:
    """Mock FastAPI request object"""
    def __init__(self, path="/test", method="GET"):
        self.method = method
        self.url = type('obj', (object,), {'path': path})()
        self.query_params = {}
        self.headers = {"user-agent": "test"}


class MockResponse:
    """Mock FastAPI response object"""
    def __init__(self, status_code=200):
        self.status_code = status_code


async def test_fastapi_middleware_basic_request():
    """Test that FastAPI middleware captures basic request metrics"""
    # Create SDK instance
    config = VigilAIConfig(api_key="test-key")
    vigilai = VigilAI(config)
    
    try:
        # Get the middleware function
        middleware = vigilai.fastapi_middleware()
        
        # Create mock request
        request = MockRequest(path="/api/test", method="GET")
        
        # Create a mock call_next function
        async def call_next(req):
            return MockResponse(status_code=200)
        
        # Call middleware
        response = await middleware(request, call_next)
        
        # Give async thread time to capture metrics
        time.sleep(0.1)
        
        # Verify response
        assert response.status_code == 200
        
        # Verify metrics were captured
        buffer_stats = vigilai.monitoring_agent.get_buffer_stats()
        assert buffer_stats['metrics_count'] > 0, "Should have captured request metrics"
        
        print("✓ FastAPI middleware basic request test passed")
        
    finally:
        await vigilai.shutdown()


async def test_fastapi_middleware_error_capture():
    """Test that FastAPI middleware captures errors"""
    # Create SDK instance
    config = VigilAIConfig(api_key="test-key")
    vigilai = VigilAI(config)
    
    try:
        # Get the middleware function
        middleware = vigilai.fastapi_middleware()
        
        # Create mock request
        request = MockRequest(path="/api/error", method="POST")
        
        # Create a mock call_next function that raises an error
        async def call_next(req):
            raise ValueError("Test error")
        
        # Call middleware and expect error
        try:
            await middleware(request, call_next)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert str(e) == "Test error"
        
        # Give async thread time to capture error
        time.sleep(0.1)
        
        # Verify error was captured
        buffer_stats = vigilai.monitoring_agent.get_buffer_stats()
        assert buffer_stats['errors_count'] > 0, "Should have captured error"
        
        print("✓ FastAPI middleware error capture test passed")
        
    finally:
        await vigilai.shutdown()


async def test_fastapi_middleware_error_isolation():
    """Test that middleware errors don't crash the application"""
    # Create SDK instance with invalid config to trigger internal errors
    config = VigilAIConfig(api_key="test-key")
    vigilai = VigilAI(config)
    
    # Break the monitoring agent to simulate internal error
    original_capture = vigilai.monitoring_agent.capture_request
    vigilai.monitoring_agent.capture_request = lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("Internal error"))
    
    try:
        # Get the middleware function
        middleware = vigilai.fastapi_middleware()
        
        # Create mock request
        request = MockRequest(path="/api/test", method="GET")
        
        # Create a mock call_next function
        async def call_next(req):
            return MockResponse(status_code=200)
        
        # Call middleware - should not crash despite internal error
        response = await middleware(request, call_next)
        
        # Give async thread time to attempt capture
        time.sleep(0.1)
        
        # Verify response still works
        assert response.status_code == 200
        
        print("✓ FastAPI middleware error isolation test passed")
        
    finally:
        # Restore original method
        vigilai.monitoring_agent.capture_request = original_capture
        await vigilai.shutdown()


if __name__ == "__main__":
    import asyncio
    
    print("\nRunning FastAPI middleware tests...\n")
    
    asyncio.run(test_fastapi_middleware_basic_request())
    asyncio.run(test_fastapi_middleware_error_capture())
    asyncio.run(test_fastapi_middleware_error_isolation())
    
    print("\n✓ All FastAPI middleware tests passed!\n")
