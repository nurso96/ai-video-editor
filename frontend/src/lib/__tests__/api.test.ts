import axios from 'axios';

// Mock axios module
jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
  };
  return {
    create: jest.fn(() => mockInstance),
    __mockInstance: mockInstance,
  };
});

// Import after mocking
import * as api from '../api';

describe('API Client', () => {
  const mockAxiosInstance = (axios as any).__mockInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadProject', () => {
    it('should load a project by ID', async () => {
      const mockProject = {
        id: 1,
        title: 'Test Project',
        timeline: { segments: [] },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockProject });

      const result = await api.loadProject(1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/timeline/1');
      expect(result).toEqual(mockProject);
    });

    it('should handle errors when loading a project', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(api.loadProject(1)).rejects.toThrow('Network error');
    });
  });

  describe('saveTimeline', () => {
    it('should save timeline data', async () => {
      const timeline = { segments: [{ name: 'intro', start: 0, end: 5 }] };
      mockAxiosInstance.post.mockResolvedValue({ data: { detail: 'saved' } });

      const result = await api.saveTimeline(1, timeline);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/timeline/1', { timeline });
      expect(result).toEqual({ detail: 'saved' });
    });
  });

  describe('startRender', () => {
    it('should start a render job', async () => {
      const mockResponse = { job_id: 'job-123' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await api.startRender(1, { watermark: true });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/render/1', { watermark: true });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getRenderStatus', () => {
    it('should get render job status', async () => {
      const mockStatus = {
        id: 'job-123',
        status: 'finished',
        progress: 1.0,
        logs: [],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockStatus });

      const result = await api.getRenderStatus('job-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/render/status/job-123');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('healthCheck', () => {
    it('should check API health', async () => {
      const mockHealth = { status: 'ok', redis: true };
      mockAxiosInstance.get.mockResolvedValue({ data: mockHealth });

      const result = await api.healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/healthz');
      expect(result).toEqual(mockHealth);
    });
  });
});
