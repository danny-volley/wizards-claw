#!/bin/bash
# Create missing GitHub labels for better issue management
# Prevents API failures when creating issues

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏷️  Creating Missing GitHub Labels${NC}"
echo ""

# Track results
CREATED=0
SKIPPED=0
FAILED=0

# Function to create label
create_label() {
    local name="$1"
    local color="$2"
    local description="$3"

    # Check if label exists
    if gh label list | grep -q "^$name"; then
        echo -e "${YELLOW}⏭️  Skipping '$name' (already exists)${NC}"
        SKIPPED=$((SKIPPED + 1))
    else
        if gh label create "$name" --color "$color" --description "$description" 2>/dev/null; then
            echo -e "${GREEN}✅ Created '$name'${NC}"
            CREATED=$((CREATED + 1))
        else
            echo -e "${RED}❌ Failed to create '$name'${NC}"
            FAILED=$((FAILED + 1))
        fi
    fi
}

echo -e "${BLUE}Creating Cost & Infrastructure Labels...${NC}"

# Cost-related labels
create_label "cost-optimization" "1d76db" "Reducing operational costs"
create_label "billing" "ff9800" "Billing and payment related"
create_label "emergency" "d73a4a" "Urgent issues requiring immediate action"
create_label "github-actions" "2188ff" "GitHub Actions CI/CD related"
create_label "monitoring" "0e8a16" "Monitoring and observability"

# Infrastructure labels
create_label "infrastructure" "c2e0c6" "Infrastructure and DevOps"
create_label "ci-cd" "5319e7" "Continuous Integration/Deployment"
create_label "tooling" "f9d0c4" "Development tools and scripts"
create_label "automation" "fbca04" "Automation and workflow improvements"
create_label "self-hosted" "006b75" "Self-hosted infrastructure"

# Phase labels for tracking
create_label "phase-1" "bfd4f2" "Phase 1 implementation"
create_label "phase-2" "bfd4f2" "Phase 2 implementation"
create_label "phase-3" "bfd4f2" "Phase 3 implementation"

# Workflow-specific labels
create_label "workflow-optimization" "1d76db" "Workflow efficiency improvements"
create_label "pre-commit" "0052cc" "Pre-commit hooks related"
create_label "manual-trigger" "fef2c0" "Manually triggered workflows"

# Crisis response labels
create_label "crisis-response" "b60205" "Emergency response required"
create_label "post-mortem" "d4c5f9" "Post-incident analysis"
create_label "runbook" "76d7c4" "Documentation for crisis response"

# Savings tracking
create_label "cost-savings" "0e8a16" "Documented cost savings"
create_label "efficiency" "c5def5" "Efficiency improvements"

echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Created: ${GREEN}$CREATED${NC}"
echo -e "  Skipped: ${YELLOW}$SKIPPED${NC}"
echo -e "  Failed: ${RED}$FAILED${NC}"

# List all labels for verification
echo ""
echo -e "${BLUE}Current label count:${NC}"
TOTAL_LABELS=$(gh label list | wc -l)
echo -e "  Total labels: ${YELLOW}$TOTAL_LABELS${NC}"

# Suggest using labels
if [ $CREATED -gt 0 ]; then
    echo ""
    echo -e "${GREEN}✨ New labels created successfully!${NC}"
    echo ""
    echo "You can now use these labels when creating issues:"
    echo "  gh issue create --label \"cost-optimization\" --label \"emergency\""
    echo ""
    echo "Or add to existing issues:"
    echo "  gh issue edit 234 --add-label \"cost-optimization,monitoring\""
fi
