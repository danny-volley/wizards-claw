#!/bin/bash

# Mindly Starter Template - Project Setup Script
# Initializes a new project with all necessary configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME=""
PROJECT_TYPE=""
GITHUB_USERNAME=""
DEPLOY_PLATFORM=""

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║               Mindly Starter Template Setup                 ║"
    echo "║              Professional Development Ready                  ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Collect project information
collect_project_info() {
    log "Collecting project information..."
    
    # Project name
    if [ -z "$PROJECT_NAME" ]; then
        read -p "Enter project name: " PROJECT_NAME
    fi
    
    # Setup type  
    if [ -z "$PROJECT_TYPE" ]; then
        echo "Select setup type:"
        echo "1) New project - Start fresh with professional workflows"
        echo "2) Existing project - Add professional workflows to existing codebase"
        read -p "Enter choice (1-2): " choice
        
        case $choice in
            1) PROJECT_TYPE="new-project" ;;
            2) PROJECT_TYPE="existing-project" ;;
            *) error "Invalid choice. Exiting." && exit 1 ;;
        esac
    fi
    
    # GitHub username
    if [ -z "$GITHUB_USERNAME" ]; then
        # Try to get from git config
        GITHUB_USERNAME=$(git config --get user.name 2>/dev/null || echo "")
        if [ -z "$GITHUB_USERNAME" ]; then
            read -p "Enter GitHub username: " GITHUB_USERNAME
        else
            read -p "GitHub username [$GITHUB_USERNAME]: " input
            GITHUB_USERNAME=${input:-$GITHUB_USERNAME}
        fi
    fi
    
    # Deployment platform
    if [ -z "$DEPLOY_PLATFORM" ]; then
        echo "Select deployment platform:"
        echo "1) Vercel (recommended for web apps)"
        echo "2) Netlify (static sites)"
        echo "3) Heroku (full-stack apps)"
        echo "4) Railway (modern alternative)"
        echo "5) Skip deployment setup"
        read -p "Enter choice (1-5): " choice
        
        case $choice in
            1) DEPLOY_PLATFORM="vercel" ;;
            2) DEPLOY_PLATFORM="netlify" ;;
            3) DEPLOY_PLATFORM="heroku" ;;
            4) DEPLOY_PLATFORM="railway" ;;
            5) DEPLOY_PLATFORM="none" ;;
            *) error "Invalid choice. Exiting." && exit 1 ;;
        esac
    fi
    
    log "Project setup configuration:"
    log "  Name: $PROJECT_NAME"
    log "  Type: $PROJECT_TYPE"
    log "  GitHub: $GITHUB_USERNAME"
    log "  Platform: $DEPLOY_PLATFORM"
}

# Setup project template
setup_template() {
    log "Setting up $PROJECT_TYPE template..."
    
    # Copy template files
    if [ -d "templates/$PROJECT_TYPE" ]; then
        cp -r templates/$PROJECT_TYPE/* .
        success "Template files copied"
    else
        warning "No specific template for $PROJECT_TYPE, using base template"
    fi
    
    # Process README template
    if [ -f "README-TEMPLATE.md" ]; then
        sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
            -e "s/{{PROJECT_TYPE}}/$PROJECT_TYPE/g" \
            -e "s/{{GITHUB_USERNAME}}/$GITHUB_USERNAME/g" \
            -e "s|{{GITHUB_REPO_URL}}|https://github.com/$GITHUB_USERNAME/$PROJECT_NAME|g" \
            README-TEMPLATE.md > README.md
        rm README-TEMPLATE.md
        success "README.md generated"
    fi
}

# Initialize git repository
init_git() {
    log "Initializing git repository..."
    
    if [ ! -d ".git" ]; then
        git init
        git add .
        git commit -m "feat: initial project setup with Mindly starter template

- Added production-ready CI/CD workflows
- Configured development standards and rules
- Integrated TaskMaster AI for project management
- Set up security scanning and monitoring
- Established cost optimization protocols

Generated from mindly-starter-template"
        success "Git repository initialized"
    else
        log "Git repository already exists, skipping initialization"
    fi
}

# Setup GitHub repository
setup_github() {
    log "Setting up GitHub repository..."
    
    if command -v gh &> /dev/null; then
        read -p "Create GitHub repository? (y/n): " create_repo
        if [ "$create_repo" = "y" ]; then
            gh repo create "$PROJECT_NAME" --public --source=. --remote=origin --push
            success "GitHub repository created and pushed"
        fi
    else
        warning "GitHub CLI not found. Please create repository manually:"
        log "  1. Go to https://github.com/new"
        log "  2. Create repository named: $PROJECT_NAME"
        log "  3. Add remote: git remote add origin https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git"
        log "  4. Push code: git push -u origin main"
    fi
}

# Setup deployment
setup_deployment() {
    log "Setting up deployment for $DEPLOY_PLATFORM..."
    
    case $DEPLOY_PLATFORM in
        "vercel")
            # Create vercel.json if it doesn't exist
            if [ ! -f "vercel.json" ]; then
                cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ]
}
EOF
                success "Vercel configuration created"
            fi
            log "Deploy command: npx vercel --prod"
            ;;
        "netlify")
            # Create netlify.toml if it doesn't exist
            if [ ! -f "netlify.toml" ]; then
                cat > netlify.toml << 'EOF'
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
                success "Netlify configuration created"
            fi
            log "Deploy command: netlify deploy --prod"
            ;;
        "heroku")
            # Create Procfile if it doesn't exist
            if [ ! -f "Procfile" ]; then
                echo "web: npm start" > Procfile
                success "Heroku Procfile created"
            fi
            log "Deploy commands:"
            log "  heroku create $PROJECT_NAME"
            log "  git push heroku main"
            ;;
        "railway")
            log "Railway deployment:"
            log "  1. Connect your GitHub repository at railway.app"
            log "  2. Configure environment variables"
            log "  3. Deploy automatically on push"
            ;;
        "none")
            log "Skipping deployment setup"
            ;;
    esac
}

# Setup development environment
setup_development() {
    log "Setting up development environment..."
    
    # Install dependencies if package.json exists
    if [ -f "package.json" ]; then
        if command -v npm &> /dev/null; then
            npm install
            success "Dependencies installed"
        else
            warning "npm not found. Please install Node.js and run: npm install"
        fi
    fi
    
    # Setup pre-commit hooks
    if [ -f "scripts/setup-pre-commit.sh" ]; then
        chmod +x scripts/setup-pre-commit.sh
        ./scripts/setup-pre-commit.sh
        success "Pre-commit hooks configured"
    fi
    
    # Make scripts executable
    chmod +x scripts/*.sh
    success "Scripts made executable"
}

# Initialize GitHub Issues workflow
setup_github_workflow() {
    log "Setting up GitHub Issues workflow..."
    
    # Copy issue templates if they exist
    if [ -d ".github/ISSUE_TEMPLATE" ]; then
        log "GitHub issue templates already configured"
    else
        # Create basic issue template
        mkdir -p .github/ISSUE_TEMPLATE
        
        cat > .github/ISSUE_TEMPLATE/feature.yml << 'EOF'
name: 🚀 Feature Request
description: Suggest a new feature for this project
title: "[FEATURE] "
labels: ["feature", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to suggest a feature! Please fill out this form to help us understand your request.
  
  - type: textarea
    id: overview
    attributes:
      label: 🎯 Overview
      description: Brief description of the feature
      placeholder: What feature would you like to see added?
    validations:
      required: true
      
  - type: textarea
    id: context
    attributes:
      label: 📍 Context for Newcomers
      description: Background information for developers unfamiliar with this area
      placeholder: What context should new contributors understand?
    validations:
      required: true
      
  - type: textarea
    id: acceptance
    attributes:
      label: ✅ Acceptance Criteria
      description: Define what "done" looks like
      placeholder: |
        - [ ] Criterion 1
        - [ ] Criterion 2
        - [ ] Criterion 3
    validations:
      required: true
EOF

        cat > .github/ISSUE_TEMPLATE/bug.yml << 'EOF'
name: 🐛 Bug Report
description: Report a bug in the project
title: "[BUG] "
labels: ["bug", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a bug! Please fill out this form to help us fix it.
  
  - type: textarea
    id: description
    attributes:
      label: 🐛 Bug Description
      description: Clear description of what went wrong
      placeholder: What happened that shouldn't have?
    validations:
      required: true
      
  - type: textarea
    id: reproduction
    attributes:
      label: 🔄 Steps to Reproduce
      description: Exact steps to reproduce the issue
      placeholder: |
        1. Go to...
        2. Click on...
        3. Scroll down to...
        4. See error
    validations:
      required: true
      
  - type: textarea
    id: expected
    attributes:
      label: ✅ Expected Behavior
      description: What should have happened instead?
    validations:
      required: true
EOF
        
        success "GitHub issue templates created"
    fi
    
    # Create initial setup issue
    log "Creating initial setup issue for project tracking..."
}

# Cleanup function
cleanup() {
    log "Cleaning up template files..."
    
    # Remove template-specific files that shouldn't be in final project
    rm -rf templates/
    rm -f scripts/setup-project.sh  # Remove this script itself
    
    success "Template cleanup completed"
}

# Show completion summary
show_completion() {
    echo ""
    success "🎉 Project setup completed successfully!"
    echo ""
    log "Next steps:"
    echo "  1. Complete manual GitHub setup: ./docs/SETUP-GUIDE.md"
    echo "     - Create labels: ./scripts/create-missing-labels.sh"
    echo "     - Configure branch protection and secrets"
    echo "  2. Review and customize configuration files"
    echo "  3. Update README.md with project-specific information"
    echo "  4. Configure environment variables in .env.local"
    echo "  5. Start development: npm run dev"
    echo ""
    log "Useful commands:"
    echo "  ./scripts/github-actions-cost-baseline.sh  # Monitor CI/CD costs"
    echo "  gh issue list --state open --label 'priority:high'  # Check high priority work"
    echo "  gh issue create --title 'feat: description' --label 'feature'  # Create new issue"
    echo "  npm run build                               # Build for production"
    echo ""
    log "Documentation:"
    echo "  - Development Guide: ./docs/DEVELOPMENT.md"
    echo "  - CRITICAL_CORE Rules: ./rules/CRITICAL_CORE.mdc"
    echo "  - GitHub Issues Templates: ./.github/ISSUE_TEMPLATE/"
    echo ""
    success "Happy coding! 🚀"
}

# Main execution
main() {
    show_banner
    collect_project_info
    setup_template
    init_git
    setup_github
    setup_deployment
    setup_development
    setup_github_workflow
    cleanup
    show_completion
}

# Script arguments handling
while [[ $# -gt 0 ]]; do
    case $1 in
        --name=*)
            PROJECT_NAME="${1#*=}"
            shift
            ;;
        --type=*)
            PROJECT_TYPE="${1#*=}"
            shift
            ;;
        --user=*)
            GITHUB_USERNAME="${1#*=}"
            shift
            ;;
        --platform=*)
            DEPLOY_PLATFORM="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --name=PROJECT_NAME      Set project name"
            echo "  --type=PROJECT_TYPE      Set project type (web-app|mobile-app|api-server)"
            echo "  --user=GITHUB_USERNAME   Set GitHub username"
            echo "  --platform=PLATFORM      Set deployment platform (vercel|netlify|heroku|railway|none)"
            echo "  --help                   Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main