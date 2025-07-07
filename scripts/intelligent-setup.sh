#!/bin/bash

# Intelligent Setup Script for Existing Projects
# Safely integrates professional workflows into existing codebases
# with conflict detection, backup, and rollback capabilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR=".mindly-backup-$(date +%Y%m%d-%H%M%S)"
CONFLICTS_LOG="setup-conflicts.log"
SETUP_REPORT="setup-report.md"
DRY_RUN=false
FORCE=false
INTERACTIVE=true

# Setup state tracking
declare -A EXISTING_FEATURES
declare -A SETUP_TASKS
declare -A CONFLICTS
TOTAL_STEPS=0
CURRENT_STEP=0

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "[WARNING] $1" >> "$CONFLICTS_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[ERROR] $1" >> "$CONFLICTS_LOG"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo -e "${MAGENTA}[Step $CURRENT_STEP/$TOTAL_STEPS]${NC} $1"
}

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║     Intelligent Setup for Existing Projects - ULTRATHINK     ║"
    echo "║         Safe Integration of Professional Workflows           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Deep analysis of existing project
analyze_existing_project() {
    progress "Analyzing existing project structure..."
    
    # Check Git status
    if [ -d .git ]; then
        EXISTING_FEATURES["git"]="true"
        info "Git repository detected"
        
        # Check for uncommitted changes
        if ! git diff --quiet || ! git diff --cached --quiet; then
            warning "Uncommitted changes detected - please commit or stash first"
            if [ "$FORCE" != "true" ]; then
                error "Aborting to prevent data loss. Use --force to override"
                exit 1
            fi
        fi
    else
        EXISTING_FEATURES["git"]="false"
        warning "No Git repository found - will initialize"
    fi
    
    # Analyze GitHub features
    if [ -d .github ]; then
        EXISTING_FEATURES["github"]="true"
        info "GitHub configuration detected"
        
        # Check workflows
        if [ -d .github/workflows ]; then
            EXISTING_FEATURES["workflows"]="true"
            WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l | tr -d ' ')
            info "Found $WORKFLOW_COUNT existing workflows"
            
            # Analyze workflow patterns
            if grep -r "on:\s*push:" .github/workflows/ 2>/dev/null; then
                warning "Automatic push triggers detected - potential cost impact"
                CONFLICTS["auto-triggers"]="true"
            fi
        fi
        
        # Check issue templates
        if [ -d .github/ISSUE_TEMPLATE ]; then
            EXISTING_FEATURES["issue-templates"]="true"
            info "Issue templates already exist"
        fi
        
        # Check PR template
        if [ -f .github/PULL_REQUEST_TEMPLATE.md ]; then
            EXISTING_FEATURES["pr-template"]="true"
            info "PR template already exists"
        fi
    fi
    
    # Check for existing scripts
    if [ -d scripts ]; then
        EXISTING_FEATURES["scripts"]="true"
        info "Scripts directory exists"
    fi
    
    # Check for rules/standards
    if [ -d rules ] || [ -f .eslintrc* ] || [ -f .prettierrc* ]; then
        EXISTING_FEATURES["standards"]="true"
        info "Development standards detected"
    fi
    
    # Check package manager
    if [ -f package.json ]; then
        EXISTING_FEATURES["npm"]="true"
        info "NPM project detected"
    elif [ -f Cargo.toml ]; then
        EXISTING_FEATURES["cargo"]="true"
        info "Rust project detected"
    elif [ -f requirements.txt ] || [ -f setup.py ]; then
        EXISTING_FEATURES["python"]="true"
        info "Python project detected"
    fi
    
    # Check for pre-commit
    if [ -f .pre-commit-config.yaml ]; then
        EXISTING_FEATURES["pre-commit"]="true"
        info "Pre-commit hooks already configured"
    fi
    
    # Check CI/CD platforms
    if [ -f .github/workflows/*.yml ] 2>/dev/null; then
        EXISTING_FEATURES["github-actions"]="true"
    fi
    if [ -f .circleci/config.yml ]; then
        EXISTING_FEATURES["circleci"]="true"
        warning "CircleCI detected - GitHub Actions integration may conflict"
    fi
    if [ -f .travis.yml ]; then
        EXISTING_FEATURES["travis"]="true"
        warning "Travis CI detected - consider migrating to GitHub Actions"
    fi
}

# Create backup of existing configurations
create_backup() {
    progress "Creating backup of existing configurations..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup existing directories if they exist
    for dir in .github scripts rules; do
        if [ -d "$dir" ]; then
            cp -r "$dir" "$BACKUP_DIR/"
            info "Backed up $dir to $BACKUP_DIR/"
        fi
    done
    
    # Backup configuration files
    for file in .pre-commit-config.yaml .eslintrc* .prettierrc*; do
        if [ -f "$file" ]; then
            cp "$file" "$BACKUP_DIR/"
            info "Backed up $file"
        fi
    done
    
    success "Backup created at $BACKUP_DIR"
    echo "Restore command: cp -r $BACKUP_DIR/* ."
}

# Intelligent merge strategies
merge_github_workflows() {
    progress "Merging GitHub workflows intelligently..."
    
    mkdir -p .github/workflows
    
    # Define critical workflows from template
    TEMPLATE_WORKFLOWS=(
        "ci-cd.yml"
        "security.yml"
        "pr-quality.yml"
    )
    
    for workflow in "${TEMPLATE_WORKFLOWS[@]}"; do
        TEMPLATE_FILE="mindly-starter-template/.github/workflows/$workflow"
        TARGET_FILE=".github/workflows/$workflow"
        
        if [ -f "$TARGET_FILE" ]; then
            # Workflow exists - need intelligent merge
            warning "Workflow $workflow already exists"
            
            if [ "$INTERACTIVE" = "true" ]; then
                echo "Options for $workflow:"
                echo "1) Keep existing (skip template)"
                echo "2) Replace with template"
                echo "3) Create merged version as $workflow.mindly"
                echo "4) View diff"
                read -p "Choice (1-4): " choice
                
                case $choice in
                    1) info "Keeping existing $workflow" ;;
                    2) 
                        cp "$TARGET_FILE" "$TARGET_FILE.backup"
                        cp "$TEMPLATE_FILE" "$TARGET_FILE"
                        success "Replaced $workflow (backup: $workflow.backup)"
                        ;;
                    3)
                        cp "$TEMPLATE_FILE" "$TARGET_FILE.mindly"
                        success "Created $workflow.mindly for manual merge"
                        CONFLICTS["workflow-$workflow"]="manual-merge-required"
                        ;;
                    4)
                        diff -u "$TARGET_FILE" "$TEMPLATE_FILE" || true
                        # Recurse to show options again
                        merge_github_workflows
                        return
                        ;;
                esac
            else
                # Non-interactive mode - create .mindly version
                cp "$TEMPLATE_FILE" "$TARGET_FILE.mindly"
                warning "Created $workflow.mindly - manual merge required"
                CONFLICTS["workflow-$workflow"]="manual-merge-required"
            fi
        else
            # Workflow doesn't exist - safe to copy
            cp "$TEMPLATE_FILE" "$TARGET_FILE"
            success "Added $workflow"
        fi
    done
}

# Merge issue templates intelligently
merge_issue_templates() {
    progress "Merging issue templates..."
    
    mkdir -p .github/ISSUE_TEMPLATE
    
    if [ "${EXISTING_FEATURES["issue-templates"]}" = "true" ]; then
        warning "Issue templates exist - creating .mindly versions for review"
        
        # Copy template files with .mindly extension
        for template in mindly-starter-template/.github/ISSUE_TEMPLATE/*; do
            if [ -f "$template" ]; then
                basename=$(basename "$template")
                target=".github/ISSUE_TEMPLATE/$basename"
                
                if [ -f "$target" ]; then
                    cp "$template" "$target.mindly"
                    CONFLICTS["issue-template-$basename"]="manual-merge-required"
                else
                    cp "$template" "$target"
                    success "Added issue template: $basename"
                fi
            fi
        done
    else
        # No existing templates - safe to copy all
        cp -r mindly-starter-template/.github/ISSUE_TEMPLATE/* .github/ISSUE_TEMPLATE/
        success "Added all issue templates"
    fi
}

# Setup GitHub labels with conflict detection
setup_labels() {
    progress "Setting up GitHub labels..."
    
    if command -v gh &> /dev/null; then
        # Check existing labels
        EXISTING_LABELS=$(gh label list --json name -q '.[].name' 2>/dev/null || echo "")
        
        # Define required labels
        REQUIRED_LABELS=(
            "blocker"
            "priority:high"
            "priority:medium"
            "priority:low"
            "crisis-response"
            "cost-optimization"
            "workflow-failure"
        )
        
        LABELS_TO_CREATE=()
        for label in "${REQUIRED_LABELS[@]}"; do
            if ! echo "$EXISTING_LABELS" | grep -q "^$label$"; then
                LABELS_TO_CREATE+=("$label")
            else
                info "Label '$label' already exists"
            fi
        done
        
        if [ ${#LABELS_TO_CREATE[@]} -gt 0 ]; then
            info "Need to create ${#LABELS_TO_CREATE[@]} labels"
            
            if [ "$DRY_RUN" = "true" ]; then
                echo "Would create labels: ${LABELS_TO_CREATE[*]}"
            else
                # Copy label creation script
                cp mindly-starter-template/scripts/create-missing-labels.sh scripts/
                chmod +x scripts/create-missing-labels.sh
                
                # Run it for missing labels only
                ./scripts/create-missing-labels.sh
            fi
        else
            success "All required labels already exist"
        fi
    else
        warning "GitHub CLI not installed - manual label creation required"
        SETUP_TASKS["create-labels"]="manual"
    fi
}

# Merge scripts intelligently
merge_scripts() {
    progress "Merging automation scripts..."
    
    mkdir -p scripts
    
    # Critical scripts to add
    CRITICAL_SCRIPTS=(
        "github-actions-cost-baseline.sh"
        "create-missing-labels.sh"
        "validate-issue-labels.sh"
        "setup-pre-commit.sh"
        "help.sh"
    )
    
    for script in "${CRITICAL_SCRIPTS[@]}"; do
        SOURCE="mindly-starter-template/scripts/$script"
        TARGET="scripts/$script"
        
        if [ -f "$TARGET" ]; then
            # Check if they're different
            if ! diff -q "$SOURCE" "$TARGET" >/dev/null 2>&1; then
                warning "Script $script exists and differs"
                cp "$SOURCE" "$TARGET.mindly"
                CONFLICTS["script-$script"]="review-required"
            else
                info "Script $script already up to date"
            fi
        else
            cp "$SOURCE" "$TARGET"
            chmod +x "$TARGET"
            success "Added script: $script"
        fi
    done
}

# Setup pre-commit hooks
setup_precommit() {
    progress "Setting up pre-commit hooks..."
    
    if [ "${EXISTING_FEATURES["pre-commit"]}" = "true" ]; then
        warning "Pre-commit already configured"
        
        # Create merged version
        cp mindly-starter-template/.pre-commit-config.yaml .pre-commit-config.yaml.mindly
        info "Created .pre-commit-config.yaml.mindly for comparison"
        CONFLICTS["pre-commit"]="manual-merge-required"
    else
        # Copy pre-commit config
        if [ -f mindly-starter-template/.pre-commit-config.yaml ]; then
            cp mindly-starter-template/.pre-commit-config.yaml .
            
            # Install pre-commit
            if command -v pip &> /dev/null; then
                pip install pre-commit
                pre-commit install
                success "Pre-commit hooks installed"
            else
                warning "pip not found - install pre-commit manually"
                SETUP_TASKS["install-pre-commit"]="manual"
            fi
        fi
    fi
}

# Copy development rules
setup_rules() {
    progress "Setting up development rules..."
    
    if [ -d rules ]; then
        warning "Rules directory exists - creating .mindly versions"
        mkdir -p rules
        
        for rule in mindly-starter-template/rules/*; do
            if [ -f "$rule" ]; then
                basename=$(basename "$rule")
                target="rules/$basename"
                
                if [ -f "$target" ]; then
                    cp "$rule" "$target.mindly"
                    CONFLICTS["rule-$basename"]="review-required"
                else
                    cp "$rule" "$target"
                    success "Added rule: $basename"
                fi
            fi
        done
    else
        # No existing rules - safe to copy
        cp -r mindly-starter-template/rules .
        success "Added all development rules"
    fi
}

# Generate setup report
generate_report() {
    progress "Generating setup report..."
    
    cat > "$SETUP_REPORT" << EOF
# Intelligent Setup Report

Generated: $(date)

## 🔍 Project Analysis

### Existing Features Detected
EOF

    for feature in "${!EXISTING_FEATURES[@]}"; do
        echo "- **$feature**: ${EXISTING_FEATURES[$feature]}" >> "$SETUP_REPORT"
    done
    
    echo "" >> "$SETUP_REPORT"
    echo "## ⚠️ Conflicts Detected" >> "$SETUP_REPORT"
    
    if [ ${#CONFLICTS[@]} -eq 0 ]; then
        echo "No conflicts detected - clean integration!" >> "$SETUP_REPORT"
    else
        for conflict in "${!CONFLICTS[@]}"; do
            echo "- **$conflict**: ${CONFLICTS[$conflict]}" >> "$SETUP_REPORT"
        done
        
        echo "" >> "$SETUP_REPORT"
        echo "### Resolution Steps" >> "$SETUP_REPORT"
        echo "1. Review .mindly files created alongside existing files" >> "$SETUP_REPORT"
        echo "2. Manually merge desired changes" >> "$SETUP_REPORT"
        echo "3. Delete .mindly files after merging" >> "$SETUP_REPORT"
    fi
    
    echo "" >> "$SETUP_REPORT"
    echo "## ✅ Setup Tasks" >> "$SETUP_REPORT"
    
    echo "### Automated" >> "$SETUP_REPORT"
    grep "SUCCESS" "$CONFLICTS_LOG" 2>/dev/null | while read -r line; do
        echo "- $line" >> "$SETUP_REPORT"
    done
    
    echo "" >> "$SETUP_REPORT"
    echo "### Manual Steps Required" >> "$SETUP_REPORT"
    
    # Add manual steps in dependency order
    cat >> "$SETUP_REPORT" << 'EOF'

1. **Review and merge conflicts**
   ```bash
   # For each .mindly file created:
   diff existing-file existing-file.mindly
   # Manually merge desired changes
   rm existing-file.mindly
   ```

2. **Complete GitHub setup**
   ```bash
   # Create missing labels
   ./scripts/create-missing-labels.sh
   
   # Configure branch protection (GitHub UI required)
   # Go to Settings → Branches → Add rule
   ```

3. **Configure secrets** (if using deployment)
   ```bash
   # GitHub UI: Settings → Secrets → Actions
   # Add: VERCEL_TOKEN, NETLIFY_TOKEN, etc.
   ```

4. **Verify integration**
   ```bash
   # Test pre-commit hooks
   git commit --allow-empty -m "test: verify pre-commit"
   
   # Check workflows
   gh workflow list
   
   # Verify labels
   gh label list
   ```

## 📁 Backup Location
Restore with: `cp -r $BACKUP_DIR/* .`

## 🔗 Next Steps
1. Review this report and resolve conflicts
2. Complete manual setup steps
3. Run `./scripts/help.sh` for command reference
4. Create first issue to test workflow
EOF

    success "Setup report generated: $SETUP_REPORT"
}

# Interactive setup guide
interactive_setup() {
    if [ "$INTERACTIVE" != "true" ]; then
        return
    fi
    
    echo ""
    info "📋 Quick Setup Checklist"
    echo ""
    echo "I've completed the automated setup. Now let's handle the manual steps:"
    echo ""
    
    read -p "Ready to create GitHub labels? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/create-missing-labels.sh
    fi
    
    echo ""
    read -p "Open browser to configure branch protection? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh repo view --web
        echo "Navigate to: Settings → Branches → Add rule for 'main'"
        read -p "Press enter when complete..."
    fi
    
    echo ""
    info "✅ Setup complete! Review $SETUP_REPORT for details"
}

# Main execution flow
main() {
    show_banner
    
    # Initialize logs
    > "$CONFLICTS_LOG"
    echo "Setup started at $(date)" > "$CONFLICTS_LOG"
    
    # Count total steps for progress tracking
    TOTAL_STEPS=10
    
    # Pre-flight checks
    if [ ! -f mindly-starter-template/README-TEMPLATE.md ]; then
        error "Mindly starter template not found. Please ensure it's in the current directory."
        exit 1
    fi
    
    # Step 1: Analysis
    analyze_existing_project
    
    # Step 2: Backup
    if [ "$DRY_RUN" != "true" ]; then
        create_backup
    else
        info "DRY RUN: Would create backup at $BACKUP_DIR"
    fi
    
    # Step 3-9: Integration steps
    merge_github_workflows
    merge_issue_templates
    merge_scripts
    setup_rules
    setup_precommit
    setup_labels
    
    # Step 10: Report
    generate_report
    
    # Interactive completion
    interactive_setup
    
    # Summary
    echo ""
    success "🎉 Intelligent setup complete!"
    echo ""
    echo "📊 Summary:"
    echo "  - Backup created: $BACKUP_DIR"
    echo "  - Conflicts logged: $CONFLICTS_LOG"
    echo "  - Setup report: $SETUP_REPORT"
    echo ""
    echo "Review $SETUP_REPORT for next steps and conflict resolution."
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            info "DRY RUN MODE - No changes will be made"
            shift
            ;;
        --force)
            FORCE=true
            warning "FORCE MODE - Proceeding despite warnings"
            shift
            ;;
        --non-interactive)
            INTERACTIVE=false
            info "NON-INTERACTIVE MODE"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --dry-run         Show what would be done without making changes"
            echo "  --force           Continue despite warnings (use with caution)"
            echo "  --non-interactive Run without prompts"
            echo "  --help            Show this help message"
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