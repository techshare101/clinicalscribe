# 🔒 Branch Protection Rules — ClinicalScribe

## Target branch

`main`

## Rules enabled

✅ Require pull request before merging

✅ Require conversation resolution before merging

✅ Block force pushes

## Merge methods

- **Allowed**: Squash, Rebase
- **Disabled**: Merge commits (to keep history clean)

## Optional (future-ready)

⬜ Require status checks to pass (enable once CI/CD is wired)

⬜ Require approval of most recent push (if multiple collaborators)

⬜ Require signed commits (strict security mode)

## Workflow

1. Work in feature branches (e.g., `mvp-launch`).
2. Open Pull Request → `main`.
3. Resolve all comments (required).
4. Squash or Rebase merge → `main`.

## ⚡ Result:

- `main` = clean, production-safe history.
- `mvp-launch` (or other feature branches) = free to experiment with force pushes, secret scrubs, etc.