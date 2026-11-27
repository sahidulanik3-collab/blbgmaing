# BLB Gaming Zone - Snacks, Drinks, Inventory & Unified Checkout System

A complete, production-grade management and Point-of-Sale (POS) system built for **BLB Gaming Zone**, integrating gaming sessions, station timers, real-time snack/drink inventory, walk-in quick sales, unified customer checkout, customer due tracking, shop cash register, and profit reports.

---

## 🚀 Key Modules & Capabilities

### 1. Product & Inventory Management
- **Catalog Management:** Add, edit, enable/disable products with Product ID, SKU/barcode, Brand, Category, Unit type (Piece, Bottle, Can, Packet, Box), Purchase cost, Selling price, and Minimum stock alert level.
- **Stock Tracking & Real-Time Deduction:** Real-time stock decrement when sold in-session or via walk-in quick sale.
- **Stock Purchases & Automatic Expense Logging:** Records purchase cost, supplier, invoice #, and automatically creates a business expense in the daily cash register.
- **Manual Stock Adjustments:** Audit logged adjustments with reasons: *Damaged, Expired, Lost, Manual correction, New purchase*.
- **Negative Stock Protection:** Configurable setting that prevents inventory from becoming negative unless explicitly allowed by the owner.
- **Low Stock Alerts:** Automatic badge indicators and notification banner for products at or below the minimum stock threshold.

### 2. In-Session Product Sales
- While customers game at any station (PS5, PC, Racing Rig, VR, Billiards), staff can click **"+ Products"** on that station card.
- Select snacks/drinks with available stock indicators, quantity selectors, and real-time total.
- Attaches to customer's active gaming session bill and safely deducts stock.
- Supports item removal or quantity correction with transaction-safe stock restoration (`Sale Reversal`) and audit trail.

### 3. Walk-in Quick Sales
- Instant POS for walk-in customers who buy snacks or drinks without gaming.
- Cart with quick category pills, search bar, and barcode/SKU support.
- Split payments (Cash, bKash, Nagad, Bank).
- Immediate thermal receipt generation and accounting cash inflow logging.

### 4. Unified Session Checkout
- Clicking **"End Session & Checkout"** calculates:
  - **Gaming Charge:** Start time, duration, hourly rate / package.
  - **Product Charges:** Itemized snacks & drinks line totals.
  - **Additional Charges:** Controller fee, damages, etc.
  - **Discounts:** Fixed (৳) or Percentage (%) with documented reason.
  - **Payment Breakdown:** Advance payments, previous session payments, and checkout payments.
- **Calculation Formula:**
  $$\text{Grand Total} = \text{Gaming Subtotal} + \text{Product Subtotal} + \text{Additional Charges} - \text{Discounts}$$
  $$\text{Remaining Due} = \text{Grand Total} - \text{Advance Payments} - \text{Previous Payments} - \text{Checkout Payments}$$
- Integer BDT math to eliminate floating-point rounding errors.
- Never counts or subtracts payments twice.

### 5. Checkout Options & Due Management
- **A. Pay Full & Checkout:** Marks PAID, releases station, records payment, generates receipt.
- **B. Partial Payment & Checkout:** Records payment received, creates a Due record for the remaining amount, marks PARTIALLY_PAID.
- **C. Checkout with Due:** Records full unpaid amount as due, links to customer profile and checkout bill.
- **Due Settlement:** Customer due search by name or phone, partial/full repayments, permanent repayment audit history.

### 6. Thermal & Standard Printable Receipts
- BLB GAMING ZONE header, contact details, receipt number, station, duration, itemized products, payment methods, remaining due, employee, and custom footer.
- Supports **80mm Thermal Printer POS mode**, standard A4 browser print, and text receipt copy for SMS/WhatsApp.

### 7. Daily Cash Register & Accounting
- Real-time **Net Cash in Drawer** calculation: $\text{Cash In} - \text{Cash Out}$.
- Digital MFS tracking (bKash, Nagad, Bank transfers).
- Shop expense manager (Electricity, rent, repairs, staff refreshment).
- Daily gross revenue, COGS, and estimated net profit.

### 8. Profit & Inventory Reports
- Filter by Today, This Week, This Month, or All Time.
- Product Sales Revenue, Cost of Goods Sold (COGS), Gross Profit, and Profit Margins (%).
- Best-selling products ranked by volume and revenue.
- Damaged / expired / lost stock audit log.
- One-click **CSV export** for Excel / Google Sheets.

---

## 🛠️ Technology Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **State & Storage:** Transaction-safe local persistent reactive database with Firestore / Firebase ready data models.
- **Testing:** Automated test suite verifying financial formulas, split payments, and stock logic.

---

## 💻 How to Run

### Install Dependencies:
\`\`\`bash
npm install
\`\`\`

### Run Development Server:
\`\`\`bash
npm run dev
\`\`\`
Open \`http://localhost:3000\` or the URL shown in terminal.

### Run Automated Tests:
\`\`\`bash
npm test
\`\`\`

### Build for Production:
\`\`\`bash
npm run build
\`\`\`
