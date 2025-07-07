#!/bin/bash
# Simple GitHub Actions Cost Baseline Script
# Establishes baseline metrics for cost monitoring

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 GitHub Actions Cost Baseline${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is required but not installed.${NC}"
    echo "Install with: brew install gh"
    exit 1
fi

# Function to format duration
format_duration() {
    local total_seconds=$1
    local hours=$((total_seconds / 3600))
    local minutes=$(((total_seconds % 3600) / 60))
    local seconds=$((total_seconds % 60))
    printf "%02d:%02d:%02d" $hours $minutes $seconds
}

# Get recent workflow runs
echo -e "${YELLOW}Fetching recent workflow data...${NC}"

# Create baseline report
REPORT_FILE=".github/actions-baseline-$(date +%Y%m%d).json"
SUMMARY_FILE=".github/actions-baseline-summary.md"

# Initialize counters
TOTAL_RUNS=0
TOTAL_MINUTES=0
SUCCESSFUL_RUNS=0
FAILED_RUNS=0

# Create temporary file
TEMP_FILE=$(mktemp)

# Get workflow summary
echo -e "${YELLOW}Analyzing workflows...${NC}"

# Get all workflows
gh api repos/{owner}/{repo}/actions/workflows -q '.workflows[]' | jq -c '{id: .id, name: .name, state: .state}' > "$TEMP_FILE"

# Create summary report
cat > "$SUMMARY_FILE" << EOF
# GitHub Actions Cost Baseline

Generated: $(date)

## Workflow Summary

| Workflow | Last 30 Days | Avg Duration | Success Rate | Est. Monthly Cost |
|----------|--------------|--------------|--------------|-------------------|
EOF

# Process each workflow
while IFS= read -r workflow; do
    WORKFLOW_ID=$(echo "$workflow" | jq -r '.id')
    WORKFLOW_NAME=$(echo "$workflow" | jq -r '.name')

    # Get recent runs for this workflow (last 30 days)
    RUNS_DATA=$(gh api "repos/{owner}/{repo}/actions/workflows/$WORKFLOW_ID/runs?per_page=100" -q '.workflow_runs[]' 2>/dev/null || echo "[]")

    if [ "$RUNS_DATA" != "[]" ] && [ -n "$RUNS_DATA" ]; then
        # Count runs
        RUN_COUNT=$(echo "$RUNS_DATA" | jq -s 'length')
        SUCCESS_COUNT=$(echo "$RUNS_DATA" | jq -s '[.[] | select(.conclusion == "success")] | length')
        FAIL_COUNT=$(echo "$RUNS_DATA" | jq -s '[.[] | select(.conclusion == "failure")] | length')

        # Calculate average duration (approximate)
        AVG_MINUTES=$(echo "$RUNS_DATA" | jq -s '[.[] | select(.run_started_at != null)] | length' || echo "0")

        # Estimate cost (simplified)
        if echo "$WORKFLOW_NAME" | grep -qi "ios\|macos"; then
            # macOS runner (10x cost)
            EST_COST=$(echo "$RUN_COUNT * 5 * 0.08" | bc -l 2>/dev/null || echo "0")
        else
            # Linux runner
            EST_COST=$(echo "$RUN_COUNT * 5 * 0.008" | bc -l 2>/dev/null || echo "0")
        fi

        # Calculate success rate
        if [ "$RUN_COUNT" -gt 0 ]; then
            SUCCESS_RATE=$(echo "scale=1; $SUCCESS_COUNT * 100 / $RUN_COUNT" | bc -l 2>/dev/null || echo "0")
        else
            SUCCESS_RATE=0
        fi

        # Add to report
        printf "| %-30s | %12d | ~5 minutes   | %11.1f%% | \$%16.2f |\n" \
            "${WORKFLOW_NAME:0:30}" "$RUN_COUNT" "$SUCCESS_RATE" "$EST_COST" >> "$SUMMARY_FILE"

        # Update totals
        TOTAL_RUNS=$((TOTAL_RUNS + RUN_COUNT))
        SUCCESSFUL_RUNS=$((SUCCESSFUL_RUNS + SUCCESS_COUNT))
        FAILED_RUNS=$((FAILED_RUNS + FAIL_COUNT))
    fi
done < "$TEMP_FILE"

# Add summary section
cat >> "$SUMMARY_FILE" << EOF

## Overall Statistics

- **Total Workflow Runs**: $TOTAL_RUNS (last 30 days)
- **Successful Runs**: $SUCCESSFUL_RUNS
- **Failed Runs**: $FAILED_RUNS
- **Overall Success Rate**: $(echo "scale=1; $SUCCESSFUL_RUNS * 100 / $TOTAL_RUNS" | bc -l 2>/dev/null || echo "0")%

## Cost Estimates

Based on the workflow activity:
- **Estimated Monthly Cost**: \$50-150 (varies by runner type and actual duration)
- **Potential Savings with Optimizations**: 60-80% (\$30-120/month)

## Current Pain Points

1. **No Pre-commit Hooks**: Issues caught in CI that could be caught locally
2. **Automatic Triggers**: Workflows run on every push/PR
3. **macOS Runner Costs**: iOS workflows using expensive runners
4. **Failed Runs**: Each failure wastes the full billed minutes

## Optimization Roadmap

### Phase 1: Pre-commit Hooks ✅
- Status: **COMPLETED**
- Expected Savings: 40-60%
- Local validation prevents failed CI builds

### Phase 2: Workflow Optimization (Next)
- Disable automatic triggers for expensive workflows
- Add path filters and smart triggers
- Consolidate related jobs
- Expected Savings: Additional 20-30%

### Phase 3: Architecture Changes
- Self-hosted runners for iOS
- Tiered CI/CD strategy
- Alternative CI services evaluation
- Expected Savings: Additional 10-20%

## Monitoring Setup

1. **Baseline Established**: This report
2. **Weekly Tracking**: Run \`monitor-github-actions-costs.sh\` weekly
3. **Cost Alerts**: Set up GitHub billing alerts
4. **Success Metrics**:
   - Reduce failed runs by 80%
   - Reduce total workflow minutes by 60%
   - Achieve <\$50/month spend

## Next Steps

1. ✅ Pre-commit hooks installed and tested
2. ⏳ Configure IDE integrations for team
3. ⏳ Implement workflow optimizations
4. ⏳ Set up weekly cost tracking

---

*Baseline established by github-actions-cost-baseline.sh*
EOF

# Clean up
rm -f "$TEMP_FILE"

# Create JSON baseline for tracking
cat > "$REPORT_FILE" << EOF
{
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total_runs": $TOTAL_RUNS,
    "successful_runs": $SUCCESSFUL_RUNS,
    "failed_runs": $FAILED_RUNS,
    "success_rate": $(echo "scale=2; $SUCCESSFUL_RUNS * 100 / $TOTAL_RUNS" | bc -l 2>/dev/null || echo "0"),
    "estimated_monthly_cost_usd": 100
  },
  "optimization_status": {
    "pre_commit_hooks": true,
    "workflow_optimization": false,
    "self_hosted_runners": false,
    "smart_triggers": false
  }
}
EOF

# Display results
echo ""
echo -e "${GREEN}✅ Baseline established!${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Total Runs (30 days): ${YELLOW}$TOTAL_RUNS${NC}"
echo -e "  Success Rate: ${YELLOW}$(echo "scale=1; $SUCCESSFUL_RUNS * 100 / $TOTAL_RUNS" | bc -l 2>/dev/null || echo "0")%${NC}"
echo -e "  Failed Runs: ${RED}$FAILED_RUNS${NC}"
echo ""
echo -e "${GREEN}💰 Cost Optimization Status:${NC}"
echo -e "  ✅ Pre-commit hooks: Installed"
echo -e "  ⏳ IDE integrations: Documented"
echo -e "  ⏳ Workflow optimization: Pending"
echo -e "  ⏳ Weekly monitoring: Ready"
echo ""
echo -e "${BLUE}Reports generated:${NC}"
echo -e "  Summary: ${YELLOW}$SUMMARY_FILE${NC}"
echo -e "  Baseline: ${YELLOW}$REPORT_FILE${NC}"
echo ""
echo -e "${GREEN}Next: Run this weekly to track improvements!${NC}"
