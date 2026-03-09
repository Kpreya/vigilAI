/**
 * Unit Tests for Dashboard Page Module
 * 
 * Tests the DashboardPage class functionality including initialization,
 * stats loading, and rendering.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import DashboardPage from './dashboard.js';

describe('DashboardPage', () => {
  let dashboardPage;
  let mockApiClient;

  beforeEach(() => {
    // Create dashboard page instance
    dashboardPage = new DashboardPage();
    
    // Mock the API client
    mockApiClient = {
      get: jest.fn()
    };
    dashboardPage.apiClient = mockApiClient;
    
    // Set up DOM structure for testing
    document.body.innerHTML = `
      <section class="grid">
        <div class="bg-white">
          <span class="text-slate-500 font-mono text-xs">Total Incidents</span>
          <span class="text-5xl">00</span>
        </div>
        <div class="bg-white">
          <span class="text-slate-500 font-mono text-xs">Applications</span>
          <span class="text-5xl">00</span>
        </div>
        <div class="bg-white">
          <span class="text-slate-500 font-mono text-xs">API Keys</span>
          <span class="text-5xl">00</span>
        </div>
      </section>
    `;
  });

  describe('constructor', () => {
    test('should initialize with null stats', () => {
      expect(dashboardPage.stats).toBeNull();
    });

    test('should create an ApiClient instance', () => {
      expect(dashboardPage.apiClient).toBeDefined();
    });
  });

  describe('loadStats', () => {
    test('should fetch stats from API and render them', async () => {
      const mockStats = {
        totalIncidents: 42,
        totalApplications: 5,
        totalApiKeys: 3
      };
      
      mockApiClient.get.mockResolvedValue(mockStats);
      
      await dashboardPage.loadStats();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/stats');
      expect(dashboardPage.stats).toEqual(mockStats);
    });

    test('should throw error when API call fails', async () => {
      const error = new Error('API Error');
      mockApiClient.get.mockRejectedValue(error);
      
      await expect(dashboardPage.loadStats()).rejects.toThrow('API Error');
    });
  });

  describe('renderStats', () => {
    test('should update DOM with stats', () => {
      const stats = {
        totalIncidents: 172,
        totalApplications: 8,
        totalApiKeys: 3
      };
      
      dashboardPage.renderStats(stats);
      
      const metricCards = document.querySelectorAll('section.grid > div.bg-white');
      const values = Array.from(metricCards).map(card => 
        card.querySelector('.text-5xl').textContent
      );
      
      expect(values).toEqual(['172', '08', '03']);
    });

    test('should handle missing stats with defaults', () => {
      const stats = {};
      
      dashboardPage.renderStats(stats);
      
      const metricCards = document.querySelectorAll('section.grid > div.bg-white');
      const values = Array.from(metricCards).map(card => 
        card.querySelector('.text-5xl').textContent
      );
      
      expect(values).toEqual(['00', '00', '00']);
    });

    test('should format single digit numbers with leading zero', () => {
      const stats = {
        totalIncidents: 5,
        totalApplications: 2,
        totalApiKeys: 1
      };
      
      dashboardPage.renderStats(stats);
      
      const metricCards = document.querySelectorAll('section.grid > div.bg-white');
      const values = Array.from(metricCards).map(card => 
        card.querySelector('.text-5xl').textContent
      );
      
      expect(values).toEqual(['05', '02', '01']);
    });

    test('should not format double digit numbers', () => {
      const stats = {
        totalIncidents: 15,
        totalApplications: 20,
        totalApiKeys: 99
      };
      
      dashboardPage.renderStats(stats);
      
      const metricCards = document.querySelectorAll('section.grid > div.bg-white');
      const values = Array.from(metricCards).map(card => 
        card.querySelector('.text-5xl').textContent
      );
      
      expect(values).toEqual(['15', '20', '99']);
    });
  });

  describe('formatNumber', () => {
    test('should add leading zero for single digits', () => {
      expect(dashboardPage.formatNumber(0)).toBe('00');
      expect(dashboardPage.formatNumber(5)).toBe('05');
      expect(dashboardPage.formatNumber(9)).toBe('09');
    });

    test('should not add leading zero for double digits', () => {
      expect(dashboardPage.formatNumber(10)).toBe('10');
      expect(dashboardPage.formatNumber(42)).toBe('42');
      expect(dashboardPage.formatNumber(99)).toBe('99');
    });

    test('should handle large numbers', () => {
      expect(dashboardPage.formatNumber(100)).toBe('100');
      expect(dashboardPage.formatNumber(1234)).toBe('1234');
    });
  });

  describe('init', () => {
    test('should call loadStats on initialization', async () => {
      const mockStats = {
        totalIncidents: 10,
        totalApplications: 2,
        totalApiKeys: 1
      };
      
      mockApiClient.get.mockResolvedValue(mockStats);
      
      await dashboardPage.init();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/stats');
      expect(dashboardPage.stats).toEqual(mockStats);
    });
  });
});
