"""
Example: Using VigilAI SDK with Django

This example demonstrates how to integrate the VigilAI SDK into a Django application
for automatic request/response monitoring and error capture.
"""

# ============================================================================
# Step 1: Install the SDK
# ============================================================================
# pip install vigilai-sdk


# ============================================================================
# Step 2: Initialize the SDK (typically in your Django project's __init__.py or settings.py)
# ============================================================================

from vigilai import VigilAI, VigilAIConfig

# Initialize VigilAI SDK
vigilai = VigilAI(VigilAIConfig(
    api_key="your-api-key-here",
    github_token="your-github-token",  # Optional: for automatic PR creation
    github_owner="your-github-username",
    github_repo="your-repo-name",
    monitoring_interval=60000,  # 60 seconds
    thresholds={
        'response_time': 1000,  # ms
        'error_rate': 5,  # percentage
        'memory_usage': 500,  # MB
        'cpu_usage': 80,  # percentage
    }
))


# ============================================================================
# Step 3: Add the middleware to Django settings
# ============================================================================

# In your settings.py file:
"""
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Add VigilAI middleware
    vigilai.django_middleware(),
]
"""


# ============================================================================
# Step 4: Your Django views work as normal
# ============================================================================

# Example Django view (in views.py):
"""
from django.http import JsonResponse
from django.views import View

class UserListView(View):
    def get(self, request):
        # Your normal view logic
        users = [
            {'id': 1, 'name': 'Alice'},
            {'id': 2, 'name': 'Bob'},
        ]
        return JsonResponse({'users': users})

class UserDetailView(View):
    def get(self, request, user_id):
        # Simulate some processing
        user = {'id': user_id, 'name': f'User {user_id}'}
        return JsonResponse(user)
"""


# ============================================================================
# Step 5: The SDK automatically monitors your application
# ============================================================================

# The middleware will automatically:
# - Capture HTTP request/response metrics (response time, status codes, endpoints)
# - Capture unhandled errors with full stack traces
# - Monitor system resources (CPU, memory)
# - Detect anomalies and create incidents
# - Generate AI-powered diagnoses
# - Create GitHub pull requests with fixes (if configured)


# ============================================================================
# Step 6: Manual instrumentation (optional)
# ============================================================================

# You can also manually track custom metrics and errors:
"""
from django.http import JsonResponse

def my_view(request):
    try:
        # Your business logic
        result = perform_complex_operation()
        
        # Track custom metric
        vigilai.track_metric('operation.duration', result['duration'])
        
        return JsonResponse(result)
    except Exception as e:
        # Manually track error with context
        vigilai.track_error(e, {
            'user_id': request.user.id,
            'operation': 'complex_operation',
        })
        raise
"""


# ============================================================================
# Step 7: Graceful shutdown (optional)
# ============================================================================

# In your Django app's ready() method or signal handler:
"""
from django.apps import AppConfig
from django.core.signals import request_finished
from django.dispatch import receiver

class MyAppConfig(AppConfig):
    name = 'myapp'
    
    def ready(self):
        # Register shutdown handler
        import atexit
        import asyncio
        
        def shutdown_vigilai():
            asyncio.run(vigilai.shutdown())
        
        atexit.register(shutdown_vigilai)
"""


# ============================================================================
# Configuration via environment variables (alternative)
# ============================================================================

# You can also configure via environment variables:
"""
# .env file or environment
VIGILAI_API_KEY=your-api-key-here
VIGILAI_GITHUB_TOKEN=your-github-token
VIGILAI_GITHUB_OWNER=your-github-username
VIGILAI_GITHUB_REPO=your-repo-name
VIGILAI_MONITORING_INTERVAL=60000
VIGILAI_THRESHOLD_RESPONSE_TIME=1000
VIGILAI_THRESHOLD_ERROR_RATE=5
VIGILAI_THRESHOLD_MEMORY_USAGE=500
VIGILAI_THRESHOLD_CPU_USAGE=80

# Then in your code:
from vigilai import VigilAI, VigilAIConfig

vigilai = VigilAI(VigilAIConfig(
    api_key=None  # Will be loaded from VIGILAI_API_KEY env var
))
"""


# ============================================================================
# What gets monitored automatically
# ============================================================================

# Request Metrics:
# - http.response_time: Response time in milliseconds
# - http.status: HTTP status code
# - http.throughput: Requests per second

# System Metrics:
# - system.memory.rss: Memory usage in MB
# - system.cpu.usage: CPU usage percentage

# Error Events:
# - Full error message
# - Complete stack trace
# - Request context (endpoint, method, headers, query params)

# All metrics include tags for filtering:
# - endpoint: The URL pattern or path
# - method: HTTP method (GET, POST, etc.)
# - status: HTTP status code


# ============================================================================
# Advanced: Custom Django middleware configuration
# ============================================================================

# If you need more control, you can create a custom middleware class:
"""
from vigilai import VigilAI, VigilAIConfig

vigilai = VigilAI(VigilAIConfig(api_key="your-api-key"))

class CustomVigilAIMiddleware:
    def __init__(self, get_response):
        self.vigilai_middleware = vigilai.django_middleware()(get_response)
        self.get_response = get_response
    
    def __call__(self, request):
        # Add custom logic before VigilAI middleware
        if request.path.startswith('/admin/'):
            # Skip monitoring for admin pages
            return self.get_response(request)
        
        # Use VigilAI middleware
        return self.vigilai_middleware(request)
    
    def process_exception(self, request, exception):
        # Custom exception handling
        if isinstance(exception, PermissionError):
            # Don't track permission errors
            return None
        
        # Use VigilAI's exception handler
        return self.vigilai_middleware.process_exception(request, exception)
"""


if __name__ == "__main__":
    print("This is an example file demonstrating VigilAI Django integration.")
    print("See the comments above for usage instructions.")
