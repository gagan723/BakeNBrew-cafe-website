# ☕ Bake & Brew — MCP-Powered AI Agent & Full-Stack Web Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-Render-brightgreen?style=for-the-badge&logo=render)](https://bakenbrew-cafe-website-frontend.onrender.com)
[![Groq LLM](https://img.shields.io/badge/LLM-Groq_Llama_3.1-orange?style=for-the-badge&logo=groq)](https://groq.com)
[![Model Context Protocol](https://img.shields.io/badge/Protocol-MCP-blue?style=for-the-badge)](https://modelcontextprotocol.io)

> A modern full-stack cafe web application featuring online menu browsing, ordering, table reservations, an admin dashboard, and **Bean**—an intelligent AI assistant powered by **Groq LLM (Llama 3.1)** for high-speed intent routing and an isolated **Model Context Protocol (MCP)** server for secure state management.

📍 **Live Deployed Application:** [https://bakenbrew-cafe-website-frontend.onrender.com](https://bakenbrew-cafe-website-frontend.onrender.com)

---

## 🔗 Quick Links

- 🌐 **Live Application:** [https://bakenbrew-cafe-website-frontend.onrender.com](https://bakenbrew-cafe-website-frontend.onrender.com)
- 🤖 [Bean AI Assistant, Groq LLM & MCP Architecture](#-bean-ai-assistant-groq-llm--mcp-architecture)
- 🐳 [Docker Startup Instructions](#-docker-startup-instructions)
- 🔥 [Key Features](#-key-features)
- 🧰 [Tech Stack](#-tech-stack)
- 🧪 [Local Development Setup](#-local-development-setup)

---

## 🤖 Bean AI Assistant, Groq LLM & MCP Architecture

**Bean** is an embedded, context-aware cafe concierge that enables users to interact with the cafe using natural language—from searching menu items and managing carts to checking table availability, booking reservations, and placing orders.

```text
                               ┌─────────────────────────────────────────┐
                               │           React Chat Widget             │
                               └────────────────────┬────────────────────┘
                                                    │ User Input
                                                    v
                               ┌─────────────────────────────────────────┐
                               │      Express Backend Orchestrator       │
                               └──────────┬───────────────────▲──────────┘
             1-Call High-Speed            │                   │ Fast Intent
             Intent Parsing               v                   │ & Entities
                               ┌──────────────────────┐       │
                               │   Groq API Service   │───────┘
                               │ (Llama-3.1-8b-instant)│
                               └──────────────────────┘
                                          │
                        Validated Workflow│& Action Intent
                                          v
                               ┌─────────────────────────────────────────┐
                               │    Model Context Protocol (MCP) Server  │
                               │      (Isolated Execution Boundary)      │
                               └────────────────────┬────────────────────┘
                                                    │ Internal HTTP Calls
                                                    v
                               ┌─────────────────────────────────────────┐
                               │         MongoDB / Cafe Services         │
                               └─────────────────────────────────────────┘
```

### ⚡ 1. Ultra-Fast Intent Classification with Groq LLM API
- **Powered by Groq Inference Engine:** Uses `llama-3.1-8b-instant` for sub-second natural language processing and intent extraction.
- **Single-Call Efficiency:** Groq is invoked **at most once per user message** to extract intentions and entities (quantities, item names, reservation dates/times, guest counts) without accumulating LLM latency.
- **Zero Direct Side-Effects:** The LLM acts purely as an intent parser and entity extractor. It never directly mutates the database or executes actions, eliminating hallucination risks in database operations.

### 🛡️ 2. Standalone Model Context Protocol (MCP) Server
- **Isolated Operations Boundary:** All domain logic (menu searches, cart manipulation, reservations, order creation, and admin items) is encapsulated within a standalone MCP server running at `http://127.0.0.1:8001/mcp`.
- **Standardized MCP Tools:**
  - `search_menu`: Query cafe items by category, keyword, or dietary preference.
  - `get_cart` & `add_to_cart` / `add_items_to_cart` / `remove_from_cart`: Full cart lifecycle management.
  - `check_reservation_availability` & `create_reservation`: Real-time table checking and booking.
  - `create_order_from_cart`: Converts active cart items into confirmed cafe orders.
  - `list_my_reservations`: Retrieve active and past user reservations.
  - **Admin Tools:** `admin_create_item`, `admin_update_item`, `admin_delete_item` for back-office management.
- **MCP Resource Read-Only Endpoint:** Exposes `cafe://info` for real-time metadata (business hours, timezone, reservation policy).

### 🔒 3. Two-Phase Action Confirmation & Security
- **Human-in-the-Loop Safeguard:** Any state-changing action (modifying cart, placing order, booking table, or admin operations) requires explicit user confirmation in the chat interface.
- **Cryptographic Confirmation Tokens:**
  - Confirmation tokens are signed using `CHAT_CONFIRMATION_SECRET`.
  - Tokens are strictly **user-bound**, **single-use (one-time)**, and expire automatically after **5 minutes**.
- **Client-Side History Privacy:** Chat history remains stored locally in the browser. Incomplete multi-turn conversations use 15-minute signed browser-held tokens.

### 💡 Demo Prompts to Try in Chat:
- 🍰 *"Show available Pastries"*
- 🛒 *"Add two cappuccinos to my cart"*
- 📅 *"Find a table tomorrow at 7 PM for 4 people"*
- 📋 *"What's currently in my cart?"*
- 💳 *"Place my order"*

---

## 🐳 Docker Startup Instructions

Run the entire application stack (Frontend, Backend, MCP Server, and MongoDB) seamlessly using Docker Compose.

### 1. Configure Environment Variables
Copy `.env.docker.example` to `.env.docker` (or `.env`) and fill in the required keys:

```bash
cp .env.docker.example .env.docker
```

*Required keys in `.env.docker`:*
- `ACCESS_TOKEN_SECRET`: Long random secret string for JWT authentication.
- `CHAT_CONFIRMATION_SECRET`: Random secret string for chat confirmation tokens.
- `GROQ_API_KEY`: Your Groq API key.

### 2. Build and Start Containers
Run the following command to build images and launch all services:

```bash
docker compose up --build
```

> **Note:** If environment variables are kept in `.env.docker`, run:
> ```bash
> docker compose --env-file .env.docker up --build
> ```
> Or use npm script: `npm run docker:up`

#### Services & Exposed Ports:
- 🌐 **Frontend App:** `http://localhost:5173`
- ⚙️ **Backend API:** `http://localhost:8000` (Healthcheck: `/health`)
- 🤖 **MCP Server:** `http://127.0.0.1:8001/mcp` (Healthcheck: `/health`)
- 🗄️ **MongoDB (Local):** `mongodb://127.0.0.1:27017/bakenbrew`

#### 🍃 Database Option (Local vs. MongoDB Atlas):
- **Bundled Container (Default):** Docker automatically runs a local MongoDB container; data persists in the `mongo_data` volume.
- **MongoDB Atlas (Cloud):** You can use a cloud-hosted **MongoDB Atlas** cluster instead of the local container. Simply set `MONGO_URL` in `.env.docker`:
  ```env
  MONGO_URL=mongodb+srv://<username>:<password>@cluster.example.mongodb.net/bakenbrew
  ```
  Both the Express backend and MCP server will automatically route their operations to your Atlas cluster.

### 3. Stop Containers
To stop and remove all running containers:

```bash
docker compose down
```

> **Note:** If using `.env.docker`, run `docker compose --env-file .env.docker down` (or `npm run docker:down`).
> To also clean up local MongoDB persistent data volumes:
> ```bash
> docker compose down -v
> ```

---

## 🔥 Key Features

### 👥 Customer Experience
- **Authentication:** Popup-based Login / Signup secured with JWT authentication.
- **Menu Browsing:** Browse categorized cafe menu items with dynamic images.
- **Cart & Orders:** Add/remove items, view subtotal + delivery charges, and place orders with real-time notifications.
- **Table Reservation:** Easy reservation system for reserving cafe tables.
- **AI Assistant (Bean):** Natural language assistance for cart updates, menu searches, table bookings, and order placement.

### 🛠️ Admin Management
- **Dashboard:** Dedicated admin layout with role-based access control.
- **Menu Control:** Add new cafe items with Cloudinary image upload, update, or delete existing items.
- **MCP Admin Tools:** Admin-only tools integrated into the MCP server boundary.

---

## 🧰 Tech Stack

| Domain | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React.js, React Router, Vite, Tailwind CSS, React Hot Toast |
| **Backend** | Node.js, Express.js, JWT Authentication, Multer |
| **Database & Storage** | MongoDB (Mongoose), Cloudinary (Image Hosting) |
| **AI & MCP** | Groq SDK (`llama-3.1-8b-instant`), Model Context Protocol (MCP) HTTP Server |
| **DevOps & Containers** | Docker, Docker Compose |

---

## 🧪 Local Development Setup

If you prefer to run the application locally without Docker, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/gagan723/BakeNBrew-cafe-website.git
cd BakeNBrew-cafe-website
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy sample environment files:
- `backend/.env.example` -> `backend/.env`
- `mcp-server/.env.example` -> `mcp-server/.env`

**Backend `.env` example:**
```env
# Use local MongoDB URI or a cloud MongoDB Atlas connection string:
# Local: mongodb://127.0.0.1:27017/bakenbrew
# Atlas: mongodb+srv://<username>:<password>@cluster.example.mongodb.net/bakenbrew
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_secret
CHAT_CONFIRMATION_SECRET=your_chat_confirmation_secret
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note on MongoDB:** You can use either a local MongoDB server or **MongoDB Atlas**. Ensure that both `backend/.env` (`MONGO_URI`) and `mcp-server/.env` (`MONGO_URL`) point to the same database.

### 4. Run Locally
Open three separate terminals from the repository root:

```bash
# Terminal 1: MCP Server
npm run mcp:http

# Terminal 2: Backend API
npm run backend

# Terminal 3: Frontend App
npm run frontend
```

The internal MCP server URL will run at `http://127.0.0.1:8001/mcp`.
