# Migrations Directory

## ⚠️ Security Notice

**Migrations are NOT committed to the repository for security reasons:**

- Expose database schema and structure
- May contain sensitive business logic
- Can reveal security vulnerabilities
- Contain RLS policies and access patterns

## 📋 Setup Instructions

1. Migrations are managed locally and deployed directly to Supabase
2. Use Supabase CLI to generate and apply migrations
3. Never commit `.sql` files to version control
4. Keep migrations in a secure, separate location

## 🔒 Best Practices

- Store migrations in encrypted storage
- Use environment-specific migrations
- Document schema changes in CHANGELOG.md
- Review all migrations before deployment
