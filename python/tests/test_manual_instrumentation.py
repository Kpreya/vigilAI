"""
Unit tests for manual instrumentation API
Tests track_metric() and track_error() methods
"""

import pytest
import time
from unittest.mock import Mock, patch
from vigilai.vigilai import VigilAI
from vigilai.types import VigilAIConfig


class TestManualInstrumentation:
    """Test manual instrumentation API"""

    def setup_method(self):
        """Set up test fixtures"""
        self.config = VigilAIConfig(api_key='test-api-key-12345')
        self.vigilai = VigilAI(self.config)

    def teardown_method(self):
        """Clean up after tests"""
        if self.vigilai.is_initialized():
            import asyncio
            asyncio.run(self.vigilai.shutdown())

    def test_track_metric_when_initialized(self):
        """Should track a custom metric when SDK is initialized"""
        # Mock API validation
        with patch.object(self.vigilai.api_client, 'validate_api_key', return_value=True):
            import asyncio
            asyncio.run(self.vigilai.initialize())

            # Track a custom metric
            self.vigilai.track_metric('user.login.count', 1.0)

            # Wait for async operation
            time.sleep(0.1)

            # Verify metric was added to buffer
            stats = self.vigilai.monitoring_agent.get_buffer_stats()
            assert stats['metrics_count'] > 0

    def test_track_metric_not_initialized(self):
        """Should not throw when SDK is not initialized"""
        # Should not raise exception
        self.vigilai.track_metric('test.metric', 100.0)

    def test_track_multiple_metrics(self):
        """Should track multiple metrics"""
        with patch.object(self.vigilai.api_client, 'validate_api_key', return_value=True):
            import asyncio
            asyncio.run(self.vigilai.initialize())

            # Track multiple metrics
            self.vigilai.track_metric('cache.hit_rate', 0.95)
            self.vigilai.track_metric('queue.size', 42.0)
            self.vigilai.track_metric('response.time', 123.45)

            # Wait for async operations
            time.sleep(0.1)

            stats = self.vigilai.monitoring_agent.get_buffer_stats()
            assert stats['metrics_count'] > 0

    def test_track_error_when_initialized(self):
        """Should track an error when SDK is initialized"""
        with patch.object(self.vigilai.api_client, 'validate_api_key', return_value=True):
            import asyncio
            asyncio.run(self.vigilai.initialize())

            # Track an error
            test_error = Exception('Test error')
            self.vigilai.track_error(test_error)

            # Wait for async operation
            time.sleep(0.1)

            # Verify error was added to buffer
            stats = self.vigilai.monitoring_agent.get_buffer_stats()
            assert stats['errors_count'] > 0

    def test_track_error_with_context(self):
        """Should track error with context"""
        with patch.object(self.vigilai.api_client, 'validate_api_key', return_value=True):
            import asyncio
            asyncio.run(self.vigilai.initialize())

            # Track error with context
            test_error = Exception('Database connection failed')
            context = {
                'operation': 'database_query',
                'user_id': '12345',
                'query': 'SELECT * FROM users',
            }

            self.vigilai.track_error(test_error, context)

            # Wait for async operation
            time.sleep(0.1)

            stats = self.vigilai.monitoring_agent.get_buffer_stats()
            assert stats['errors_count'] > 0

    def test_track_error_not_initialized(self):
        """Should not throw when SDK is not initialized"""
        test_error = Exception('Test error')

        # Should not raise exception
        self.vigilai.track_error(test_error)

    def test_metrics_and_errors_together(self):
        """Should handle both metrics and errors together"""
        with patch.object(self.vigilai.api_client, 'validate_api_key', return_value=True):
            import asyncio
            asyncio.run(self.vigilai.initialize())

            # Track metrics and errors
            self.vigilai.track_metric('operation.count', 10.0)
            self.vigilai.track_error(Exception('Operation failed'), {'operation': 'test'})
            self.vigilai.track_metric('operation.duration', 250.0)

            # Wait for async operations
            time.sleep(0.1)

            stats = self.vigilai.monitoring_agent.get_buffer_stats()
            assert stats['metrics_count'] > 0
            assert stats['errors_count'] > 0
