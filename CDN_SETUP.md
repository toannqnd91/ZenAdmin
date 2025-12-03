# CDN Configuration Guide

## 🚀 Cloudflare Setup (Recommended)

### 1. Sign up for Cloudflare
- Go to [cloudflare.com](https://www.cloudflare.com)
- Add your domain
- Update nameservers at your domain registrar

### 2. Configure Caching Rules

```javascript
// Cloudflare Page Rule for static assets
URL Pattern: *yourdomain.com/_nuxt/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
```

### 3. Enable Performance Features

- ✅ **Auto Minify**: HTML, CSS, JavaScript
- ✅ **Brotli Compression**: Enabled
- ✅ **HTTP/2**: Enabled
- ✅ **HTTP/3 (QUIC)**: Enabled
- ✅ **Early Hints**: Enabled
- ✅ **Rocket Loader**: Disabled (conflicts with Vue)

### 4. Security Settings

```yaml
SSL/TLS Mode: Full (strict)
Always Use HTTPS: On
Minimum TLS Version: 1.2
Automatic HTTPS Rewrites: On
```

### 5. Speed Optimizations

```yaml
Caching:
  - Browser Cache TTL: Respect Existing Headers
  - Crawler Hints: On
  
Performance:
  - Mirage: On (image optimization)
  - Polish: Lossless
  - WebP: On
```

## 📦 AWS CloudFront Setup

### 1. Create S3 Bucket
```bash
aws s3 mb s3://zen-admin-static
aws s3 sync .output/public s3://zen-admin-static
```

### 2. Create CloudFront Distribution

```json
{
  "Origins": [{
    "DomainName": "zen-admin-static.s3.amazonaws.com",
    "Id": "S3-zen-admin",
    "S3OriginConfig": {
      "OriginAccessIdentity": "origin-access-identity/cloudfront/XXXXX"
    }
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-zen-admin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:...",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
```

### 3. Invalidate Cache on Deploy

```bash
aws cloudfront create-invalidation \
  --distribution-id XXXXX \
  --paths "/*"
```

## 🔧 Nuxt Configuration for CDN

Update `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  app: {
    cdnURL: process.env.CDN_URL || '',
    head: {
      link: [
        {
          rel: 'dns-prefetch',
          href: process.env.CDN_URL || ''
        },
        {
          rel: 'preconnect',
          href: process.env.CDN_URL || '',
          crossorigin: 'anonymous'
        }
      ]
    }
  },
  
  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  }
})
```

## 📊 Performance Checklist

- ✅ Enable Brotli/Gzip compression
- ✅ Set proper cache headers
- ✅ Use HTTP/2 or HTTP/3
- ✅ Enable image optimization
- ✅ Configure CDN edge locations
- ✅ Set up cache invalidation
- ✅ Monitor CDN analytics

## 🎯 Expected Results

| Metric | Before CDN | With CDN | Improvement |
|--------|-----------|----------|-------------|
| TTFB | 500ms | 50ms | **-90%** |
| Page Load | 3s | 1s | **-67%** |
| Bandwidth | 100% | 20% | **-80%** |
| Global Latency | 500ms | 50ms | **-90%** |

## 🔍 Testing

```bash
# Test CDN caching
curl -I https://yourdomain.com/_nuxt/entry.js

# Check headers
CF-Cache-Status: HIT
X-Cache: Hit from cloudfront
```

## 💡 Best Practices

1. **Cache Static Assets**: `/_nuxt/*`, `/images/*`, `/fonts/*`
2. **Don't Cache**: `/api/*`, `/auth/*`, dynamic pages
3. **Set Long TTL**: Static assets (1 year)
4. **Set Short TTL**: HTML pages (5 minutes)
5. **Use Versioned URLs**: Nuxt does this automatically
6. **Monitor Cache Hit Rate**: Target 80%+

## 🚨 Common Issues

### Cache Not Working
```bash
# Check cache headers
Cache-Control: public, max-age=31536000, immutable
```

### Stale Content
```bash
# Purge cache after deployment
# Cloudflare: Purge Everything
# CloudFront: Create invalidation
```

### CORS Issues
```javascript
// Add CORS headers in nuxt.config.ts
routeRules: {
  '/_nuxt/**': {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}
```
