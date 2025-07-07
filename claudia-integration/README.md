# Claudia Integration

This directory contains Claudia agent configurations that enable both developer workflows and non-technical one-button deployment for the Mindly Starter Template.

## Overview

The Claudia integration provides two complementary approaches:

### For Developers
- **CLI/Script Access**: Full control through command-line tools
- **Advanced Configuration**: Detailed customization options
- **Integration with Existing Workflows**: Works with git, CI/CD, and development tools

### For Non-Technical Users  
- **GUI Interface**: Visual project creation and management
- **One-Button Deployment**: Simple platform deployment
- **Guided Workflows**: Step-by-step project setup

## Available Agents

### 1. Project Scaffold Agent (`project-scaffold-agent.claudia.json`)
**Purpose**: Creates new projects from templates with best practices built-in.

**Capabilities**:
- Web app, mobile app, and API server templates
- Automatic dependency installation
- Git repository initialization
- CI/CD workflow setup
- Development environment configuration

**Usage**:
- **GUI**: Click "Create New Project" in Claudia welcome screen
- **CLI**: `claudia execute project-scaffold-agent "Create a new web app called MyApp"`

### 2. Deployment Setup Agent (`deployment-setup-agent.claudia.json`)  
**Purpose**: Configures one-click deployment to major platforms.

**Capabilities**:
- Vercel, Netlify, Heroku, Railway support
- Environment variable configuration
- Domain setup assistance
- SSL certificate configuration
- Performance optimization

**Usage**:
- **GUI**: Click "Deploy" button in project interface
- **CLI**: `claudia execute deployment-setup-agent "Deploy to Vercel"`

### 3. Security Setup Agent (`security-setup-agent.claudia.json`)
**Purpose**: Implements production-ready security measures.

**Capabilities**:
- Security scanning configuration
- Dependency vulnerability checks
- Authentication system setup
- HTTPS enforcement
- Security headers configuration

**Usage**:
- **GUI**: Enable security features in project wizard
- **CLI**: `claudia execute security-setup-agent "Add security scanning"`

### 4. Monitoring Setup Agent (`monitoring-setup-agent.claudia.json`)
**Purpose**: Adds observability and performance monitoring.

**Capabilities**:
- Error tracking integration
- Performance monitoring setup
- Analytics configuration
- Alerting and notifications
- Dashboard creation

**Usage**:
- **GUI**: Configure monitoring in deployment options
- **CLI**: `claudia execute monitoring-setup-agent "Setup error tracking"`

## Integration Architecture

### Agent Execution Flow
```
User Request → Claudia GUI/CLI → Agent Selection → Template Processing → Project Generation
```

### Template Resolution
1. **User selects project type** (web-app, mobile-app, api-server)
2. **Agent processes template** from `templates/` directory
3. **Variables substituted** ({{PROJECT_NAME}}, {{GITHUB_USERNAME}}, etc.)
4. **Dependencies installed** and configuration applied
5. **Project initialized** with git, CI/CD, and deployment setup

### Platform Integration
- **GitHub**: Repository creation and configuration
- **Vercel/Netlify/Heroku**: Deployment pipeline setup
- **CI/CD**: Automated testing and deployment workflows
- **Monitoring**: Error tracking and performance monitoring

## Configuration

### Environment Variables
```bash
# Required for deployment agents
VERCEL_TOKEN=your_vercel_token
NETLIFY_TOKEN=your_netlify_token
HEROKU_API_KEY=your_heroku_key

# Optional for enhanced features
GITHUB_TOKEN=your_github_token
SENTRY_DSN=your_sentry_dsn
```

### Agent Customization
Each agent can be customized by modifying their `.claudia.json` configuration:

```json
{
  "agent": {
    "name": "Custom Project Scaffold Agent",
    "model": "sonnet",
    "system_prompt": "Your custom instructions...",
    "default_task": "Create project with custom requirements"
  }
}
```

## GUI Integration Points

### Welcome Screen Enhancement
- **"Create New Project"** button prominently displayed
- **Visual project type selection** with icons and descriptions
- **One-click templates** for common project types

### Project Wizard Flow
1. **Project Type Selection**: Visual cards for web-app, mobile-app, api-server
2. **Basic Configuration**: Project name, GitHub username, description
3. **Deployment Options**: Platform selection with one-click setup
4. **Advanced Options**: Security, monitoring, and custom features (optional)
5. **Creation & Deployment**: Automated project setup and deployment

### Progress Tracking
- **Real-time feedback** during project creation
- **Step-by-step progress** with clear status indicators
- **Error handling** with helpful suggestions and recovery options

## Development Workflow Integration

### For Existing Projects
- **Import existing project** into Claudia for management
- **Add missing features** (CI/CD, security, monitoring) to legacy projects
- **Upgrade project structure** to match current best practices

### For New Development
- **Template-based creation** with production-ready defaults
- **GitHub Issues workflow** with professional templates and automation
- **Automated quality gates** and deployment pipelines

## Troubleshooting

### Common Issues

1. **Agent Import Fails**
   - Ensure Claudia is updated to latest version
   - Check agent JSON syntax validity
   - Verify all required dependencies are installed

2. **Deployment Setup Fails**  
   - Verify platform API tokens are configured
   - Check network connectivity and permissions
   - Review platform-specific requirements

3. **Template Processing Errors**
   - Ensure all template variables are defined
   - Check file permissions in templates directory
   - Verify Node.js and npm are installed

### Getting Help

1. **Check agent execution logs** in Claudia interface
2. **Review template documentation** in respective directories
3. **Create issue** with detailed error information and steps to reproduce

## Contributing

### Adding New Templates
1. Create new directory in `templates/`
2. Add template files with variable substitution
3. Update project-scaffold-agent to support new type
4. Test agent execution with new template

### Enhancing Agents
1. Modify agent `.claudia.json` configuration
2. Test agent execution and error handling
3. Update documentation with new capabilities
4. Submit pull request with changes

---

**The Claudia integration bridges the gap between powerful development tools and accessible user interfaces, enabling both technical and non-technical users to create professional-quality projects with minimal effort.**