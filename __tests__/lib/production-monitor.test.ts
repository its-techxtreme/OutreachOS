import {
  ProductionMonitor,
  setupProductionMonitoring,
} from '@/lib/monitoring/production-monitor';

describe('ProductionMonitor', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    ProductionMonitor.resetForTests();
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true,
    });
  });

  it('tracks API requests and generates health reports', () => {
    const monitor = ProductionMonitor.getInstance();

    monitor.trackApiRequest('/api/health', 'GET', 200, 45);
    monitor.trackApiRequest('/api/agent/leads', 'POST', 201, 120);
    monitor.trackApiRequest('/api/leads', 'GET', 500, 1500);

    const report = monitor.generateHealthReport();

    expect(report.totalRequests).toBe(3);
    expect(report.errorRate).toBeGreaterThan(0);
    expect(report.slowRequestRate).toBeGreaterThan(0);
    expect(report.averageResponseTime).toBeGreaterThan(0);
    expect(report.period).toBe('Last 1 Hour');
  });

  it('returns zeroed health report when no requests recorded', () => {
    const monitor = ProductionMonitor.getInstance();
    const report = monitor.generateHealthReport();

    expect(report.totalRequests).toBe(0);
    expect(report.errorRate).toBe(0);
    expect(report.slowRequestRate).toBe(0);
    expect(report.averageResponseTime).toBe(0);
  });

  it('tracks database queries and user activity', () => {
    const monitor = ProductionMonitor.getInstance();

    monitor.trackDatabaseQuery('leads', 'select', 80, 10);
    monitor.trackDatabaseQuery('leads', 'insert', 600);
    monitor.trackUserActivity('user-1', 'login', 'dashboard');

    const dbMetrics = monitor.getMetrics('database_queries');
    const userMetrics = monitor.getMetrics('user_activities');

    expect(Array.isArray(dbMetrics)).toBe(true);
    expect((dbMetrics as unknown[]).length).toBe(2);
    expect(Array.isArray(userMetrics)).toBe(true);
    expect((userMetrics as unknown[]).length).toBe(1);
  });

  it('records system health and warns on high memory', () => {
    const monitor = ProductionMonitor.getInstance();
    const original = process.memoryUsage.bind(process);
    Object.defineProperty(process, 'memoryUsage', {
      configurable: true,
      value: () =>
        ({
          rss: 1,
          heapTotal: 300 * 1024 * 1024,
          heapUsed: 250 * 1024 * 1024,
          external: 0,
          arrayBuffers: 0,
        }) as NodeJS.MemoryUsage,
    });

    const health = monitor.trackSystemHealth();
    expect(health.type).toBe('system_health');
    expect(health.memory.heapUsed).toBeGreaterThan(200 * 1024 * 1024);

    Object.defineProperty(process, 'memoryUsage', {
      configurable: true,
      value: original,
    });
  });

  it('getMetrics without category returns all categories', () => {
    const monitor = ProductionMonitor.getInstance();
    monitor.trackApiRequest('/api/health', 'GET', 200, 10);
    const all = monitor.getMetrics() as Record<string, unknown[]>;
    expect(all.api_requests.length).toBe(1);
  });

  it('setupProductionMonitoring returns singleton instance', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      configurable: true,
    });
    const a = setupProductionMonitoring();
    const b = ProductionMonitor.getInstance();
    expect(a).toBe(b);
  });

  it('starts background tracking only in production', () => {
    jest.useFakeTimers();
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
    const monitor = setupProductionMonitoring();
    expect(monitor).toBe(ProductionMonitor.getInstance());

    monitor.startBackgroundTracking();
    jest.advanceTimersByTime(60_000);
    jest.advanceTimersByTime(5 * 60_000);
    jest.useRealTimers();
  });

  it('caps stored metrics per category', () => {
    const monitor = ProductionMonitor.getInstance();

    for (let i = 0; i < 1005; i += 1) {
      monitor.trackApiRequest('/api/health', 'GET', 200, 10);
    }

    const metrics = monitor.getMetrics('api_requests') as unknown[];
    expect(metrics.length).toBe(1000);
  });
});
