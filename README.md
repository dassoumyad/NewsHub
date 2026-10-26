# NewsHub

A full-stack editorial news platform with a public news feed, article pages, saved stories, user authentication, an admin newsroom, and a subscription-only long-read library.

## Stack

- Frontend: React, Vite, React Router, Axios, and Lucide icons
- Backend: Node.js, Express, Mongoose, and MongoDB
- Authentication: bcrypt password hashing and JWT-protected API routes
- Payments: Razorpay Standard Checkout with server-side signature verification
- Email: SMTP configuration for OTP and subscription confirmation messages

## Features

- Browse and filter public news stories
- Register and sign in with email verification
- Save stories in a personal reading list
- Publish and manage stories and categories in the admin newsroom
- Upload story cover images
- Purchase an annual membership and read premium features
- Seed the included premium feature library into MongoDB

## Run locally

### 1. Start MongoDB

Set `MONGO_URI` in `backend/.env` to a MongoDB instance that your backend can reach.

### 2. Configure and start the backend

Copy `backend/.env.example` to `backend/.env`, then configure the database, JWT, Razorpay test keys, and SMTP values as needed.

```powershell
cd backend
npm install
npm run seed:premium
node index.js
```

To create the initial admin, configure the `ADMIN_*` values in `backend/.env` and run `npm run seed:admin` once.

### 3. Configure and start the frontend

Copy `frontend/.env.example` to `frontend/.env`. Set `VITE_API_URL` to the backend URL; locally it defaults to `http://localhost:5000`.

```powershell
cd frontend
npm install
npm run dev
```

## Demo notes

- Use Razorpay test credentials for a demo. The frontend and backend must use keys from the same Razorpay mode.
- SMTP credentials are required for OTP and purchase confirmation emails. Email delivery is best-effort and does not undo a verified subscription.
- Uploaded cover images are stored in `backend/statics/uploads`; preserve that directory or move uploads to persistent object storage when hosting the app.
- Keep `.env` files and real credentials out of version control. Only the `.env.example` files belong in the repository.
