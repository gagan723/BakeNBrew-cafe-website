# ☕ Bake & Brew - Cafe Web App

Welcome to **Bake & Brew**, a modern cafe web application where customers can browse the menu, reserve tables, place orders, and enjoy a personalized experience. It also includes a dedicated admin panel for managing menu items.

## Bean: Groq intent routing + MCP assistant

Bean is a globally available cafe chatbot backed by one-call Groq intent classification, deterministic Express workflows, and a standalone Model Context Protocol server. It searches the menu, reads a signed-in user's cart and reservations, checks table availability, and proposes cart, reservation, order, or admin menu changes. Every write waits for explicit confirmation.

```text
React ChatWidget -> Express /api/chat -> Groq intent + entity classification
                              |
                              v
                    Express workflow orchestrator
                              |
                              v
                             MCP  -> cafe services -> MongoDB
```

Groq is called at most once per user message and never executes cafe operations. Express asks for missing details and creates result summaries. MCP is the exclusive boundary for cafe operations. Chat history remains in the browser; incomplete workflows use signed 15-minute browser-held tokens. Confirmation tokens are signed, user-bound, one-time, and expire after five minutes.

### API key and environment

Copy `backend/.env.example` to `backend/.env` and `mcp-server/.env.example` to `mcp-server/.env`. Both need the same `MONGO_URL` and `ACCESS_TOKEN_SECRET`.

Name your Groq API key exactly:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

`GROQ_MODEL` remains configurable if model availability changes. Keep `CHAT_CONFIRMATION_SECRET` separate and random.

### Run locally

From the repository root, use three terminals:

```bash
npm run mcp:http
npm run backend
npm run frontend
```

The MCP URL is `http://127.0.0.1:8001/mcp` and should remain internal. For MCP Inspector, add a valid development JWT as `MCP_ACTOR_TOKEN` in `mcp-server/.env`, then run `npm run mcp:inspect`.

Tools: `search_menu`, `get_cart`, `add_to_cart`, `add_items_to_cart`, `remove_from_cart`, `check_reservation_availability`, `create_reservation`, `list_my_reservations`, `create_order_from_cart`, plus the three admin menu tools. The read-only `cafe://info` resource provides cafe hours, timezone, and reservation duration. Admin tools are not exposed to normal users.

Demo prompts: “Show available cold coffees”, “Add two cappuccinos”, “Find a table tomorrow at 7 PM for four”, “What’s in my cart?”, and “Place my order.”

### Run the complete application with Docker

Install Docker Desktop or Docker Engine with Compose v2, then copy `.env.docker.example` to `.env.docker` and fill in its three required secrets.

```bash
docker compose --env-file .env.docker up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000` (`/health`)
- MCP: `http://127.0.0.1:8001/mcp` (`/health`)
- MongoDB: `mongodb://127.0.0.1:27017/bakenbrew`

MongoDB data persists in the `mongo_data` volume. To use Atlas, set `MONGO_URL` in `.env.docker`; Express and MCP receive the same URI. MCP is exposed only to localhost and the private Compose network.

```bash
npm run docker:logs
npm run docker:down
docker compose --env-file .env.docker down -v # also removes local MongoDB data
```

---
## Deployed link
 - https://bakenbrew-cafe-website-frontend.onrender.com

## 🔥 Features

### 👥 Users
- Popup-based Login / Signup with jwt authentication
- Browse menu with food images
- Add/remove items from cart
- View order summary with subtotal + delivery
- Place orders with success notification
- Reserve tables easily

### 🛠️ Admin
- Admin-only dashboard layout
- Add new items with image upload (Cloudinary)
- Delete/manage items
- Role-based conditional rendering

---

## 🧰 Tech Stack

| Frontend         | Backend         | Other Tools            |
|------------------|------------------|-------------------------|
| React.js         | Node.js + Express | MongoDB (Mongoose)     |
| React Router     | Multer (file upload) | Cloudinary (image hosting) |
| Tailwind CSS     | JWT Auth         | React Hot Toast        |


---

## 🧪 Setup Instructions

### 1. Clone the Repository
 ```bash
  git clone https://github.com/gagan723/BakeNBrew-cafe-website.git

```
### 2. Install Dependencies on both frontend and backend

 ```bash
  npm install

```
### 3. Create .env file in backend and add

 ```bash
  MONGO_URI=your_mongodb_connection_string
  ACCESS_TOKEN_SECRET=your_jwt_secret
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret

```
### 4. Then run backend and frontend server

 ```bash
  cd backend
  npm start
  cd frontend
  npm start

