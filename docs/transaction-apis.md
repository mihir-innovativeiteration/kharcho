# Kharcho Transaction & Finance API Reference

All endpoints are versioned under `/api/v1` and require an HTTP Authorization header: `Bearer <access_token>`. The authenticated user's ID is derived strictly from the verified JWT on the server.

---

## 1. Transaction Endpoints

### 1. Create Transaction
- **Method**: `POST`
- **Path**: `/api/v1/transactions`
- **Request Body**:
  ```json
  {
    "type": "EXPENSE",
    "amount": "450.50",
    "currency": "INR",
    "description": "Weekly groceries",
    "categoryId": "cat_groceries",
    "paymentMethodId": "pm_upi",
    "transactionDate": "2026-10-27T10:30:00.000Z",
    "notes": "Purchased on Blinkit"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "id": "c138f51a-...",
      "userId": "user-uuid",
      "type": "EXPENSE",
      "amount": "450.50",
      "currency": "INR",
      "description": "Weekly groceries",
      "categoryId": "cat_groceries",
      "category": {
        "id": "cat_groceries",
        "name": "Groceries",
        "type": "EXPENSE",
        "icon": "ShoppingBag",
        "color": "#10B981",
        "isSystem": true
      },
      "paymentMethodId": "pm_upi",
      "paymentMethod": {
        "id": "pm_upi",
        "name": "UPI",
        "type": "UPI",
        "details": "Instant UPI transfer",
        "isSystem": true
      },
      "transactionDate": "2026-10-27T10:30:00.000Z",
      "notes": "Purchased on Blinkit",
      "createdAt": "2026-10-27T10:30:00.000Z",
      "updatedAt": "2026-10-27T10:30:00.000Z"
    }
  }
  ```

### 2. List Transactions (Pagination, Filters, Search)
- **Method**: `GET`
- **Path**: `/api/v1/transactions`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
  - `type`: `INCOME` | `EXPENSE`
  - `categoryId`: Filter by category ID
  - `paymentMethodId`: Filter by payment method ID
  - `startDate`: ISO 8601 date string
  - `endDate`: ISO 8601 date string
  - `search`: Substring search in `description` or `notes`
  - `sortBy`: `transactionDate` (default) | `createdAt` | `amount`
  - `sortOrder`: `desc` (default) | `asc`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
  ```

### 3. Get Transaction by ID
- **Method**: `GET`
- **Path**: `/api/v1/transactions/:id`
- **Response**: `200 OK` or `404 Not Found` (anti-enumeration across users).

### 4. Update Transaction
- **Method**: `PATCH`
- **Path**: `/api/v1/transactions/:id`
- **Request Body**: Partial transaction payload (amount, description, categoryId, etc.).

### 5. Delete Transaction
- **Method**: `DELETE`
- **Path**: `/api/v1/transactions/:id`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": { "id": "transaction-id" }
  }
  ```

---

## 2. Category Endpoints

- `GET /api/v1/categories`: Lists all system categories + user's custom categories.
- `POST /api/v1/categories`: Creates a custom category (`name`, `type`, `icon`, `color`).
- `PATCH /api/v1/categories/:id`: Updates a user's custom category (system categories return `403 Forbidden`).
- `DELETE /api/v1/categories/:id`: Deletes a custom category (rejects if referenced by existing transactions with `400 Bad Request`).

---

## 3. Payment Method Endpoints

- `GET /api/v1/payment-methods`: Lists all system payment methods + user's custom payment methods.
- `POST /api/v1/payment-methods`: Creates a custom payment method (`name`, `type`, `details`).
- `PATCH /api/v1/payment-methods/:id`: Updates a custom payment method.
- `DELETE /api/v1/payment-methods/:id`: Deletes a custom payment method (historical transactions retain records with `paymentMethodId: null`).

---

## 4. Financial Reporting Endpoints

### 1. Summary
- **Method**: `GET`
- **Path**: `/api/v1/finance/summary?startDate=...&endDate=...&currency=INR`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "totalIncome": "100000.00",
      "totalExpenses": "25501.00",
      "netActivity": "74499.00",
      "transactionCount": 4,
      "period": {
        "startDate": "2026-10-01T00:00:00.000Z",
        "endDate": "2026-10-31T23:59:59.999Z"
      },
      "currency": "INR",
      "note": "Totals represent transaction activity within the specified period, not real-time bank balance."
    }
  }
  ```

### 2. Category Breakdown
- **Method**: `GET`
- **Path**: `/api/v1/finance/category-breakdown`
- **Response** (`200 OK`):
  Returns grouped totals, percentages, and category details for income and expense.

### 3. Timeline Trends
- **Method**: `GET`
- **Path**: `/api/v1/finance/trends`
- **Response** (`200 OK`):
  Returns daily buckets with `income`, `expense`, and `net` amounts formatted as decimal strings.
