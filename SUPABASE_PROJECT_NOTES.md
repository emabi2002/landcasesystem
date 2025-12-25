# Supabase project reference

This repository is configured to use the Supabase project `yvnkyjnwvylrweyzvibs`:
- The quick-start setup directs users to open that specific project when preparing the database.【F:README.md†L130-L135】
- Deployment instructions hard-code the Supabase URL `https://yvnkyjnwvylrweyzvibs.supabase.co` for environment variables.【F:DEPLOYMENT_INSTRUCTIONS.md†L310-L314】
- Infrastructure design notes reference the same project host (`db.yvnkyjnwvylrweyzvibs.supabase.co`) in connection details.【F:CLOUD_INFRASTRUCTURE_DESIGN.md†L330-L334】

Therefore, any other repository configured with the same `NEXT_PUBLIC_SUPABASE_URL` (or matching database host) would point to this identical Supabase project, even if it uses a different schema.
