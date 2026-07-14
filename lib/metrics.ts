interface MetricCounter {
  total: number;
  byStatus: Record<string, number>;
}

interface ResponseTimeStats {
  count: number;
  totalMs: number;
  maxMs: number;
}

class MetricsCollector {
  private apiRequests: MetricCounter = { total: 0, byStatus: {} };
  private databaseQueries: MetricCounter = { total: 0, byStatus: {} };
  private rateLimitHits = 0;
  private authFailures = 0;
  private responseTimes: ResponseTimeStats = { count: 0, totalMs: 0, maxMs: 0 };
  private startedAt = Date.now();

  recordApiRequest(path: string, statusCode: number, durationMs: number): void {
    this.apiRequests.total += 1;
    const key = `${path}:${statusCode}`;
    this.apiRequests.byStatus[key] = (this.apiRequests.byStatus[key] ?? 0) + 1;

    this.responseTimes.count += 1;
    this.responseTimes.totalMs += durationMs;
    this.responseTimes.maxMs = Math.max(this.responseTimes.maxMs, durationMs);
  }

  recordDatabaseQuery(success: boolean): void {
    this.databaseQueries.total += 1;
    const key = success ? 'success' : 'error';
    this.databaseQueries.byStatus[key] = (this.databaseQueries.byStatus[key] ?? 0) + 1;
  }

  recordRateLimitHit(): void {
    this.rateLimitHits += 1;
  }

  recordAuthFailure(): void {
    this.authFailures += 1;
  }

  getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  toPrometheusFormat(): string {
    const lines: string[] = [
      '# HELP api_requests_total Total API requests processed',
      '# TYPE api_requests_total counter',
      `api_requests_total ${this.apiRequests.total}`,
    ];

    for (const [label, count] of Object.entries(this.apiRequests.byStatus)) {
      const [path, status] = label.split(':');
      lines.push(
        `api_requests_total{path="${path}",status="${status}"} ${count}`
      );
    }

    const avgSeconds =
      this.responseTimes.count > 0
        ? this.responseTimes.totalMs / this.responseTimes.count / 1000
        : 0;
    const maxSeconds = this.responseTimes.maxMs / 1000;

    lines.push(
      '# HELP api_response_time_seconds API response time statistics',
      '# TYPE api_response_time_seconds gauge',
      `api_response_time_seconds_avg ${avgSeconds.toFixed(6)}`,
      `api_response_time_seconds_max ${maxSeconds.toFixed(6)}`,
      '# HELP database_queries_total Total database queries executed',
      '# TYPE database_queries_total counter',
      `database_queries_total ${this.databaseQueries.total}`,
      `database_queries_total{result="success"} ${this.databaseQueries.byStatus.success ?? 0}`,
      `database_queries_total{result="error"} ${this.databaseQueries.byStatus.error ?? 0}`,
      '# HELP rate_limit_hits_total Total rate limit rejections',
      '# TYPE rate_limit_hits_total counter',
      `rate_limit_hits_total ${this.rateLimitHits}`,
      '# HELP auth_failures_total Total authentication failures',
      '# TYPE auth_failures_total counter',
      `auth_failures_total ${this.authFailures}`,
      '# HELP process_uptime_seconds Process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${this.getUptimeSeconds()}`,
      '# HELP process_heap_bytes Process heap memory usage',
      '# TYPE process_heap_bytes gauge',
      `process_heap_bytes_used ${process.memoryUsage().heapUsed}`,
      `process_heap_bytes_total ${process.memoryUsage().heapTotal}`
    );

    return `${lines.join('\n')}\n`;
  }

  resetForTests(): void {
    this.apiRequests = { total: 0, byStatus: {} };
    this.databaseQueries = { total: 0, byStatus: {} };
    this.rateLimitHits = 0;
    this.authFailures = 0;
    this.responseTimes = { count: 0, totalMs: 0, maxMs: 0 };
    this.startedAt = Date.now();
  }
}

export const metrics = new MetricsCollector();
