# Contributing to DLPP Legal Case Management System

Thank you for your interest in contributing to the DLPP Legal Case Management System!

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment (browser, OS, etc.)

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:
- Clear description of the feature
- Use case and benefits
- Any relevant examples or mockups

### Code Contributions

#### Getting Started

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/landcasesystem.git
   cd landcasesystem
   ```

3. **Set up development environment**
   ```bash
   # Install dependencies
   bun install

   # Copy environment file
   cp .env.example .env.local

   # Add your Supabase credentials to .env.local
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

#### Making Changes

1. **Follow the code style**
   - TypeScript with strict type checking
   - Use functional components with hooks
   - Follow existing naming conventions
   - Add comments for complex logic

2. **Test your changes**
   - Test all affected features
   - Check responsive design
   - Verify database operations
   - Test with different user roles

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add description of feature"
   # or
   git commit -m "fix: fix description of bug"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Build process or auxiliary tool changes

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template with:
     - Description of changes
     - Related issue (if any)
     - Testing done
     - Screenshots (if UI changes)

#### Code Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## 🏗️ Project Structure

```
dlpp-legal-cms/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── login/        # Authentication
│   │   ├── dashboard/    # Main dashboard
│   │   ├── cases/        # Case management
│   │   ├── calendar/     # Calendar view
│   │   ├── tasks/        # Task management
│   │   ├── documents/    # Document management
│   │   ├── land-parcels/ # Land/GIS
│   │   └── reports/      # Reports
│   ├── components/
│   │   ├── layout/       # Layout components
│   │   ├── forms/        # Form components
│   │   └── ui/           # shadcn/ui components
│   └── lib/
│       ├── supabase.ts   # Supabase client
│       └── utils.ts      # Utility functions
├── database-schema.sql   # Database schema
└── *.md                  # Documentation
```

## 🎨 Design Guidelines

### Colors (DLPP Branding)
- Purple: `#4A4284` - Navigation, headers
- Red: `#EF5A5A` - Action buttons, alerts
- Gold: `#D4A574` - Accents, highlights
- Gray: Various shades for text and backgrounds

### Components
- Use shadcn/ui components when possible
- Customize components to match DLPP branding
- Ensure responsive design (mobile, tablet, desktop)
- Follow accessibility best practices

### Code Style
- Use TypeScript for type safety
- Functional components with React hooks
- Async/await for asynchronous operations
- Proper error handling
- Loading states for async operations

## 📝 Documentation

When adding features:
- Update relevant documentation files
- Add JSDoc comments to functions
- Update README.md if needed
- Add examples to guides

## 🔐 Security

- Never commit secrets or credentials
- Use environment variables for sensitive data
- Validate all user inputs
- Follow security best practices
- Report security issues privately to maintainers

## ✅ Testing Checklist

Before submitting a PR:
- [ ] Code follows project style
- [ ] Changes work in development
- [ ] Responsive design tested
- [ ] No console errors
- [ ] Database operations tested
- [ ] Documentation updated
- [ ] No sensitive data in code

## 🐛 Common Issues

### Database Schema Changes
If you modify the database schema:
1. Update `database-schema.sql`
2. Document migration steps
3. Test with existing data
4. Update relevant guides

### UI Component Updates
If you modify shadcn/ui components:
1. Maintain DLPP branding
2. Test responsive behavior
3. Check accessibility
4. Update examples if needed

## 💬 Communication

- Use GitHub Issues for bugs and features
- Be respectful and professional
- Provide clear, detailed information
- Respond to feedback promptly

## 📄 License

By contributing, you agree that your contributions will be used under the same license as the project.

---

Thank you for contributing to making legal case management more efficient for DLPP! 🎉
