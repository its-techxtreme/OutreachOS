/**
 * @jest-environment node
 */
describe('Production performance budgets (unit)', () => {
  it('health report generation is fast for large metric buffers', async () => {
    const {
      ProductionMonitor,
    } = await import('@/lib/monitoring/production-monitor');
    ProductionMonitor.resetForTests();
    const monitor = ProductionMonitor.getInstance();

    for (let i = 0; i < 500; i += 1) {
      monitor.trackApiRequest('/api/agent/leads', 'POST', 201, 40 + (i % 20));
    }

    const start = Date.now();
    const report = monitor.generateHealthReport();
    const duration = Date.now() - start;

    expect(report.totalRequests).toBe(500);
    expect(duration).toBeLessThan(100);
  });

  it('prometheus metrics serialization stays lightweight', async () => {
    const { metrics } = await import('@/lib/metrics');
    metrics.resetForTests();

    for (let i = 0; i < 200; i += 1) {
      metrics.recordApiRequest('/api/health', 200, 12);
    }

    const start = Date.now();
    const body = metrics.toPrometheusFormat();
    const duration = Date.now() - start;

    expect(body).toContain('api_requests_total');
    expect(duration).toBeLessThan(50);
  });
});
