## Fresh Farm Produce Marketplace

Full-stack implementation of the Fresh Farm Produce platform. Farmers publish produce, buyers shop, chat, and place delivery/pickup orders, while admins monitor users and transactions. The stack combines Spring Boot 3 + Spring Security + PostgreSQL/Hibernate on the backend with a Vite + React SPA frontend.

### Architecture
- **Backend**: `src/main/java` – layered architecture (controllers → services → repositories). JWT-secured REST API, PostgreSQL persistence, DTO-based payloads, and validation.
- **Frontend**: `frontend/` – Vite React app with React Query for data fetching, Axios client, routing, and contextual auth state.
- **Docs**: `docs/diagrams.md` – use case, activity, and class diagrams derived from the SDLC analysis.

### Backend Setup
1. Install Java 17+ and PostgreSQL.
2. Create database `FRESHFARM` and update credentials in `src/main/resources/application.properties` if needed (default user `postgres`, password `123456`).
3. Run locally:
   ```bash
   ./mvnw spring-boot:run
   ```
4. Key endpoints (all prefixed with `/api`):
   - `POST /auth/register/{farmer|buyer|admin}`
   - `POST /auth/login`
- `GET /products`, `POST /products` (farmer – accepts `multipart/form-data` with `product` JSON part + optional `image` file; include `status` = `IN_STOCK|OUT_OF_STOCK|SOLD`)
   - `GET/POST/PATCH /cart`
   - `POST /orders`, `GET /orders/me`, `GET /orders/farmer`, `PATCH /orders/{id}/status`
   - `POST /messages`, `GET /messages`, `PATCH /messages/{id}/read`
   - `POST /reviews`, `GET /reviews/product/{id}`

- **Product images & statuses**: Files uploaded via `/api/products` are stored under `uploads/` (configurable via `app.file-storage-location`) and served via `/uploads/{filename}`. Products track a `status` (`IN_STOCK`, `OUT_OF_STOCK`, `SOLD`) that farmers can update from the dashboard; buyers can filter or view availability in the marketplace.

### Frontend Setup
1. Install Node.js 18+ (npm required).
2. From `frontend/` run:
   ```bash
   npm install
   npm run dev
   ```
3. The Vite dev server proxies API calls to `http://localhost:8080`. Update `vite.config.js` if the backend URL changes.

### Security & Authentication
- Passwords encrypted with BCrypt.
- JWT issued on login/registration; attach `Authorization: Bearer <token>` header.
- CORS allows `http://localhost:5173`.
- Role-based access: only farmers manage products, buyers manage carts/orders, admins can update any order.

### Testing Ideas
- Register a farmer and buyer, publish a product, add it to a buyer cart, place an order, update status as farmer.
- Exchange messages between farmer and buyer.
- Submit and moderate reviews.

For visual models (use case, activity, class diagrams) see `docs/diagrams.md`. SDLC phase descriptions are embedded in the user prompt and guide the implementation choices above.

