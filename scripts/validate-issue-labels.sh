#!/bin/bash
# Validate and auto-apply labels to GitHub issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function print_usage() {
    echo "Usage: $0 [issue-number|--all|--recent]"
    echo ""
    echo "Options:"
    echo "  issue-number    Validate and fix labels for specific issue"
    echo "  --all          Validate and fix labels for all open issues"
    echo "  --recent       Validate and fix labels for issues from last 7 days"
    echo "  --check        Check label compliance without making changes"
    echo ""
    echo "Examples:"
    echo "  $0 123          # Fix labels for issue #123"
    echo "  $0 --recent     # Fix labels for recent issues"
    echo "  $0 --check      # Check compliance without changes"
}

function validate_issue_labels() {
    local issue_number="$1"
    local fix_labels="${2:-true}"

    echo -e "${BLUE}🔍 Validating issue #${issue_number}...${NC}"

    # Get issue details
    local issue_json=$(gh issue view "$issue_number" --json title,labels,state)
    local title=$(echo "$issue_json" | jq -r '.title')
    local state=$(echo "$issue_json" | jq -r '.state')
    local current_labels=$(echo "$issue_json" | jq -r '.labels[].name' | tr '\n' ',' | sed 's/,$//')

    if [[ "$state" != "OPEN" ]]; then
        echo -e "${YELLOW}⏭️  Skipping closed issue #${issue_number}${NC}"
        return 0
    fi

    echo "  Title: $title"
    echo "  Current labels: ${current_labels:-none}"

    # Parse title for components
    if [[ ! "$title" =~ ^\[([A-Z]+)-([A-Z0-9]+)\][[:space:]]+([A-Za-z]+):[[:space:]]+(.+)$ ]]; then
        echo -e "${RED}❌ Invalid title format, skipping label validation${NC}"
        return 1
    fi

    local project="${BASH_REMATCH[1]}"
    local phase="${BASH_REMATCH[2]}"
    local type="${BASH_REMATCH[3]}"
    local description="${BASH_REMATCH[4]}"

    # Determine required labels
    local required_labels=()

    # Project-based labels
    case "$project" in
        "MIND") required_labels+=("ios") ;;
        "WIDGET") required_labels+=("widget" "ios") ;;
        "WATCH") required_labels+=("watchOS") ;;
        "DOCS") required_labels+=("documentation") ;;
        "TOOLS") required_labels+=("infrastructure") ;;
    esac

    # Phase-based labels
    case "$phase" in
        "FE") required_labels+=("ui-ux") ;;
        "BE") required_labels+=("backend") ;;
        "INFRA") required_labels+=("infrastructure") ;;
        "SEC") required_labels+=("security") ;;
        "PERF") required_labels+=("performance") ;;
        "A11Y") required_labels+=("accessibility") ;;
        "PROD") required_labels+=("production") ;;
    esac

    # Type-based labels
    case "$type" in
        "Feature") required_labels+=("feature") ;;
        "Enhancement") required_labels+=("enhancement") ;;
        "Bug") required_labels+=("bug") ;;
        "UI"|"UX") required_labels+=("ui-ux") ;;
        "Test") required_labels+=("testing") ;;
        "API") required_labels+=("backend") ;;
        "Docs") required_labels+=("documentation") ;;
    esac

    # Smart defaults for required categories

    # Effort estimation
    local effort_label="effort:2h"  # Default
    local desc_lower=$(echo "$description" | tr '[:upper:]' '[:lower:]')
    if [[ "$desc_lower" =~ (quick|simple|small|fix) || "$type" == "Bug" ]]; then
        effort_label="effort:1h"
    elif [[ "$desc_lower" =~ (comprehensive|complex|large|system) || "$type" == "Feature" ]]; then
        effort_label="effort:3h"
    fi
    required_labels+=("$effort_label")

    # Priority assessment
    local priority_label="priority: medium"  # Default
    if [[ "$type" == "Bug" || "$phase" == "SEC" ]]; then
        priority_label="priority: high"
    elif [[ "$type" =~ ^(Test|Docs)$ ]]; then
        priority_label="priority: low"
    fi
    required_labels+=("$priority_label")

    # Note: Status is now handled by project board, not labels
    # Default status will be set to "Ready" in project board automation

    # Check for missing labels
    local missing_labels=()
    local has_effort=false
    local has_priority=false

    for label in "${required_labels[@]}"; do
        if [[ ! "$current_labels" =~ $label ]]; then
            missing_labels+=("$label")
        fi
    done

    # Check for required categories
    if [[ "$current_labels" =~ effort: ]]; then has_effort=true; fi
    if [[ "$current_labels" =~ priority: ]]; then has_priority=true; fi
    # Note: Status is now handled by project board, not labels

    # Report findings
    local needs_fix=false
    if [[ ${#missing_labels[@]} -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Missing labels: ${missing_labels[*]}${NC}"
        needs_fix=true
    fi

    if [[ "$has_effort" == false ]]; then
        echo -e "${YELLOW}⚠️  Missing effort estimation label${NC}"
        needs_fix=true
    fi

    if [[ "$has_priority" == false ]]; then
        echo -e "${YELLOW}⚠️  Missing priority label${NC}"
        needs_fix=true
    fi

    # Status is now managed by project board, not labels

    if [[ "$needs_fix" == false ]]; then
        echo -e "${GREEN}✅ All required labels present${NC}"
        return 0
    fi

    # Apply fixes if requested
    if [[ "$fix_labels" == "true" ]]; then
        echo -e "${BLUE}🔧 Auto-applying missing labels...${NC}"

        # Remove duplicates from required_labels, preserving spaces in label names
        local unique_labels=()
        while IFS= read -r label; do
            unique_labels+=("$label")
        done < <(printf '%s\n' "${required_labels[@]}" | sort -u)

        # Add labels one at a time (more reliable than comma-separated)
        local success=true
        for label in "${unique_labels[@]}"; do
            if ! gh issue edit "$issue_number" --add-label "$label" >/dev/null 2>&1; then
                echo -e "${YELLOW}⚠️  Could not add label: $label${NC}"
                success=false
            fi
        done

        if [[ "$success" == true ]]; then
            echo -e "${GREEN}✅ Successfully applied labels to issue #${issue_number}${NC}"
        else
            echo -e "${YELLOW}⚠️  Some labels may not have been applied to issue #${issue_number}${NC}"
        fi
    else
        echo -e "${YELLOW}💡 Run with --fix to automatically apply missing labels${NC}"
    fi

    return 0
}

# Main script
case "${1:-}" in
    -h|--help)
        print_usage
        exit 0
        ;;
    --check)
        echo -e "${BLUE}🔍 Checking label compliance for recent issues...${NC}"
        issues=$(gh issue list --state open --limit 10 --json number --jq '.[].number')

        total=0
        compliant=0

        for issue in $issues; do
            ((total++))
            if validate_issue_labels "$issue" false; then
                ((compliant++))
            fi
            echo ""
        done

        echo -e "${BLUE}📊 Compliance Report:${NC}"
        echo "  Compliant: $compliant/$total issues"
        echo "  Compliance rate: $(( compliant * 100 / total ))%"
        ;;
    --all)
        echo -e "${BLUE}🔧 Fixing labels for all open issues...${NC}"
        issues=$(gh issue list --state open --limit 50 --json number --jq '.[].number')

        for issue in $issues; do
            validate_issue_labels "$issue" true
            echo ""
        done
        ;;
    --recent)
        echo -e "${BLUE}🔧 Fixing labels for recent issues (last 7 days)...${NC}"
        # macOS compatible date command (fallback to recent 20 issues if date fails)
        issues=$(gh issue list --state open --created "$(date -v-7d '+%Y-%m-%d' 2>/dev/null || echo '2024-01-01')" --json number --jq '.[].number' 2>/dev/null || gh issue list --state open --limit 20 --json number --jq '.[].number')

        for issue in $issues; do
            validate_issue_labels "$issue" true
            echo ""
        done
        ;;
    [0-9]*)
        issue_number="$1"
        validate_issue_labels "$issue_number" true
        ;;
    "")
        echo -e "${RED}Error: No arguments provided${NC}"
        echo ""
        print_usage
        exit 1
        ;;
    *)
        echo -e "${RED}Error: Invalid argument '$1'${NC}"
        echo ""
        print_usage
        exit 1
        ;;
esac
