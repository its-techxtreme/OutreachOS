import { logger } from '@/lib/logger';

export interface ApiRequestMetric {
  type: 'api_request';
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  userId?: string;
  timestamp: number;
}

export interface DatabaseQueryMetric {
  type: 'database_query';
  table: string;
  operation: string;
  duration: number;
  rowCount?: number;
  timestamp: number;
}

export interface UserActivityMetric {
  type: 'user_activity';
  userId: string;
  action: string;
  resource?: string;
  timestamp: number;
}

export interface SystemHealthMetric {
  type: 'system_health';
  memory: NodeJS.MemoryUsage;
  uptime: number;
  timestamp: number;
}

export type ProductionMetric =
  | ApiRequestMetric
  | DatabaseQueryMetric
  | UserActivityMetric
  | SystemHealthMetric;

export interface HealthReport {
  period: string;
  totalRequests: number;
  errorRate: number;
  slowRequestRate: number;
  averageResponseTime: number;
  systemHealth?: SystemHealthMetric;
  timestamp: string;
}

const MAX_METRICS_PER_CATEGORY = 1000;

export class ProductionMonitor {
  private static instance: ProductionMonitor | null = null;
  private metrics: Map<string, ProductionMetric[]> = new Map();
  private intervalsStarted = false;

  static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  static resetForTests(): void {
    if (ProductionMonitor.instance) {
      ProductionMonitor.instance.metrics.clear();
      ProductionMonitor.instance.intervalsStarted = false;
    }
    ProductionMonitor.instance = null;
  }

  trackApiRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): void {
    const metric: ApiRequestMetric = {
      type: 'api_request',
      endpoint,
      method,
      statusCode,
      duration,
      userId,
      timestamp: Date.now(),
    };

    this.recordMetric('api_requests', metric);

    if (duration > 1000) {
      logger.warn('Slow API request detected', { ...metric });
    }

    if (statusCode >= 400) {
      logger.error('API request error', { ...metric });
    }
  }

  trackDatabaseQuery(
    table: string,
    operation: string,
    duration: number,
    rowCount?: number
  ): void {
    const metric: DatabaseQueryMetric = {
      type: 'database_query',
      table,
      operation,
      duration,
      rowCount,
      timestamp: Date.now(),
    };

    this.recordMetric('database_queries', metric);

    if (duration > 500) {
      logger.warn('Slow database query detected', { ...metric });
    }
  }

  trackUserActivity(userId: string, action: string, resource?: string): void {
    const metric: UserActivityMetric = {
      type: 'user_activity',
      userId,
      action,
      resource,
      timestamp: Date.now(),
    };

    this.recordMetric('user_activities', metric);
    logger.info('User activity', { ...metric });
  }

  trackSystemHealth(): SystemHealthMetric {
    const healthMetric: SystemHealthMetric = {
      type: 'system_health',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: Date.now(),
    };

    this.recordMetric('system_health', healthMetric);

    const heapUsedMB = healthMetric.memory.heapUsed / 1024 / 1024;
    if (heapUsedMB > 200) {
      logger.warn('High memory usage detected', { heapUsedMB });
    }

    return healthMetric;
  }

  private recordMetric(category: string, metric: ProductionMetric): void {
    const categoryMetrics = this.metrics.get(category) ?? [];
    categoryMetrics.push(metric);

    if (categoryMetrics.length > MAX_METRICS_PER_CATEGORY) {
      categoryMetrics.splice(0, categoryMetrics.length - MAX_METRICS_PER_CATEGORY);
    }

    this.metrics.set(category, categoryMetrics);
  }

  getMetrics(category?: string): ProductionMetric[] | Record<string, ProductionMetric[]> {
    if (category) {
      return this.metrics.get(category) ?? [];
    }
    return Object.fromEntries(this.metrics.entries());
  }

  generateHealthReport(): HealthReport {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const apiRequests = (this.metrics.get('api_requests') ?? []) as ApiRequestMetric[];
    const recentRequests = apiRequests.filter((r) => now - r.timestamp < oneHour);

    const totalRequests = recentRequests.length;
    const errorRequests = recentRequests.filter((r) => r.statusCode >= 400).length;
    const slowRequests = recentRequests.filter((r) => r.duration > 1000).length;

    const errorRate =
      totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    const slowRequestRate =
      totalRequests > 0 ? (slowRequests / totalRequests) * 100 : 0;

    const averageResponseTime =
      totalRequests > 0
        ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / totalRequests
        : 0;

    const systemHealthEntries = (this.metrics.get('system_health') ??
      []) as SystemHealthMetric[];

    return {
      period: 'Last 1 Hour',
      totalRequests,
      errorRate: parseFloat(errorRate.toFixed(2)),
      slowRequestRate: parseFloat(slowRequestRate.toFixed(2)),
      averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
      systemHealth: systemHealthEntries.at(-1),
      timestamp: new Date().toISOString(),
    };
  }

  startBackgroundTracking(): void {
    if (this.intervalsStarted || typeof setInterval === 'undefined') {
      return;
    }

    this.intervalsStarted = true;

    setInterval(() => {
      this.trackSystemHealth();
    }, 60_000);

    setInterval(() => {
      const healthReport = this.generateHealthReport();
      logger.info('System health report', { ...healthReport });
    }, 5 * 60_000);
  }
}

export function setupProductionMonitoring(): ProductionMonitor {
  const monitor = ProductionMonitor.getInstance();
  if (process.env.NODE_ENV === 'production') {
    monitor.startBackgroundTracking();
  }
  return monitor;
}
