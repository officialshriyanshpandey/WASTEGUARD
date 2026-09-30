# EcoClean auth testing

Demo accounts are seeded on backend startup:

- Admin: `admin@example.com` / `admin123`
- Worker: `worker@example.com` / `worker123`
- Citizen: `citizen@example.com` / `citizen123`

Authentication uses an httpOnly `access_token` cookie. API smoke:

```bash
curl -c /tmp/ecoclean.cookies -X POST http://localhost:8001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}'
curl -b /tmp/ecoclean.cookies http://localhost:8001/api/auth/me
```

All civic routes are under `/api`, with role checks for citizen, worker and admin actions.