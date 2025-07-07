#!/bin/bash

# Help script - Shows available commands and scripts
# This provides a quick reference for all automation tools

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Mindly Starter Template - Command Reference         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}📋 Project Setup${NC}"
echo "  ./scripts/setup-project.sh              # Initial project setup wizard"
echo "  ./scripts/create-missing-labels.sh      # Create GitHub labels"
echo "  ./scripts/setup-pre-commit.sh           # Configure pre-commit hooks"
echo ""

echo -e "${GREEN}🔍 Development Workflow${NC}"
echo "  gh issue list --state open --label 'priority:high'    # Check high priority work"
echo "  gh issue create --title 'feat: desc' --label 'feature' # Create new issue"
echo "  gh issue edit <number> --add-assignee @me              # Assign yourself"
echo "  git checkout -b feat/<number>-description              # Create feature branch"
echo ""

echo -e "${GREEN}💰 Cost Monitoring${NC}"
echo "  ./scripts/github-actions-cost-baseline.sh  # Generate cost report"
echo "  cat .github/actions-baseline-summary.md     # View latest cost summary"
echo ""

echo -e "${GREEN}✅ Quality Validation${NC}"
echo "  ./scripts/validate-issue-labels.sh      # Check label consistency"
echo "  pre-commit run --all-files              # Run all pre-commit checks"
echo "  git branch -vv | grep 'gone]'          # Find stale branches"
echo ""

echo -e "${GREEN}📊 GitHub Commands${NC}"
echo "  gh pr create --title 'type: Description (#number)' --body 'Fixes #<number>'"
echo "  gh pr list --state open                 # List open PRs"
echo "  gh run list --limit 5                   # Check recent CI/CD runs"
echo "  gh workflow list                        # List all workflows"
echo ""

echo -e "${GREEN}🚀 Deployment${NC}"
echo "  npm run build                           # Build for production"
echo "  npm run deploy                          # Deploy (if configured)"
echo "  vercel --prod                           # Deploy to Vercel"
echo "  netlify deploy --prod                   # Deploy to Netlify"
echo ""

echo -e "${YELLOW}📚 Documentation${NC}"
echo "  rules/CRITICAL_CORE.mdc                 # Development principles"
echo "  docs/SETUP-GUIDE.md                     # Manual setup steps"
echo "  .github/ISSUE_TEMPLATE/                 # Issue templates"
echo ""

echo -e "${CYAN}💡 Quick Tips:${NC}"
echo "  • Always create an issue before starting work"
echo "  • Use branch pattern: type/<issue-number>-description"
echo "  • Include #<issue-number> in all commits"
echo "  • Run pre-commit hooks before pushing"
echo "  • Monitor GitHub Actions costs weekly"
echo ""

echo -e "${CYAN}🆘 Need more help?${NC}"
echo "  • Check docs/SETUP-GUIDE.md for detailed setup"
echo "  • Read rules/CRITICAL_CORE.mdc for workflow details"
echo "  • Create an issue for questions or problems"
echo ""