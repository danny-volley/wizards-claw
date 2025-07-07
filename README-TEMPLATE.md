# {{PROJECT_NAME}} - Professional Development Template

> **🚀 Created with [Mindly Starter Template](https://github.com/seanacres/mindly-starter-template)**  
> Production-ready project with best practices, CI/CD, and professional workflows built-in.

## 🎯 What You Get

This template provides everything needed for professional development:

### ✅ **Production-Ready Infrastructure**
- **CI/CD Pipelines** - Automated testing, building, and deployment
- **Quality Gates** - Code standards, security scanning, performance monitoring
- **Cost Optimization** - GitHub Actions cost controls and monitoring

### ✅ **Development Excellence**
- **CRITICAL_CORE Rules** - Universal development principles from proven workflows
- **GitHub Issues Workflow** - Professional issue-first development with templates
- **Automation Scripts** - Battle-tested development and cost optimization tools

### ✅ **Security & Monitoring**
- **Security Scanning** - Automated vulnerability detection
- **Performance Monitoring** - Built-in performance tracking
- **Error Recovery** - Comprehensive error handling protocols

## 🚀 Quick Start

### Option 1: Existing Project (Intelligent Setup)
```bash
# Run from your existing project - analyzes and integrates safely
curl -sL https://raw.githubusercontent.com/seanacres/mindly-starter-template/main/scripts/intelligent-setup.sh | bash

# Or for more control:
git clone --depth 1 https://github.com/seanacres/mindly-starter-template.git .mindly-setup && \
.mindly-setup/scripts/intelligent-setup.sh && rm -rf .mindly-setup
```
See [QUICK-START.md](https://github.com/seanacres/mindly-starter-template/blob/main/QUICK-START.md) for details.

### Option 2: New Project (Traditional Setup)
```bash
# Clone and initialize new project
git clone https://github.com/seanacres/mindly-starter-template.git {{PROJECT_NAME}}
cd {{PROJECT_NAME}}
./scripts/setup-project.sh
```

### Option 3: Claudia GUI (Non-Technical)
1. Open [Claudia](https://github.com/getAsterisk/claudia)
2. Click "Create New Project"
3. Select your project type
4. Deploy with one button click

## 📋 Project Structure

```
{{PROJECT_NAME}}/
├── .github/workflows/          # CI/CD automation
├── .github/                   # Issues templates & workflows
├── src/                       # Your application code
├── tests/                     # Test suites
├── scripts/                   # Development automation
├── rules/                     # Development standards
└── docs/                      # Project documentation
```

## 🛠️ Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run test                   # Run test suite

# Quality & Automation
./scripts/github-actions-cost-baseline.sh  # Monitor CI/CD costs
./scripts/setup-pre-commit.sh              # Setup pre-commit hooks
./scripts/validate-issue-labels.sh         # Validate issue hygiene

# Issue-First Development  
gh issue list --state open --label "priority:high"  # Check high priority work
gh issue create --title "feat: description" --body "Details" --label "feature"  # Create new issue
gh issue edit <number> --add-assignee @me  # Assign yourself to issue
```

## 🏗️ Architecture

### Professional Development Foundation
This template provides the **proven workflow and tooling** from a production project:

**Core Infrastructure:**
- **GitHub Issues First** - All work starts with proper issue creation and tracking
- **CRITICAL_CORE Principles** - Battle-tested development rules and protocols
- **Cost-Aware CI/CD** - GitHub Actions with built-in cost monitoring and optimization
- **Security-First** - Automated vulnerability scanning and best practices
- **Quality Gates** - Comprehensive testing, linting, and validation

**Adaptable Base:**
- Works with any web technology stack (React, Vue, Angular, vanilla JS, etc.)
- Provides foundation scripts and workflows that enhance any project
- Focuses on **development process excellence** rather than specific frameworks

## 🔧 Configuration

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Configure your settings
# - API keys
# - Database connections
# - Deployment targets
```

### CI/CD Configuration
The template includes production-ready workflows:
- **Quality Checks** - Linting, testing, security scanning
- **Cost Controls** - GitHub Actions usage monitoring
- **Deployment** - Automated deployment to your platform

## 📊 Monitoring & Analytics

### Built-in Dashboards
- **GitHub Actions Costs** - Track and optimize CI/CD spending
- **Performance Metrics** - Monitor application performance
- **Task Velocity** - Development progress tracking

### Alerts & Notifications
- Cost threshold alerts
- Security vulnerability notifications
- Performance regression detection

## 🤝 Development Workflow

This project follows professional development standards:

1. **Issue-First Development** - All work starts with GitHub issues
2. **Quality Gates** - Comprehensive testing and validation
3. **Cost Awareness** - Proactive CI/CD cost management
4. **Security-First** - Built-in security scanning and best practices

### Contributing
1. Create issue for your work
2. Create feature branch: `git checkout -b feature/issue-123-description`
3. Follow CRITICAL_CORE development principles
4. Submit PR with proper linking and testing

## 📄 Documentation

- **[Development Guide](./docs/DEVELOPMENT.md)** - Detailed development instructions
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment steps
- **[API Documentation](./docs/API.md)** - API reference and examples
- **[CRITICAL_CORE Rules](./rules/CRITICAL_CORE.mdc)** - Development principles

## 🎯 Performance Standards

This template maintains professional quality standards:
- **Zero Warnings** - Clean builds always
- **Cost Optimization** - GitHub Actions costs <$50/month
- **Security First** - No known vulnerabilities
- **Performance** - Core Web Vitals optimized

## 🚨 Support & Help

### Quick Help
- `./scripts/help.sh` - Show all available commands
- `./docs/SETUP-GUIDE.md` - Manual setup steps (labels, permissions, etc.)
- Follow CRITICAL_CORE workflow principles
- Check [Issues]({{GITHUB_REPO_URL}}/issues) for known problems

### Getting Unstuck
1. Check the troubleshooting guide in `docs/TROUBLESHOOTING.md`
2. Search existing issues for solutions
3. Create new issue with detailed problem description

---

**Built with ❤️ using [Mindly Starter Template](https://github.com/seanacres/mindly-starter-template)**

*This template provides a foundation for professional development. Customize it to match your specific needs while maintaining the quality standards and automation.*