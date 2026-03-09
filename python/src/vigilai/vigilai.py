"""Main VigilAI SDK class"""

from typing import Any, Dict, Optional
from .types import VigilAIConfig, HealthStatus, ComponentHealth
from .config import ConfigLoader
from .api_client import APIClient
from .monitoring_agent import MonitoringAgent


class VigilAI:
    """Main VigilAI SDK class"""

    def __init__(self, config: VigilAIConfig):
        """Initialize the SDK with configuration"""
        # Load and validate configuration
        self.config = ConfigLoader.load(config)

        # Create API client
        self.api_client = APIClient(self.config.api_key)
        
        # Create monitoring agent
        self.monitoring_agent = MonitoringAgent(self.config, self.api_client)

        # Track initialization state
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the SDK and validate API key"""
        if self._initialized:
            return

        # Validate API key with backend
        self.api_client.validate_api_key()
        
        # Start monitoring
        self.monitoring_agent.start_monitoring()

        self._initialized = True

    def get_config(self) -> VigilAIConfig:
        """Get the resolved configuration"""
        return self.config

    def is_initialized(self) -> bool:
        """Check if SDK is initialized"""
        return self._initialized
    
    def get_monitoring_agent(self) -> MonitoringAgent:
        """Get monitoring agent (for testing)"""
        return self.monitoring_agent

    def django_middleware(self) -> Any:
        """
        Django middleware for request/response capture and error tracking.
        
        Returns a middleware class that can be added to Django's MIDDLEWARE setting.
        
        Usage:
            # In Django settings.py
            vigilai = VigilAI(config)
            MIDDLEWARE = [
                # ... other middleware
                vigilai.django_middleware(),
            ]
        """
        from threading import Thread
        
        vigilai_instance = self
        
        class VigilAIDjangoMiddleware:
            """Django middleware for VigilAI monitoring"""
            
            def __init__(self, get_response):
                self.get_response = get_response
            
            def __call__(self, request):
                # Record start time for response time calculation
                import time
                start_time = time.time()
                
                # Track if error was captured to avoid duplicate captures
                error_captured = False
                
                try:
                    # Process the request
                    response = self.get_response(request)
                    
                    # Calculate duration in milliseconds
                    duration = (time.time() - start_time) * 1000
                    
                    # Extract request details
                    endpoint = self._get_endpoint(request)
                    method = request.method
                    status_code = response.status_code
                    
                    # Capture request metrics asynchronously (non-blocking)
                    Thread(
                        target=self._capture_request_safe,
                        args=(endpoint, method, status_code, duration),
                        daemon=True
                    ).start()
                    
                    return response
                    
                except Exception as error:
                    # Capture error asynchronously (non-blocking)
                    error_captured = True
                    duration = (time.time() - start_time) * 1000
                    
                    Thread(
                        target=self._capture_error_safe,
                        args=(error, request, duration),
                        daemon=True
                    ).start()
                    
                    # Re-raise the exception so Django's error handling can process it
                    raise
            
            def process_exception(self, request, exception):
                """
                Django middleware hook for exception processing.
                Called when a view raises an exception.
                """
                # Capture error asynchronously (non-blocking)
                Thread(
                    target=self._capture_error_safe,
                    args=(exception, request, None),
                    daemon=True
                ).start()
                
                # Return None to allow other middleware to process the exception
                return None
            
            def _get_endpoint(self, request) -> str:
                """Extract endpoint from request"""
                try:
                    # Try to get the URL pattern name
                    if hasattr(request, 'resolver_match') and request.resolver_match:
                        if request.resolver_match.route:
                            return f"/{request.resolver_match.route}"
                        elif request.resolver_match.url_name:
                            return request.resolver_match.url_name
                    # Fallback to path
                    return request.path or 'unknown'
                except Exception:
                    return 'unknown'
            
            def _capture_request_safe(
                self,
                endpoint: str,
                method: str,
                status_code: int,
                duration: float
            ) -> None:
                """Safely capture request metrics without throwing exceptions"""
                try:
                    vigilai_instance.monitoring_agent.capture_request(
                        endpoint, method, status_code, duration
                    )
                except Exception as e:
                    # Log error but don't throw - middleware should never crash the app
                    print(f"VigilAI: Failed to capture request metrics: {str(e)}")
            
            def _capture_error_safe(
                self,
                error: Exception,
                request,
                duration: Optional[float]
            ) -> None:
                """Safely capture error without throwing exceptions"""
                try:
                    context = {
                        'endpoint': self._get_endpoint(request),
                        'method': request.method,
                        'path': request.path,
                        'query_params': dict(request.GET) if hasattr(request, 'GET') else {},
                    }
                    
                    if duration is not None:
                        context['duration'] = duration
                    
                    # Add headers (excluding sensitive data)
                    if hasattr(request, 'META'):
                        context['headers'] = {
                            k: v for k, v in request.META.items()
                            if k.startswith('HTTP_') and 'AUTH' not in k.upper() and 'TOKEN' not in k.upper()
                        }
                    
                    vigilai_instance.monitoring_agent.capture_error(error, context)
                except Exception as e:
                    # Log error but don't throw
                    print(f"VigilAI: Failed to capture error: {str(e)}")
        
        return VigilAIDjangoMiddleware

    def fastapi_middleware(self) -> Any:
        """
        FastAPI middleware for request/response capture and error tracking.
        
        Returns a middleware function that can be added to FastAPI app.
        
        Usage:
            from fastapi import FastAPI
            
            vigilai = VigilAI(config)
            app = FastAPI()
            app.middleware("http")(vigilai.fastapi_middleware())
        """
        from threading import Thread
        import time
        
        vigilai_instance = self
        
        async def vigilai_fastapi_middleware(request, call_next):
            """FastAPI middleware for VigilAI monitoring"""
            start_time = time.time()
            
            try:
                # Process the request
                response = await call_next(request)
                
                # Calculate duration in milliseconds
                duration = (time.time() - start_time) * 1000
                
                # Extract request details
                endpoint = request.url.path
                method = request.method
                status_code = response.status_code
                
                # Capture request metrics asynchronously (non-blocking)
                Thread(
                    target=_capture_request_safe,
                    args=(vigilai_instance, endpoint, method, status_code, duration),
                    daemon=True
                ).start()
                
                return response
                
            except Exception as error:
                # Capture error asynchronously (non-blocking)
                duration = (time.time() - start_time) * 1000
                
                Thread(
                    target=_capture_error_safe,
                    args=(vigilai_instance, error, request, duration),
                    daemon=True
                ).start()
                
                # Re-raise the exception so FastAPI's error handling can process it
                raise
        
        def _capture_request_safe(
            vigilai_instance,
            endpoint: str,
            method: str,
            status_code: int,
            duration: float
        ) -> None:
            """Safely capture request metrics without throwing exceptions"""
            try:
                vigilai_instance.monitoring_agent.capture_request(
                    endpoint, method, status_code, duration
                )
            except Exception as e:
                # Log error but don't throw - middleware should never crash the app
                print(f"VigilAI: Failed to capture request metrics: {str(e)}")
        
        def _capture_error_safe(
            vigilai_instance,
            error: Exception,
            request,
            duration: float
        ) -> None:
            """Safely capture error without throwing exceptions"""
            try:
                context = {
                    'endpoint': request.url.path,
                    'method': request.method,
                    'path': request.url.path,
                    'query_params': dict(request.query_params) if hasattr(request, 'query_params') else {},
                    'duration': duration,
                }
                
                # Add headers (excluding sensitive data)
                if hasattr(request, 'headers'):
                    context['headers'] = {
                        k: v for k, v in request.headers.items()
                        if 'auth' not in k.lower() and 'token' not in k.lower()
                    }
                
                vigilai_instance.monitoring_agent.capture_error(error, context)
            except Exception as e:
                # Log error but don't throw
                print(f"VigilAI: Failed to capture error: {str(e)}")
        
        return vigilai_fastapi_middleware

    def track_metric(self, name: str, value: float) -> None:
        """
        Track a custom metric.
        Allows manual instrumentation for custom application metrics.
        
        Args:
            name: Metric name (e.g., 'user.login.count', 'cache.hit_rate')
            value: Numeric metric value
        
        Example:
            >>> vigilai.track_metric('user.login.count', 1)
            >>> vigilai.track_metric('cache.hit_rate', 0.95)
        """
        if not self._initialized:
            print("VigilAI: Cannot track metric - SDK not initialized")
            return
        
        # Capture metric asynchronously (non-blocking)
        from threading import Thread
        
        def _track_metric_safe():
            try:
                import time
                from .types import Metric
                
                timestamp = int(time.time() * 1000)
                metric = Metric(
                    name=name,
                    value=value,
                    timestamp=timestamp
                )
                
                # Push metric directly to the monitoring agent's buffer
                self.monitoring_agent.metrics_buffer.push(metric)
                
                # Check if buffer should be flushed
                if self.monitoring_agent.should_flush():
                    try:
                        self.monitoring_agent.transmit_data()
                    except Exception as e:
                        print(f"VigilAI: Failed to transmit data: {str(e)}")
            except Exception as e:
                print(f"VigilAI: Failed to track metric: {str(e)}")
        
        Thread(target=_track_metric_safe, daemon=True).start()

    def track_error(self, error: Exception, context: Optional[Dict[str, Any]] = None) -> None:
        """
        Track an error.
        Allows manual instrumentation for custom error tracking.
        
        Args:
            error: Exception object to track
            context: Optional context information about the error
        
        Example:
            >>> try:
            ...     # Some operation
            ... except Exception as error:
            ...     vigilai.track_error(error, {
            ...         'operation': 'database_query',
            ...         'user_id': '12345'
            ...     })
        """
        if not self._initialized:
            print("VigilAI: Cannot track error - SDK not initialized")
            return
        
        # Capture error asynchronously (non-blocking)
        from threading import Thread
        
        def _track_error_safe():
            try:
                self.monitoring_agent.capture_error(error, context)
            except Exception as e:
                print(f"VigilAI: Failed to track error: {str(e)}")
        
        Thread(target=_track_error_safe, daemon=True).start()

    async def shutdown(self) -> None:
        """Graceful shutdown"""
        # Stop monitoring
        self.monitoring_agent.stop_monitoring()
        
        # Flush any remaining data
        try:
            self.monitoring_agent.transmit_data()
        except Exception as e:
            print(f"Failed to flush data during shutdown: {str(e)}")
        
        self._initialized = False

    def health_check(self) -> HealthStatus:
        """Health check"""
        buffer_stats = self.monitoring_agent.get_buffer_stats()
        transmission_stats = self.monitoring_agent.get_transmission_stats()
        is_monitoring = self.monitoring_agent.is_monitoring()
        
        # Determine monitoring component health
        monitoring_health = ComponentHealth(
            status='up' if is_monitoring else 'down',
            last_success=transmission_stats.get('last_success'),
            last_error=transmission_stats.get('last_error')
        )
        
        # Calculate buffer size (total events in buffer)
        total_buffer_size = buffer_stats['metrics_count'] + buffer_stats['errors_count']
        max_buffer_size = self.config.monitoring.buffer_size * 2  # metrics + errors
        buffer_utilization = total_buffer_size / max_buffer_size if max_buffer_size > 0 else 0
        
        # Determine overall status
        success_rate = transmission_stats['success_rate']
        
        if not is_monitoring or success_rate < 0.5:
            overall_status = 'unhealthy'
        elif success_rate < 0.9 or buffer_utilization > 0.8:
            overall_status = 'degraded'
        else:
            overall_status = 'healthy'
        
        return HealthStatus(
            status=overall_status,
            components={
                'monitoring': monitoring_health,
                'anomalyDetection': ComponentHealth(status='up'),  # Not yet implemented
                'aiDiagnosis': ComponentHealth(status='up'),  # Not yet implemented
                'codeGeneration': ComponentHealth(status='up'),  # Not yet implemented
                'githubIntegration': ComponentHealth(status='up'),  # Not yet implemented
            },
            metrics={
                'bufferSize': float(total_buffer_size),
                'transmissionSuccessRate': success_rate,
                'averageOverhead': 0.0,  # TODO: Implement overhead tracking
            },
        )
