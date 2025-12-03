# 📊 Monitoring & Observability Setup Guide

## 🎯 Overview

Hệ thống monitoring toàn diện cho Zen Admin với:
- **Metrics**: Prometheus + Grafana
- **Logs**: Structured logging
- **Traces**: Performance monitoring
- **Errors**: Sentry
- **Analytics**: Google Analytics 4

---

## 1. Prometheus Setup

### Installation (Docker)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana-dashboard.json:/etc/grafana/provisioning/dashboards/zen-admin.json
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
```

### Start Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Access Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Alertmanager**: http://localhost:9093

---

## 2. Grafana Dashboard Setup

### Import Dashboard

1. Login to Grafana (http://localhost:3001)
2. Go to **Dashboards** → **Import**
3. Upload `monitoring/grafana-dashboard.json`
4. Select Prometheus as data source
5. Click **Import**

### Key Metrics Tracked

#### Performance Metrics
- Page Load Time (P50, P95, P99)
- Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
- API Response Time
- Bundle Size
- Memory Usage

#### Business Metrics
- Active Users
- Page Views
- Conversion Rate
- Error Rate
- Cache Hit Rate

#### Infrastructure Metrics
- CPU Usage
- Memory Usage
- Network I/O
- Disk Usage

---

## 3. Alert Configuration

### Alertmanager Config

```yaml
# monitoring/alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'team-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'team-notifications'
    slack_configs:
      - channel: '#alerts'
        title: 'Zen Admin Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'critical-alerts'
    slack_configs:
      - channel: '#critical-alerts'
        title: '🚨 CRITICAL: Zen Admin'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    email_configs:
      - to: 'oncall@yourcompany.com'
        from: 'alerts@yourcompany.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@yourcompany.com'
        auth_password: 'YOUR_PASSWORD'

  - name: 'warning-alerts'
    slack_configs:
      - channel: '#warnings'
        title: '⚠️ Warning: Zen Admin'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
```

### Alert Types

#### Critical Alerts (Immediate Action)
- Service Down
- High Error Rate (> 5%)
- Slow Page Load (> 3s)
- Memory Leak

#### Warning Alerts (Monitor)
- Slow API Response (> 1s)
- Low Cache Hit Rate (< 60%)
- Poor Web Vitals
- High Request Rate

#### Info Alerts (FYI)
- Deployment Success
- Cache Cleared
- Configuration Changed

---

## 4. Sentry Error Tracking

### Setup

```bash
# Install Sentry
npm install @sentry/vue

# Configure in .env
NUXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NUXT_PUBLIC_SENTRY_ENVIRONMENT=production
NUXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Features Enabled

- ✅ Exception tracking
- ✅ Performance monitoring
- ✅ Session replay
- ✅ User context
- ✅ Breadcrumbs
- ✅ Source maps

### Sentry Dashboard

1. **Issues**: Track all errors
2. **Performance**: Monitor transactions
3. **Releases**: Track deployments
4. **Alerts**: Configure notifications

---

## 5. Google Analytics 4

### Setup

```bash
# Configure in .env
NUXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Events Tracked

#### Automatic Events
- Page views
- Scrolls
- Outbound clicks
- File downloads
- Video engagement

#### Custom Events
- User actions (button clicks, form submits)
- Conversions (purchases, signups)
- Performance metrics
- Errors

### Custom Dimensions

- User ID
- User Role
- Page Category
- Feature Flags
- A/B Test Variant

---

## 6. Log Aggregation

### Structured Logging

```typescript
import { logger } from '@/utils/logger'

// Different log levels
logger.debug('Debug info', { data })
logger.info('User action', { userId, action })
logger.warn('Warning', { issue })
logger.error('Error occurred', { error })
logger.fatal('Critical error', { error })
```

### Log Format (Production)

```json
{
  "timestamp": "2024-12-03T16:00:00.000Z",
  "level": "INFO",
  "message": "API Request succeeded",
  "context": {
    "service": "ProductService",
    "method": "GET",
    "endpoint": "/products",
    "statusCode": 200,
    "duration": 150
  }
}
```

### Log Aggregation Options

#### Option 1: ELK Stack
- **Elasticsearch**: Store logs
- **Logstash**: Process logs
- **Kibana**: Visualize logs

#### Option 2: Cloud Services
- **Datadog**: All-in-one monitoring
- **New Relic**: APM + Logging
- **Loggly**: Log management
- **Papertrail**: Simple log aggregation

---

## 7. Performance Monitoring

### Real User Monitoring (RUM)

```typescript
import { usePerformanceMonitoring } from '@/composables/usePerformanceMonitoring'

const { trackPageLoad, trackWebVitals } = usePerformanceMonitoring()

// Track on mount
onMounted(() => {
  trackPageLoad()
  trackWebVitals()
})
```

### Metrics Collected

- **Page Load Time**: Total time to load
- **DOM Ready Time**: Time to DOM ready
- **Render Time**: Time to render
- **LCP**: Largest Contentful Paint
- **FID**: First Input Delay
- **CLS**: Cumulative Layout Shift
- **FCP**: First Contentful Paint
- **TTFB**: Time to First Byte

---

## 8. Uptime Monitoring

### Recommended Services

#### UptimeRobot (Free)
- Monitor every 5 minutes
- Email/SMS alerts
- Status page

#### Pingdom
- Advanced monitoring
- Real browser testing
- Global locations

#### StatusCake
- Free tier available
- Page speed monitoring
- SSL monitoring

### Health Check Endpoint

```bash
# Monitor this endpoint
curl https://yourdomain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-12-03T16:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

---

## 9. Monitoring Best Practices

### Metrics to Track

#### Golden Signals
1. **Latency**: Response time
2. **Traffic**: Request rate
3. **Errors**: Error rate
4. **Saturation**: Resource usage

#### RED Method
1. **Rate**: Requests per second
2. **Errors**: Error percentage
3. **Duration**: Response time

#### USE Method
1. **Utilization**: % time resource busy
2. **Saturation**: Queue depth
3. **Errors**: Error count

### Alert Thresholds

```yaml
# Performance
- Page Load P95 > 3s: WARNING
- Page Load P95 > 5s: CRITICAL
- API Response P95 > 1s: WARNING
- API Response P95 > 2s: CRITICAL

# Errors
- Error Rate > 1%: WARNING
- Error Rate > 5%: CRITICAL

# Resources
- Memory Usage > 80%: WARNING
- Memory Usage > 90%: CRITICAL
- CPU Usage > 80%: WARNING
- CPU Usage > 90%: CRITICAL

# Business
- Cache Hit Rate < 60%: INFO
- Cache Hit Rate < 40%: WARNING
- Active Users < 10: INFO (off-hours)
```

---

## 10. Dashboard Examples

### Executive Dashboard
- Active Users (real-time)
- Revenue (today, this week, this month)
- Conversion Rate
- Top Pages
- Geographic Distribution

### Engineering Dashboard
- Error Rate (24h)
- P95 Response Time
- Cache Hit Rate
- API Success Rate
- Deployment Status

### Performance Dashboard
- Core Web Vitals
- Page Load Time (P50, P95, P99)
- Bundle Size Trend
- Memory Usage
- Resource Timing

---

## 11. Incident Response

### On-Call Rotation

```yaml
# Example schedule
Week 1: Engineer A (Primary), Engineer B (Secondary)
Week 2: Engineer B (Primary), Engineer C (Secondary)
Week 3: Engineer C (Primary), Engineer A (Secondary)
```

### Runbooks

#### High Error Rate
1. Check Sentry for error details
2. Check recent deployments
3. Check API status
4. Rollback if needed
5. Notify team

#### Slow Performance
1. Check Grafana dashboards
2. Identify slow endpoints
3. Check database queries
4. Check cache hit rate
5. Scale if needed

#### Service Down
1. Check health endpoint
2. Check server logs
3. Check infrastructure
4. Restart service
5. Investigate root cause

---

## 12. Cost Optimization

### Free Tier Options
- **Grafana Cloud**: 10k metrics, 50GB logs
- **Sentry**: 5k errors/month
- **Google Analytics**: Unlimited
- **UptimeRobot**: 50 monitors
- **Prometheus**: Self-hosted (free)

### Paid Recommendations
- **Datadog**: $15/host/month
- **New Relic**: $99/month
- **Sentry**: $26/month (50k errors)
- **Pingdom**: $10/month

---

## 🎯 Quick Start

```bash
# 1. Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# 2. Configure environment
cp .env.example .env
# Add SENTRY_DSN and GA_ID

# 3. Access dashboards
open http://localhost:3001  # Grafana
open http://localhost:9090  # Prometheus

# 4. Import dashboard
# Upload monitoring/grafana-dashboard.json to Grafana

# 5. Test alerts
# Trigger an error and check Slack/Email
```

---

## 📚 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Google Analytics 4](https://support.google.com/analytics/)
- [Web Vitals](https://web.dev/vitals/)

---

**Monitoring is critical for production systems. Set it up before you need it!** 🚀
