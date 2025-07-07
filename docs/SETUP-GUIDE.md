# 📋 Complete Project Setup Guide

This guide covers everything the automated setup script cannot handle, requiring manual steps or GitHub permissions.

## 🏷️ GitHub Labels Setup

**CRITICAL**: GitHub Issues workflow requires proper labels. The automated script cannot create labels without repository permissions.

### Option 1: Automated Label Creation (Recommended)
```bash
# After pushing your repository to GitHub
./scripts/create-missing-labels.sh

# This creates all required labels:
# - Priority labels (blocker, priority:high, priority:medium, priority:low)
# - Type labels (bug, feature, enhancement, documentation)
# - Status labels (ready, in-progress, blocked, needs-review)
# - Special labels (crisis-response, cost-optimization, workflow-failure)
```

### Option 2: Manual Label Creation
If the script fails due to permissions, create these labels manually in GitHub:

1. Go to `Settings → Labels` in your repository
2. Create each label with these exact names and suggested colors:

**Priority Labels** (Red spectrum):
- `blocker` - #D73A4A
- `priority:high` - #FF6B6B
- `priority:medium` - #FFA500
- `priority:low` - #FFD93D

**Type Labels** (Blue spectrum):
- `bug` - #d73a4a
- `feature` - #0052CC
- `enhancement` - #5319E7
- `documentation` - #0075ca

**Status Labels** (Green spectrum):
- `ready` - #0E8A16
- `in-progress` - #FBCA04
- `blocked` - #E99695
- `needs-review` - #D4C5F9

**Special Labels** (Various):
- `crisis-response` - #B60205
- `cost-optimization` - #84b6eb
- `workflow-failure` - #e11d21

## 🔐 Repository Settings

### Branch Protection Rules
**CRITICAL**: Protect your main branch to enforce quality gates.

1. Go to `Settings → Branches`
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Dismiss stale pull request approvals
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators (optional but recommended)

### Required Status Checks
Select these workflows as required:
- `ci-cd / build`
- `security / security-scan`
- `pr-quality / quality-check`

## 🔑 Secrets Configuration

### GitHub Actions Secrets
Go to `Settings → Secrets and variables → Actions` and add:

**For Deployment** (if using):
- `VERCEL_TOKEN` - From vercel.com/account/tokens
- `NETLIFY_TOKEN` - From app.netlify.com/user/applications
- `HEROKU_API_KEY` - From dashboard.heroku.com/account

**For Enhanced Features** (optional):
- `SENTRY_DSN` - Error tracking from sentry.io
- `CODECOV_TOKEN` - Coverage from codecov.io

## 📊 GitHub Projects Setup

### Create Project Board
1. Go to `Projects` tab → New project
2. Select "Board" template
3. Configure columns:
   - **Backlog** - New issues land here
   - **Ready** - Prioritized for work
   - **In Progress** - Active development
   - **In Review** - PR submitted
   - **Done** - Completed work

### Automation Rules
Configure these automations:
- Auto-add new issues to Backlog
- Move to In Progress when assigned
- Move to In Review when PR created
- Move to Done when issue closed

## 🤖 GitHub Apps & Integrations

### Recommended Integrations
1. **Codecov** - Code coverage tracking
2. **Dependabot** - Security updates (already in GitHub)
3. **GitGuardian** - Secret scanning
4. **SonarCloud** - Code quality analysis

### Dependabot Configuration
Already included in the template, but verify it's enabled:
- Go to `Settings → Security & analysis`
- Enable Dependabot alerts
- Enable Dependabot security updates

## 💰 Cost Monitoring Setup

### GitHub Actions Usage
1. Go to `Settings → Actions → General`
2. Set spending limit (recommended: $50/month)
3. Configure email alerts for usage

### Baseline Monitoring
```bash
# Run weekly to track costs
./scripts/github-actions-cost-baseline.sh

# Review the generated report
cat .github/actions-baseline-summary.md
```

## 🚨 Manual Verification Checklist

After automated setup, verify:

- [ ] All labels created correctly
- [ ] Branch protection configured
- [ ] Required secrets added
- [ ] Project board created
- [ ] Cost limits configured
- [ ] Pre-commit hooks working (`git commit` shows hooks running)
- [ ] CI/CD workflows visible in Actions tab
- [ ] Issue templates appear when creating new issue

## 📝 First Issues to Create

Once setup is complete, create these issues to start your workflow:

### Issue 1: Project Setup Completion
```
Title: Complete project setup and configuration
Labels: enhancement, priority:high
Description: 
- [ ] Verify all GitHub settings
- [ ] Test CI/CD pipeline
- [ ] Configure deployment
- [ ] Document any project-specific setup
```

### Issue 2: README Customization
```
Title: Customize README for project specifics
Labels: documentation, priority:medium
Description:
- [ ] Update project description
- [ ] Add project-specific setup steps
- [ ] Document environment variables
- [ ] Add badges for CI/CD status
```

## 🆘 Troubleshooting

### Common Issues

**"Label not found" errors**
- Run `./scripts/create-missing-labels.sh`
- Check GitHub token permissions

**CI/CD workflows not running**
- Check if workflows are disabled in Actions tab
- Verify branch names match workflow triggers

**Pre-commit hooks not working**
- Run `./scripts/setup-pre-commit.sh` again
- Ensure Python and pip are installed

**Cost alerts not working**
- Verify spending limit is set in GitHub
- Check email settings for notifications

## 📚 Additional Resources

- **CRITICAL_CORE Rules**: `rules/CRITICAL_CORE.mdc` - Development principles
- **GitHub CLI Docs**: https://cli.github.com - For automation
- **GitHub Actions Docs**: https://docs.github.com/actions - For CI/CD
- **Issue #261**: Original ULTRATHINK research and strategy

---

**Remember**: The automated setup handles 80% of configuration. This guide covers the remaining 20% that requires manual intervention or special permissions. Following these steps ensures your project matches the professional standards of the original repository.