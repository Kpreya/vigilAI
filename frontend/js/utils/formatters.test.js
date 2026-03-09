/**
 * Tests for Data Formatting Utilities
 */

import {
  formatRelativeTime,
  formatAbsoluteDate,
  formatAbsoluteDateTime,
  formatNumber,
  formatPercentage,
  getSeverityBadgeConfig,
  formatSeverityBadge,
  getStatusBadgeConfig,
  formatStatusBadge
} from './formatters.js';

describe('Date/Time Formatting', () => {
  describe('formatRelativeTime', () => {
    it('should return "Just now" for times less than 60 seconds ago', () => {
      const now = new Date();
      const thirtySecsAgo = new Date(now.getTime() - 30 * 1000);
      expect(formatRelativeTime(thirtySecsAgo)).toBe('Just now');
    });

    it('should return minutes for times less than 60 minutes ago', () => {
      const now = new Date();
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinsAgo)).toBe('5 mins ago');
    });

    it('should return singular "min" for 1 minute', () => {
      const now = new Date();
      const oneMinAgo = new Date(now.getTime() - 1 * 60 * 1000);
      expect(formatRelativeTime(oneMinAgo)).toBe('1 min ago');
    });

    it('should return hours for times less than 24 hours ago', () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
    });

    it('should return singular "hour" for 1 hour', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    });

    it('should return days for times less than 30 days ago', () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(fiveDaysAgo)).toBe('5 days ago');
    });

    it('should return singular "day" for 1 day', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
    });

    it('should return absolute date for times more than 30 days ago', () => {
      const fortyDaysAgo = new Date('2024-01-01T12:00:00Z');
      const result = formatRelativeTime(fortyDaysAgo);
      expect(result).toMatch(/Jan \d+, 2024/);
    });

    it('should handle ISO date strings', () => {
      const now = new Date();
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinsAgo)).toBe('5 mins ago');
    });

    it('should return "Unknown" for null or undefined', () => {
      expect(formatRelativeTime(null)).toBe('Unknown');
      expect(formatRelativeTime(undefined)).toBe('Unknown');
    });
  });

  describe('formatAbsoluteDate', () => {
    it('should format date as "MMM DD, YYYY"', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      expect(formatAbsoluteDate(date)).toBe('Jan 15, 2024');
    });

    it('should handle ISO date strings', () => {
      const dateStr = '2024-03-20T08:30:00Z';
      expect(formatAbsoluteDate(dateStr)).toBe('Mar 20, 2024');
    });

    it('should return "Unknown" for null or undefined', () => {
      expect(formatAbsoluteDate(null)).toBe('Unknown');
      expect(formatAbsoluteDate(undefined)).toBe('Unknown');
    });
  });

  describe('formatAbsoluteDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2024-01-15T15:45:00Z');
      const result = formatAbsoluteDateTime(date);
      expect(result).toMatch(/Jan 15, 2024 at \d+:\d+ (AM|PM)/);
    });

    it('should handle ISO date strings', () => {
      const dateStr = '2024-03-20T08:30:00Z';
      const result = formatAbsoluteDateTime(dateStr);
      expect(result).toMatch(/Mar 20, 2024 at \d+:\d+ (AM|PM)/);
    });

    it('should return "Unknown" for null or undefined', () => {
      expect(formatAbsoluteDateTime(null)).toBe('Unknown');
      expect(formatAbsoluteDateTime(undefined)).toBe('Unknown');
    });
  });
});

describe('Number Formatting', () => {
  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(999)).toBe('999');
    });

    it('should return "0" for null or undefined', () => {
      expect(formatNumber(null)).toBe('0');
      expect(formatNumber(undefined)).toBe('0');
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal values as percentages', () => {
      expect(formatPercentage(0.85, true)).toBe('85%');
      expect(formatPercentage(0.5, true)).toBe('50%');
      expect(formatPercentage(1.0, true)).toBe('100%');
    });

    it('should format percentage values', () => {
      expect(formatPercentage(85, false)).toBe('85%');
      expect(formatPercentage(50, false)).toBe('50%');
      expect(formatPercentage(100, false)).toBe('100%');
    });

    it('should round to nearest integer', () => {
      expect(formatPercentage(0.856, true)).toBe('86%');
      expect(formatPercentage(0.854, true)).toBe('85%');
    });

    it('should return "0%" for null or undefined', () => {
      expect(formatPercentage(null)).toBe('0%');
      expect(formatPercentage(undefined)).toBe('0%');
    });
  });
});

describe('Severity Badge Formatting', () => {
  describe('getSeverityBadgeConfig', () => {
    it('should return correct config for CRITICAL severity', () => {
      const config = getSeverityBadgeConfig('CRITICAL');
      expect(config.borderColor).toBe('border-red-600');
      expect(config.textColor).toBe('text-red-600');
      expect(config.bgColor).toBe('bg-red-50');
      expect(config.label).toBe('Critical');
    });

    it('should return correct config for HIGH severity', () => {
      const config = getSeverityBadgeConfig('HIGH');
      expect(config.borderColor).toBe('border-yellow-600');
      expect(config.textColor).toBe('text-yellow-700');
      expect(config.bgColor).toBe('bg-yellow-50');
      expect(config.label).toBe('High');
    });

    it('should return correct config for MEDIUM severity', () => {
      const config = getSeverityBadgeConfig('MEDIUM');
      expect(config.borderColor).toBe('border-orange-600');
      expect(config.textColor).toBe('text-orange-700');
      expect(config.bgColor).toBe('bg-orange-50');
      expect(config.label).toBe('Medium');
    });

    it('should return correct config for LOW severity', () => {
      const config = getSeverityBadgeConfig('LOW');
      expect(config.borderColor).toBe('border-blue-600');
      expect(config.textColor).toBe('text-blue-700');
      expect(config.bgColor).toBe('bg-blue-50');
      expect(config.label).toBe('Low');
    });

    it('should default to LOW config for unknown severity', () => {
      const config = getSeverityBadgeConfig('UNKNOWN');
      expect(config.borderColor).toBe('border-blue-600');
    });
  });

  describe('formatSeverityBadge', () => {
    it('should return HTML badge for CRITICAL severity', () => {
      const html = formatSeverityBadge('CRITICAL');
      expect(html).toContain('border-red-600');
      expect(html).toContain('text-red-600');
      expect(html).toContain('bg-red-50');
      expect(html).toContain('Critical');
    });

    it('should return HTML badge for HIGH severity', () => {
      const html = formatSeverityBadge('HIGH');
      expect(html).toContain('border-yellow-600');
      expect(html).toContain('High');
    });

    it('should return HTML badge for MEDIUM severity', () => {
      const html = formatSeverityBadge('MEDIUM');
      expect(html).toContain('border-orange-600');
      expect(html).toContain('Medium');
    });

    it('should return HTML badge for LOW severity', () => {
      const html = formatSeverityBadge('LOW');
      expect(html).toContain('border-blue-600');
      expect(html).toContain('Low');
    });

    it('should return "Unknown" for null or undefined', () => {
      expect(formatSeverityBadge(null)).toContain('Unknown');
      expect(formatSeverityBadge(undefined)).toContain('Unknown');
    });

    it('should include all required CSS classes', () => {
      const html = formatSeverityBadge('CRITICAL');
      expect(html).toContain('px-2');
      expect(html).toContain('py-0.5');
      expect(html).toContain('border');
      expect(html).toContain('text-xs');
      expect(html).toContain('font-bold');
      expect(html).toContain('uppercase');
      expect(html).toContain('tracking-wider');
    });
  });
});

describe('Status Badge Formatting', () => {
  describe('getStatusBadgeConfig', () => {
    it('should return correct config for OPEN status', () => {
      const config = getStatusBadgeConfig('OPEN');
      expect(config.shadowColor).toContain('ef4444');
      expect(config.dotColor).toBe('bg-red-500');
      expect(config.dotAnimation).toBe('animate-pulse');
      expect(config.label).toBe('Open');
    });

    it('should return correct config for IN_PROGRESS status', () => {
      const config = getStatusBadgeConfig('IN_PROGRESS');
      expect(config.shadowColor).toContain('eab308');
      expect(config.dotColor).toBe('bg-yellow-500');
      expect(config.label).toBe("Ack'd");
    });

    it('should return correct config for RESOLVED status', () => {
      const config = getStatusBadgeConfig('RESOLVED');
      expect(config.shadowColor).toContain('22c55e');
      expect(config.dotColor).toBe('bg-green-500');
      expect(config.label).toBe('Resolved');
    });

    it('should return correct config for IGNORED status', () => {
      const config = getStatusBadgeConfig('IGNORED');
      expect(config.shadowColor).toContain('94a3b8');
      expect(config.dotColor).toBe('bg-slate-400');
      expect(config.label).toBe('Ignored');
    });

    it('should default to OPEN config for unknown status', () => {
      const config = getStatusBadgeConfig('UNKNOWN');
      expect(config.dotColor).toBe('bg-red-500');
    });
  });

  describe('formatStatusBadge', () => {
    it('should return HTML badge for OPEN status', () => {
      const html = formatStatusBadge('OPEN');
      expect(html).toContain('bg-red-500');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('Open');
    });

    it('should return HTML badge for IN_PROGRESS status', () => {
      const html = formatStatusBadge('IN_PROGRESS');
      expect(html).toContain('bg-yellow-500');
      expect(html).toContain("Ack'd");
    });

    it('should return HTML badge for RESOLVED status', () => {
      const html = formatStatusBadge('RESOLVED');
      expect(html).toContain('bg-green-500');
      expect(html).toContain('Resolved');
    });

    it('should return HTML badge for IGNORED status', () => {
      const html = formatStatusBadge('IGNORED');
      expect(html).toContain('bg-slate-400');
      expect(html).toContain('Ignored');
    });

    it('should return "Unknown" for null or undefined', () => {
      expect(formatStatusBadge(null)).toContain('Unknown');
      expect(formatStatusBadge(undefined)).toContain('Unknown');
    });

    it('should include all required CSS classes', () => {
      const html = formatStatusBadge('OPEN');
      expect(html).toContain('inline-flex');
      expect(html).toContain('items-center');
      expect(html).toContain('gap-2');
      expect(html).toContain('px-2');
      expect(html).toContain('py-1');
      expect(html).toContain('rounded-full');
      expect(html).toContain('border');
      expect(html).toContain('border-black');
      expect(html).toContain('bg-white');
      expect(html).toContain('text-xs');
      expect(html).toContain('font-bold');
    });

    it('should include status indicator dot', () => {
      const html = formatStatusBadge('OPEN');
      expect(html).toContain('w-2');
      expect(html).toContain('h-2');
      expect(html).toContain('rounded-full');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty strings gracefully', () => {
    expect(formatRelativeTime('')).toBe('Unknown');
    expect(formatAbsoluteDate('')).toBe('Unknown');
    expect(formatAbsoluteDateTime('')).toBe('Unknown');
  });

  it('should handle invalid date strings', () => {
    const result = formatRelativeTime('invalid-date');
    expect(result).toBeDefined();
  });

  it('should handle zero values', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatPercentage(0)).toBe('0%');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
  });
});
