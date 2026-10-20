# AccounTech Pro - Accounting & Invoice Bill Maintenance Suite

A full-featured accounting, invoicing, billing, and bookkeeping application built for accountants, finance managers, and business owners.

## 🌟 Key Features

1. **Dashboard & Financial KPIs**
   - Live revenue, total expenses, net profit, accounts receivable, and accounts payable.
   - Interactive charts: Monthly revenue vs. expense comparison & category expenditure breakdown.
   - Quick-access activity feeds for recent invoices and bills.

2. **Invoice & Billing Management**
   - Create, edit, and manage client invoices with automated numbering.
   - Multi-item line billing (description, quantity, rate, tax rate, and discount).
   - Real-time calculation of subtotal, tax amount, and balance due.
   - Professional PDF & Print-ready invoice generation with custom branding and payment instructions.
   - Track invoice statuses: `Draft`, `Sent`, `Partially Paid`, `Paid`, and `Overdue`.
   - Record client payments (full or partial) with transaction reference numbers.
   - Export invoice registry to CSV.

3. **Expense & Vendor Bills Maintenance**
   - Log business operational expenses and vendor bills.
   - Expense categorization (Software, Rent, Salaries, Supplies, Legal, Marketing, Utilities).
   - Track bill statuses (Unpaid vs. Paid) and record bill settlements with a single click.
   - Export expenses to CSV.

4. **Clients & Vendors (Parties) Directory**
   - Central customer CRM and supplier ledger.
   - Tracks total billed, total settled, and outstanding balance per party.

5. **General Ledger & Double-Entry Bookkeeping**
   - **Chart of Accounts** with live balances across Assets, Liabilities, Equity, Revenue, and Expenses.
   - **Journal Entries Log**: Chronological double-entry records generated automatically from invoices and bills.
   - **Manual Journal Adjustment Tool**: Full debit and credit balance validation (prevents unbalanced postings).

6. **Financial Reports & Statements**
   - **Profit & Loss (P&L) Statement**: Net revenue, itemized operational expenses, net profit, and profit margins.
   - **Sales Tax / GST Report**: Output tax collected vs. Input tax credits with net tax liability.
   - **Balance Sheet Overview**: Total Assets = Total Liabilities + Equity.

7. **Company Profile & Backup Management**
   - Configure company legal name, tax/GST number, contact details, currency symbol, and bank wire information.
   - One-click JSON backup download and demo data reset.

---

## 🚀 How to Run

The app is currently running live on:
👉 **[http://localhost:3005](http://localhost:3005)**

### To start manually in the future:
```bash
cd "C:\Users\karth\.gemini\antigravity\scratch\accountant-app"
node server.js
```

Then open your browser at `http://localhost:3005`.
