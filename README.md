# 🏭  Textile Manufacturing Management System
Let us consider a mill named Everest Textile Mills

A centralized, web-based textile manufacturing management platform designed to digitize factory operations, eliminate manual paperwork, improve production visibility, and connect inventory, quality control, order tracking, dispatch, and accounts in one unified system.

## 📌 Project Overview

Everest Textile Mills manages the complete textile manufacturing process, from purchasing raw yarn to producing, inspecting, storing, and delivering finished fabric to buyers.

Traditionally, these operations are handled using notebooks, paper records, phone calls, and manual registers. This leads to stock inaccuracies, production delays, machine downtime, quality tracking difficulties, dispatch errors, and limited visibility into manufacturing costs.

The Textile Manufacturing Management System replaces these manual processes with a centralized digital platform that enables employees, factory managers, owners, and buyers to access accurate, up-to-date information.

**The main objective is to make textile manufacturing more organized, transparent, traceable, and efficient.**

## 🎯 Project Objectives

- Digitize raw-material inventory and supplier management.
- Manage buyer orders and production schedules.
- Monitor spinning, weaving, and dyeing operations.
- Track machine status, production output, and downtime.
- Maintain digital quality inspection records.
- Trace every fabric roll to its production history.
- Manage finished-goods inventory and dispatch.
- Provide buyers with a separate order-tracking portal.
- Manage employee attendance and wage records.
- Calculate manufacturing costs, revenue, outstanding payments, and profit.
- Provide centralized dashboards and reports for informed decision-making.

## ✨ Key Features

### 1. Raw Material and Inventory Management
- Record incoming yarn by type, colour, quantity, supplier, and batch.
- Track available, reserved, and consumed material.
- Maintain inventory transaction history.
- Generate low-stock alerts.
- Check material availability before starting production.
- Create purchase requests when materials are insufficient.

### 2. Order Management
- Create and manage buyer orders.
- Store fabric specifications, colour, quantity, priority, and delivery deadline.
- Track production progress and order status.
- Monitor pending, active, delayed, and completed orders.
- Support partial deliveries where permitted.

### 3. Production Management
- Manage spinning, weaving, and dyeing stages.
- Schedule production jobs against customer orders.
- Assign machines, workers, and shifts.
- Record planned and actual production quantities.
- Monitor machine utilization, breakdowns, maintenance, and idle time.
- Track daily and stage-wise production performance.

### 4. Quality Control and Roll Traceability
- Generate a unique identification number for each fabric roll.
- Record inspection results and defect details.
- Support Passed, Rework Required, Rejected, and Pending Inspection statuses.
- Track holes, colour mismatch, uneven weaving, stains, and other defects.
- Maintain inspection and rework history.
- Trace defective rolls to their associated orders and production records.

### 5. Finished Goods and Dispatch Management
- Track quality-approved fabric rolls in finished-goods inventory.
- Manage roll allocation, packing, and shipment.
- Validate dispatch quantities before confirming a shipment.
- Prevent duplicate dispatches and overshipment.
- Generate invoices and dispatch notes.
- Maintain shipment history and delivery status.

### 6. Separate Buyer Portal
- Provide a dedicated buyer login and dashboard.
- Allow buyers to view their own orders.
- Display production progress and quality status.
- Show quantities produced, approved, ready for shipment, and dispatched.
- Display expected delivery dates and shipment information.
- Provide access to relevant invoices and payment history.
- Notify buyers when order statuses change.

The Buyer Portal shares the same backend and database as the internal factory system while restricting buyers to their own information.

### 7. Employee Attendance and Wage Management
- Maintain employee records.
- Record daily attendance and shift assignments.
- Track working hours and overtime.
- Calculate wages using configured payment rules.
- Generate attendance and wage summaries.

### 8. Accounts and Financial Analytics
- Record supplier bills, buyer invoices, and payments.
- Track raw-material consumption and manufacturing expenses.
- Calculate order-wise production costs.
- Monitor outstanding buyer payments.
- Generate monthly financial reports.
- Analyze revenue, expenses, and profitability using recorded transactions.

### 9. Centralized Dashboard
- Active and delayed orders.
- Raw-material stock and shortage alerts.
- Machine status and downtime.
- Daily production quantities.
- Pending quality inspections.
- Finished-goods availability.
- Pending dispatches.
- Financial summaries and manufacturing reports.

## 🔄 System Workflow

The application follows an integrated manufacturing workflow:

1. **Buyer Order:** Sales staff register a buyer and create an order.
2. **Material Availability:** The system checks whether sufficient yarn is available.
3. **Purchase Request:** If materials are insufficient, a purchase request is raised and the stock is updated when accepted goods are received.
4. **Production Planning:** Materials, machines, workers, and shifts are allocated.
5. **Manufacturing:** Fabric progresses through the required spinning, weaving, and dyeing stages.
6. **Roll Identification:** Production records are associated with uniquely identified fabric rolls.
7. **Quality Inspection:** Rolls are passed, sent for rework, or rejected.
8. **Finished Goods:** Quality-approved rolls are added to available finished-goods inventory.
9. **Dispatch:** Eligible rolls are verified, packed, invoiced, and shipped.
10. **Buyer Updates:** The Buyer Portal reflects the latest saved order and shipment information.
11. **Accounts:** Material costs, labour, machine expenses, invoices, and payments are recorded.
12. **Reports:** The owner reviews production performance, order costs, revenue, expenses, and profitability.

## 🏗️ System Architecture

The system uses a shared backend and centralized database with two distinct interfaces.

- **Internal Factory Portal:** Used by factory employees, managers, and the owner.
- **Buyer Portal:** Used by authenticated buyers to monitor their orders and shipments.
- **Backend API:** Handles business logic, validation, authentication, authorization, and workflow operations.
- **Database:** Stores connected order, inventory, production, quality, dispatch, employee, and financial records.
- **Reporting Layer:** Generates dashboards and reports using stored operational data.

Both portals access the same source of truth, ensuring that internal updates are reflected in the buyer's order information without maintaining separate order records.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT or secure session-based authentication |
| Charts | Recharts |
| Validation | Zod |
| Version Control | Git and GitHub |

*The technology list describes the intended stack. Update it if the actual implementation uses different technologies.*

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Admin / Owner | Manage operations, users, reports, and financial oversight |
| Sales Staff | Register buyers and manage orders |
| Store Manager | Manage yarn inventory, suppliers, and receipts |
| Production Manager | Schedule production and monitor machines |
| Quality Inspector | Inspect rolls and manage quality results |
| Dispatch Staff | Allocate rolls and manage shipments |
| HR / Accounts Staff | Manage attendance, wages, invoices, and accounts |
| Buyer | Track personal orders, shipment status, invoices, and payments |

Role-based access control ensures that each user can access only the features and information permitted for their role.

## 🗄️ Core Database Entities

The database contains related records for:

- Users and buyer accounts
- Buyers and suppliers
- Products and raw materials
- Bills of materials
- Orders and order items
- Purchase requests and purchase orders
- Goods receipts and inventory transactions
- Machines, shifts, and production jobs
- Production logs and fabric rolls
- Quality inspections and rework records
- Finished-goods locations
- Dispatches and dispatch items
- Invoices and payments
- Employees, attendance, and wages
- Manufacturing expenses
- Notifications and audit logs

Foreign-key relationships and transaction-based updates maintain consistency across connected modules.

## 🔐 Security and Data Integrity

- Secure password hashing.
- Authentication and role-based authorization.
- Buyer-specific data isolation.
- Server-side input validation.
- Protected API endpoints.
- Database transactions for critical inventory and dispatch operations.
- Audit history for important operational changes.
- Prevention of duplicate dispatches and invalid stock movements.
- Environment variables for sensitive configuration.
- No exposure of internal manufacturing costs or employee information to buyers.

## 🚀 Installation and Setup

### Prerequisites

Install the following software:

- Node.js and npm.
- PostgreSQL.
- Git.
- A code editor such as Visual Studio Code or Antigravity.

### 1. Clone the Repository

```bash
git clone <your-github-repository-url>
cd <your-project-folder>
```

Replace the placeholders with your actual repository URL and project directory.

### 2. Install Dependencies

For a project with separate frontend and backend directories:

```bash
cd backend
npm install
```

Then install frontend dependencies:

```bash
cd ../frontend
npm install
```

If the project uses a different directory structure, follow the commands in its actual `package.json` files.

### 3. Configure Environment Variables

Create the required `.env` files based on `.env.example`.

Example backend configuration:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/everest_textile"
JWT_SECRET="replace_with_a_secure_random_secret"
NODE_ENV="development"
```

Replace the example database credentials and secret with your own local configuration. Never commit real passwords, API keys, or production secrets to GitHub.

### 4. Configure the Database

Create a PostgreSQL database named `everest_textile` or use another configured database name.

For a Prisma-based backend, run the applicable migration command:

```bash
npx prisma migrate dev
```

Generate the Prisma client if the project scripts do not already do so:

```bash
npx prisma generate
```

If seed data is configured, run the project's documented seed command.

### 5. Start the Backend

From the backend directory, run the development command configured in `package.json`, for example:

```bash
npm run dev
```

### 6. Start the Frontend

From the frontend directory, run:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

The internal factory portal and Buyer Portal should be accessible through their configured routes, such as `/app` and `/buyer`, respectively.

**Note:** The exact commands depend on the final folder structure and available scripts. Follow the actual project configuration rather than assuming these examples exist unchanged.

## 🧪 Testing

The following workflows should be tested before deployment:

- Successful order creation and material reservation.
- Material shortage and purchase receipt.
- Production-stage completion and machine status updates.
- Quality failure, rework, and reinspection.
- Finished-goods inventory updates.
- Duplicate dispatch prevention.
- Partial shipments and remaining quantities.
- Buyer access restrictions.
- Invoice creation and payment recording.
- Order-wise cost and profit calculations.
- Data persistence after restarting the application.

## 📈 Expected Benefits

- Reduced dependence on manual paperwork.
- Better raw-material stock accuracy.
- Improved production planning and machine utilization.
- Faster identification of quality problems.
- Improved traceability of finished fabric rolls.
- Fewer inventory and dispatch errors.
- Transparent buyer order tracking.
- More organized employee and wage records.
- Better visibility into manufacturing costs and profitability.
- Faster, data-driven management decisions.

## 🔮 Future Enhancements

- QR codes or barcode scanning for fabric roll tracking.
- IoT integration for automatic machine monitoring.
- Predictive maintenance for manufacturing equipment.
- Demand forecasting and raw-material planning.
- AI-assisted defect detection using fabric images.
- Automated delivery alerts through email or messaging services.
- Advanced production optimization and analytics.
- Mobile-friendly operator interfaces.

These enhancements should be added only after the core manufacturing workflow is reliable.

## 🏁 Conclusion

The Everest Textile Mills Textile Manufacturing Management System aims to transform traditional textile factory operations into a connected digital workflow.

By integrating inventory, purchasing, production, quality control, dispatch, buyer tracking, employee management, and financial reporting, the platform provides a centralized view of factory operations.

Its separate but connected Buyer Portal improves transparency, while its integrated backend and database help ensure that operational records remain consistent across the organization.

The project demonstrates how software engineering and database-driven automation can address real-world challenges in textile manufacturing.

---

**Project Name:** Everest Textile Mills — Textile Manufacturing Management System

**Category:** Textile Manufacturing / Enterprise Resource Planning (ERP)

**Project Type:** Full-Stack Web Application

**Status:** Update this field to reflect the actual development stage.

**Developed by:** Add your team name and member details.

**License:** Add a license only after deciding how the project will be distributed.
