# Claude Instructions for Gymothy Development

## Version Management

When making changes to the Gymothy app, follow these version numbering rules:

- **Major version**: Always keep at 0
- **Minor version**: Increment this number for new features, improvements, or significant changes
- **Patch version**: Always keep at 0

### Version Format
Use the format: `v0.X.0` where X is the minor version number.

### Examples
- Current version: v0.5.8
- After adding a new feature: v0.6.0
- After fixing bugs: v0.6.0 (not v0.5.9)
- After UI improvements: v0.7.0

### Files to Update
When updating the version, modify these files:
1. `frontend/main.js` - Update the `VERSION` constant
2. `frontend/index.html` - Update the version in the footer

### Commit Message Format
Use commit messages like:
- "Add new feature - v0.6.0"
- "Fix UI issues - v0.6.0"
- "Improve performance - v0.7.0"

## Development Guidelines

1. Always test changes locally before committing
2. Update version numbers for any functional changes
3. Keep the patch version at 0 for all changes
4. Document significant changes in commit messages 