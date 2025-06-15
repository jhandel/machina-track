# Contributing to MachinaTrack

Thank you for your interest in contributing to MachinaTrack! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/yourusername/machina-track.git
   cd machina-track
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up your environment variables (see `.env.example`)
5. Run the development server:
   ```bash
   npm run dev
   ```

## 🔧 Development Guidelines

### Code Style

- We use TypeScript for type safety
- Follow the existing code formatting (Prettier configuration)
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Follow React best practices and hooks patterns

### Database Changes

- All database changes must go through Prisma migrations
- Test your schema changes thoroughly
- Update the repository interfaces if needed
- Ensure backward compatibility when possible

### Component Development

- Use the existing UI component library (`src/components/ui/`)
- Follow the established design system (colors, spacing, typography)
- Make components reusable and well-documented
- Include proper TypeScript props interfaces

## 📝 Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the guidelines above

3. **Test your changes**:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

4. **Commit your changes** with a clear message:
   ```bash
   git commit -m "feat: add new equipment tracking feature"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** with:
   - Clear title and description
   - Screenshots (if UI changes)
   - Testing instructions
   - Link to any related issues

## 🐛 Bug Reports

When reporting bugs, please include:

- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser/environment information

## 💡 Feature Requests

For feature requests:

- Check if a similar feature already exists
- Explain the use case and benefit
- Provide mockups or examples if helpful
- Consider the impact on existing functionality

## 🧪 Testing

- Write tests for new functionality
- Ensure existing tests still pass
- Test on different browsers when applicable
- Test database operations thoroughly

## 📖 Documentation

- Update the README if needed
- Add JSDoc comments for new functions
- Update API documentation for new endpoints
- Include inline comments for complex logic

## 🏷️ Commit Message Guidelines

We follow conventional commit format:

- `feat`: New features
- `fix`: Bug fixes  
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat: add equipment maintenance scheduling
fix: resolve inventory count calculation bug
docs: update API documentation for metrology tools
```

## 🎯 Areas for Contribution

We especially welcome contributions in:

- **AI/ML Features**: Enhancing predictive analytics
- **Mobile Responsiveness**: Improving mobile experience
- **Data Visualization**: Enhanced charts and reporting
- **Performance**: Database query optimization
- **Testing**: Expanding test coverage
- **Documentation**: Code comments and user guides
- **Accessibility**: Making the app more accessible

## ❓ Questions?

If you have questions about contributing:

- Check existing [Issues](https://github.com/yourusername/machina-track/issues)
- Create a new issue with the "question" label
- Join our [Slack channel](https://machinatrack.slack.com)

## 📄 Code of Conduct

Please note that this project adheres to a Code of Conduct. By participating, you are expected to uphold professional and respectful communication.

Thank you for contributing to MachinaTrack! 🚀
