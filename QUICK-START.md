# 🚀 Lightning-Fast Setup for Existing Projects

## One-Command Setup (Recommended)

From your existing project directory, run:

```bash
# Clone the template, run intelligent setup, and clean up
git clone --depth 1 https://github.com/seanacres/mindly-starter-template.git .mindly-setup && \
.mindly-setup/scripts/intelligent-setup.sh && \
rm -rf .mindly-setup
```

This will:
1. ✅ Analyze your existing project
2. ✅ Create backups of existing configs
3. ✅ Intelligently merge workflows
4. ✅ Set up GitHub labels and hooks
5. ✅ Generate a custom setup report
6. ✅ Guide you through manual steps

## Alternative: Manual Control

If you prefer more control:

```bash
# 1. Clone the template
git clone https://github.com/seanacres/mindly-starter-template.git

# 2. Run intelligent setup with options
mindly-starter-template/scripts/intelligent-setup.sh --dry-run  # Preview changes
mindly-starter-template/scripts/intelligent-setup.sh             # Run setup

# 3. Clean up
rm -rf mindly-starter-template
```

## What Gets Added?

### ✅ Automated (Safe)
- GitHub workflows (with conflict detection)
- Issue and PR templates
- Development scripts
- Pre-commit hooks
- CRITICAL_CORE rules

### 📋 Manual Steps (Guided)
- GitHub labels creation
- Branch protection rules
- Repository secrets
- Cost monitoring limits

## Conflict Resolution

The intelligent setup:
- **Never overwrites** existing files without permission
- **Creates `.mindly` versions** when conflicts detected
- **Provides diffs** for easy comparison
- **Backs up everything** before changes

Example:
```
.github/workflows/ci-cd.yml         # Your existing workflow
.github/workflows/ci-cd.yml.mindly  # Template version for comparison
```

## Safety Features

### 🛡️ Pre-flight Checks
- Detects uncommitted changes
- Analyzes existing CI/CD
- Identifies potential conflicts
- Creates timestamped backups

### 🔄 Rollback
```bash
# If anything goes wrong:
cp -r .mindly-backup-[timestamp]/* .
```

### 📊 Detailed Report
After setup, check `setup-report.md` for:
- What was detected
- What was changed
- What needs manual action
- Exact commands to run

## Common Scenarios

### Scenario 1: Fresh Project
```bash
# Everything installs cleanly
✅ Added 15 files
✅ Created 12 labels  
✅ Configured pre-commit
📋 Manual: Set branch protection
```

### Scenario 2: Existing CI/CD
```bash
# Intelligent conflict handling
⚠️ Found existing workflows
📁 Created .mindly versions for review
📋 Manual: Merge desired features
✅ Added non-conflicting components
```

### Scenario 3: Complex Project
```bash
# Careful integration
⚠️ Detected CircleCI (not GitHub Actions)
⚠️ Found custom label scheme
📁 Created compatibility report
📋 Manual: Guided migration path
```

## Post-Setup Commands

```bash
# Verify everything works
./scripts/help.sh                    # See all available commands
gh label list                        # Check labels
gh workflow list                     # Check workflows
git commit --allow-empty -m "test"   # Test pre-commit hooks

# Start using the workflow
gh issue create --title "feat: My first feature" --label "feature"
```

## FAQ

**Q: Will this break my existing CI/CD?**
A: No. Conflicts create `.mindly` files for manual review, never overwrite.

**Q: What if I don't use GitHub Actions?**
A: The script detects CircleCI/Travis/etc and provides migration guidance.

**Q: Can I preview changes first?**
A: Yes! Use `--dry-run` to see what would happen.

**Q: What if something goes wrong?**
A: Full backup is created. Restore with one command.

## Get Started Now!

```bash
# Run from your project directory:
curl -sL https://raw.githubusercontent.com/seanacres/mindly-starter-template/main/scripts/intelligent-setup.sh | bash
```

*Note: Always review scripts before running. The above is for convenience after you trust the source.*

---

**Transform your project with professional workflows in under 5 minutes!** 🚀