#!/bin/bash
# Setup script for pre-commit hooks
# This reduces GitHub Actions costs by catching issues locally

set -e

echo "🚀 Setting up pre-commit hooks for cost-effective CI/CD..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is required but not installed.${NC}"
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip3 is required but not installed.${NC}"
    exit 1
fi

# Install pre-commit if not already installed
if ! command -v pre-commit &> /dev/null; then
    echo -e "${YELLOW}📦 Installing pre-commit...${NC}"
    pip3 install pre-commit
else
    echo -e "${GREEN}✓ pre-commit is already installed${NC}"
fi

# Install pre-commit hooks
echo -e "${YELLOW}🔗 Installing pre-commit hooks...${NC}"
pre-commit install
pre-commit install --hook-type commit-msg

# Install Python development dependencies
echo -e "${YELLOW}📦 Installing Python development dependencies...${NC}"
pip3 install black flake8 isort mypy bandit pytest pytest-cov

# Check for SwiftLint (for iOS development)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v swiftlint &> /dev/null; then
        echo -e "${YELLOW}📱 SwiftLint not found. Installing via Homebrew...${NC}"
        if command -v brew &> /dev/null; then
            brew install swiftlint
        else
            echo -e "${RED}❌ Homebrew not installed. Please install SwiftLint manually.${NC}"
            echo "   Visit: https://github.com/realm/SwiftLint"
        fi
    else
        echo -e "${GREEN}✓ SwiftLint is already installed${NC}"
    fi
fi

# Run pre-commit on all files to check setup
echo -e "${YELLOW}🧪 Testing pre-commit setup...${NC}"
pre-commit run --all-files || true

echo -e "${GREEN}✅ Pre-commit setup complete!${NC}"
echo ""
echo "📋 Usage:"
echo "   - Hooks will run automatically on 'git commit'"
echo "   - Run manually: pre-commit run --all-files"
echo "   - Skip hooks: git commit --no-verify"
echo "   - Update hooks: pre-commit autoupdate"
echo ""
echo "💰 Cost Savings:"
echo "   - Local validation prevents failed CI builds"
echo "   - Estimated savings: 40-60% of GitHub Actions minutes"
echo "   - Fast feedback loop (most hooks run in <10 seconds)"
echo ""
echo "🎯 Next Steps:"
echo "   1. Make a test commit to verify hooks are working"
echo "   2. Configure your IDE to run formatters on save"
echo "   3. Share this setup with your team"
