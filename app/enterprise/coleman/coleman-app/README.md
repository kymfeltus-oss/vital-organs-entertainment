# COLEMAN Full Stack Layout

```text
coleman-app/
├── server/               # Node.js TypeScript production backend (Express + Prisma)
│   ├── .env              # Secrets (DATABASE_URL, PORT) — copy from .env.example
│   ├── package.json
│   └── src/
│       ├── server.ts     # Express server & API endpoints
│       ├── storage.ts    # Disk asset management (uploaded_assets/)
│       ├── validation.ts # Request validation
│       └── db/
│           ├── prisma.ts # Prisma client (PostgreSQL / Supabase)
│           └── mappers.ts
└── client/               # React Native Expo frontend
    ├── package.json
    ├── App.tsx           # Main application state & interface
    ├── api/
    │   └── coleman-api.ts
    └── config/
        ├── environment.ts
        └── environment.shared.ts
```

## Run order

1. **Monorepo root** — generate Prisma client & migrate:
   ```bash
   cd ../../../..   # parable-faith root
   npx prisma generate
   npm run db:migrate:coleman
   npm run db:seed
   ```

2. **Backend** (standalone on port 5001):
   ```bash
   cd server
   cp .env.example .env   # fill DATABASE_URL
   npm install
   npm run build
   npm start
   ```

3. **Next.js web** (integrated API on port 3000):
   ```bash
   cd ../../../..   # parable-faith root
   npm run dev
   ```

4. **Expo client**:
   ```bash
   cd client
   npm install
   npm start
   ```

Set `EXPO_PUBLIC_COLEMAN_STANDALONE=true` to point the client at `localhost:5001` instead of Next.js.
