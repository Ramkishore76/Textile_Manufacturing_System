# 🛒 AGT Textile Mills — Buyer Portal REST API Specification

**Author:** Santhoshkumar S (`writetokumarsanthosh@gmail.com`)  
**Service:** AGT Textile Mills Backend API Gateway  
**Base URL:** `http://localhost:5000/api/buyer-portal`  
**Authentication:** Bearer JWT Header (`Authorization: Bearer <TOKEN>`)

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Allowed Roles | Description | Unauthorized Response |
|---|---|---|---|---|
| `/buyer-portal/products` | `GET` | `BUYER`, `ADMIN`, `STORE` | List active fabrics, specifications & unit pricing | `401 Unauthorized` |
| `/buyer-portal/products/:id` | `PUT` | `ADMIN` (Plant Owner), `STORE` (Store Mgr) | Modify fabric specifications, descriptions & unit cost price | `403 Forbidden` |
| `/buyer-portal/orders` | `POST` | `BUYER`, `ADMIN`, `STORE` | Submit new B2B Purchase Order with automatic 5% GST calculation | `400 Bad Request` / `401 Unauthorized` |
| `/buyer-portal/orders` | `GET` | `BUYER`, `ADMIN`, `STORE` | View scoped buyer orders catalog | `401 Unauthorized` |
| `/buyer-portal/orders/:id` | `GET` | `BUYER`, `ADMIN`, `STORE` | Retrieve 7-stage order milestone lifecycle tracking | `404 Not Found` |
| `/buyer-portal/invoices` | `GET` | `BUYER`, `ADMIN`, `STORE` | Access commercial tax invoices (5% GST) | `401 Unauthorized` |
| `/buyer-portal/payments` | `GET` | `BUYER`, `ADMIN`, `STORE` | Access payment receipts and ledger records | `401 Unauthorized` |

---

## 📡 Endpoints Reference

### 1. Retrieve Fabric Products Catalog
* **Endpoint:** `GET /api/buyer-portal/products`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Response `200 OK`:**
```json
[
  {
    "id": "cuid_example",
    "code": "FAB-COT-101",
    "name": "100% Combed Cotton Poplin",
    "fabricType": "COTTON_POPLIN",
    "gsm": 125,
    "widthInches": 58,
    "weaveType": "PLAIN",
    "unitPricePerMeter": 205,
    "requiresSpinning": true,
    "description": "Premium combed cotton poplin for export shirting.",
    "inStockMeters": 1500
  }
]
```

---

### 2. Update Specifications & Cost Pricing (Owner & Store Manager Only)
* **Endpoint:** `PUT /api/buyer-portal/products/:id`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Payload:**
```json
{
  "name": "100% Combed Cotton Poplin Premium",
  "fabricType": "COTTON_POPLIN",
  "gsm": 130,
  "widthInches": 58,
  "weaveType": "PLAIN",
  "unitPricePerMeter": 210,
  "description": "Updated pricing and export specifications.",
  "requiresSpinning": true
}
```
* **Response `200 OK`:**
```json
{
  "id": "cuid_example",
  "code": "FAB-COT-101",
  "unitPricePerMeter": 210,
  "message": "Product specifications and cost price updated successfully"
}
```
* **Security Enforcement:** If called with a `BUYER` role token, returns:
```json
{
  "error": "Access restricted: Only Plant Owner (Admin) and Store Manager can edit fabric details and cost pricing"
}
```
*(HTTP 403 Forbidden)*

---

### 3. Place B2B Purchase Order
* **Endpoint:** `POST /api/buyer-portal/orders`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Payload:**
```json
{
  "fabricProductId": "cuid_example",
  "requiredQuantity": 2000,
  "color": "Royal Navy",
  "requiredDeliveryDate": "2026-11-05",
  "priority": "HIGH",
  "notes": "Export quality export roll packaging required"
}
```
* **Response `201 Created`:**
```json
{
  "message": "Purchase order placed successfully!",
  "orderId": "order_cuid_123",
  "orderNumber": "ORD-2026-017",
  "totalMeters": 2000,
  "subtotal": 420000,
  "taxAmount": 21000,
  "totalAmount": 441000
}
```

---

## 🛡️ Audit Logging & Notifications
* Every price alteration emits an `UPDATE_FABRIC_PRODUCT_PRICING` audit trail in PostgreSQL.
* Every placed purchase order issues synchronous internal factory notifications for production planning desks and buyer status confirmation alerts.
