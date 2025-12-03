# 🚀 Production Deployment Checklist

## 📋 Pre-Deployment

### Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] Type check passing (`npm run typecheck`)
- [ ] Linting passing (`npm run lint`)
- [ ] Code coverage ≥ 70%
- [ ] No console.log in production code
- [ ] No TODO/FIXME comments in critical paths

### Performance
- [ ] Lighthouse score ≥ 90
- [ ] Bundle size < 250KB (gzipped)
- [ ] Images optimized (WebP format)
- [ ] Lazy loading implemented
- [ ] Code splitting configured
- [ ] Tree shaking enabled

### Security
- [ ] All dependencies updated
- [ ] No known vulnerabilities (`npm audit`)
- [ ] Environment variables secured
- [ ] API keys in environment (not hardcoded)
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all forms
- [ ] XSS protection enabled

### SEO
- [ ] Meta tags on all pages
- [ ] Open Graph tags configured
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Structured data added
- [ ] Canonical URLs set
- [ ] 404 page customized

### Monitoring
- [ ] Sentry configured and tested
- [ ] Google Analytics 4 configured
- [ ] Error tracking working
- [ ] Performance monitoring active
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Alerts configured

---

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# API Configuration
NUXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
NUXT_PUBLIC_IMAGE_BASE_URL=https://api.yourdomain.com

# App Configuration
NUXT_PUBLIC_APP_TITLE=Zen Dashboard

# Analytics & Monitoring
NUXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NUXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NUXT_PUBLIC_SENTRY_ENVIRONMENT=production
NUXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1

# CDN (Optional)
CDN_URL=https://cdn.yourdomain.com
```

### GitHub Secrets (CI/CD)
- [ ] `CODECOV_TOKEN` configured
- [ ] `DOCKER_USERNAME` configured
- [ ] `DOCKER_PASSWORD` configured
- [ ] `NUXT_PUBLIC_API_BASE_URL` configured
- [ ] `NUXT_PUBLIC_IMAGE_BASE_URL` configured
- [ ] `NUXT_PUBLIC_SENTRY_DSN` configured
- [ ] `NUXT_PUBLIC_GA_ID` configured

---

## 🏗️ Build & Deploy

### Build Process
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Run full test suite
npm run test:coverage

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build

# Test production build locally
npm run preview
```

### Docker Deployment
```bash
# Build Docker image
npm run docker:build

# Test Docker image locally
npm run docker:run

# Check logs
npm run docker:logs

# Push to registry
docker tag zen-admin:latest your-registry/zen-admin:latest
docker push your-registry/zen-admin:latest
```

### Deployment Steps
- [ ] Build passes successfully
- [ ] Docker image created
- [ ] Image pushed to registry
- [ ] Environment variables set on server
- [ ] Database migrations run (if applicable)
- [ ] SSL certificate installed
- [ ] DNS configured
- [ ] CDN configured
- [ ] Load balancer configured (if applicable)

---

## 🧪 Post-Deployment Testing

### Functional Testing
- [ ] Homepage loads correctly
- [ ] Login/authentication works
- [ ] All critical user flows work
- [ ] Forms submit correctly
- [ ] API calls successful
- [ ] Images load correctly
- [ ] Navigation works

### Performance Testing
- [ ] Page load time < 2s
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Mobile Testing
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Mobile navigation works
- [ ] Forms usable on mobile
- [ ] PWA installable

### Security Testing
- [ ] HTTPS working
- [ ] Security headers present
- [ ] No mixed content warnings
- [ ] Rate limiting working
- [ ] CORS configured correctly

---

## 📊 Monitoring Setup

### Sentry
- [ ] Project created
- [ ] DSN configured
- [ ] Source maps uploaded
- [ ] Alerts configured
- [ ] Team notifications set

### Google Analytics
- [ ] Property created
- [ ] Tracking ID configured
- [ ] Goals/conversions set
- [ ] Custom events working
- [ ] Real-time data visible

### Performance Monitoring
- [ ] Web Vitals tracking
- [ ] Custom metrics configured
- [ ] Dashboards created
- [ ] Alerts configured

### Uptime Monitoring
- [ ] Uptime monitor configured (UptimeRobot, Pingdom, etc.)
- [ ] Health check endpoint monitored
- [ ] Alert contacts configured
- [ ] SMS/Email alerts enabled

---

## 🔄 Rollback Plan

### Preparation
- [ ] Previous version tagged in Git
- [ ] Previous Docker image available
- [ ] Database backup created
- [ ] Rollback procedure documented

### Rollback Steps
```bash
# 1. Stop current deployment
docker-compose down

# 2. Pull previous version
docker pull your-registry/zen-admin:previous-tag

# 3. Start previous version
docker-compose up -d

# 4. Verify rollback
curl https://yourdomain.com/api/health

# 5. Notify team
```

---

## 📈 Success Metrics

### Performance Targets
- [ ] Lighthouse Performance: ≥ 90
- [ ] Lighthouse Accessibility: ≥ 90
- [ ] Lighthouse Best Practices: ≥ 90
- [ ] Lighthouse SEO: ≥ 90
- [ ] Lighthouse PWA: ≥ 90

### Availability Targets
- [ ] Uptime: ≥ 99.9%
- [ ] Error rate: < 0.1%
- [ ] Response time P95: < 1s
- [ ] Response time P99: < 2s

### User Experience
- [ ] Bounce rate: < 40%
- [ ] Average session duration: > 3 min
- [ ] Pages per session: > 3
- [ ] Conversion rate: (set target)

---

## 🚨 Incident Response

### On-Call Setup
- [ ] On-call rotation defined
- [ ] Contact list updated
- [ ] Escalation path defined
- [ ] Runbooks created

### Monitoring Alerts
- [ ] Error rate spike
- [ ] Performance degradation
- [ ] Service downtime
- [ ] High memory usage
- [ ] Slow API responses

### Communication Plan
- [ ] Status page setup
- [ ] User notification process
- [ ] Stakeholder communication
- [ ] Post-mortem template

---

## ✅ Final Sign-Off

### Team Approvals
- [ ] Development team approved
- [ ] QA team approved
- [ ] Product owner approved
- [ ] DevOps team approved
- [ ] Security team approved

### Documentation
- [ ] Deployment guide updated
- [ ] API documentation updated
- [ ] User guide updated
- [ ] Changelog updated
- [ ] Release notes published

### Backup & Recovery
- [ ] Backup strategy documented
- [ ] Recovery procedure tested
- [ ] Data retention policy defined
- [ ] Disaster recovery plan ready

---

## 🎉 Go Live!

**Deployment Date:** _________________

**Deployed By:** _________________

**Version:** _________________

**Notes:**
_________________________________________
_________________________________________
_________________________________________

---

## 📞 Emergency Contacts

- **On-Call Engineer:** _________________
- **DevOps Lead:** _________________
- **Product Owner:** _________________
- **CTO/Tech Lead:** _________________

---

**Remember:** Always deploy during low-traffic hours and have the team ready for immediate rollback if needed!
