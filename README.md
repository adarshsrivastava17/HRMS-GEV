# GEV HRMS - Root Package
This monorepo contains:
- `/client` - React frontend (Vite)
- `/server` - Node.js backend (Express + Prisma)

## Deployment

### Deploy to Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables:
   - `DATABASE_URL` - Your database connection string
   - `JWT_SECRET` - A secure random string
   - `VITE_API_URL` - Your backend API URL (e.g., https://your-app.vercel.app/api)

### Local Development
```bash
# Server
cd server
npm install
npx prisma db push
npx prisma db seed
npm run dev

# Client (in another terminal)
cd client
npm install
npm run dev
```
