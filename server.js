const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'accounting_data.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default seed data
function getDefaultData() {
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];
  const addDays = (d, days) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return formatDate(res);
  };

  const dToday = formatDate(today);
  const dMinus15 = addDays(today, -15);
  const dMinus25 = addDays(today, -25);
  const dMinus5 = addDays(today, -5);
  const dPlus10 = addDays(today, 10);
  const dPlus20 = addDays(today, 20);

  return {
    settings: {
      companyName: "Apex Financial Solutions & Tech Ltd.",
      email: "billing@apexsolutions.com",
      phone: "+1 (555) 234-5678",
      address: "Suite 400, 100 Financial Plaza, New York, NY 10005",
      taxId: "TAX-US-98765432",
      currency: "$",
      currencyCode: "USD",
      invoicePrefix: "INV-2026-",
      billPrefix: "BILL-2026-",
      bankDetails: "Chase Bank | A/C: 1234-5678-9012 | Routing: 021000021 | SWIFT: CHASUS33",
      paymentTermsNote: "Payment is due within 30 days of invoice date. Thank you for your business!"
    },
    clients: [
      {
        id: "cli-1",
        name: "Acme Global Technologies",
        contactPerson: "Sarah Jenkins",
        email: "sarah@acmeglobal.com",
        phone: "+1 (555) 019-2831",
        address: "742 Evergreen Terrace, Springfield, OR",
        taxId: "TAX-991201",
        notes: "Key enterprise client, net-30 terms",
        createdAt: dMinus25
      },
      {
        id: "cli-2",
        name: "Nexus Retail Group",
        contactPerson: "David Miller",
        email: "dmiller@nexusretail.com",
        phone: "+1 (555) 432-8765",
        address: "125 Commerce Blvd, Chicago, IL",
        taxId: "TAX-445892",
        notes: "Monthly retainer contract",
        createdAt: dMinus25
      },
      {
        id: "cli-3",
        name: "Horizon Design Studio",
        contactPerson: "Elena Rostova",
        email: "elena@horizondesign.io",
        phone: "+1 (555) 789-0123",
        address: "88 Market St, San Francisco, CA",
        taxId: "TAX-771239",
        notes: "Quarterly web & cloud consulting",
        createdAt: dMinus15
      }
    ],
    vendors: [
      {
        id: "ven-1",
        name: "AWS Cloud Infrastructure",
        contactPerson: "Enterprise Accounts",
        email: "billing@aws-cloud.com",
        phone: "+1 (800) 555-0199",
        address: "410 Terry Ave N, Seattle, WA",
        taxId: "VEN-TAX-101",
        category: "Software & Hosting",
        notes: "Server & DB hosting charges"
      },
      {
        id: "ven-2",
        name: "Metropolis Office Properties",
        contactPerson: "Building Management",
        email: "lease@metropolisprop.com",
        phone: "+1 (555) 234-9988",
        address: "100 Financial Plaza, New York, NY",
        taxId: "VEN-TAX-202",
        category: "Rent & Facilities",
        notes: "Monthly office lease"
      },
      {
        id: "ven-3",
        name: "OfficeDepot & Supplies Co.",
        contactPerson: "Order Support",
        email: "sales@officedepot-corp.com",
        phone: "+1 (800) 555-4321",
        address: "6600 North Military Trail, Boca Raton, FL",
        taxId: "VEN-TAX-303",
        category: "Office Supplies",
        notes: "Stationery and workstation equipment"
      }
    ],
    invoices: [
      {
        id: "inv-101",
        invoiceNumber: "INV-2026-0001",
        clientId: "cli-1",
        clientName: "Acme Global Technologies",
        issueDate: dMinus25,
        dueDate: dMinus5,
        status: "Paid",
        items: [
          { description: "Financial Architecture & ERP Setup", qty: 40, rate: 150, taxRate: 10, amount: 6000 },
          { description: "Database Optimization & Migration", qty: 20, rate: 120, taxRate: 10, amount: 2400 }
        ],
        subtotal: 8400,
        taxAmount: 840,
        discountAmount: 200,
        total: 9040,
        paidAmount: 9040,
        balanceDue: 0,
        payments: [
          { id: "pay-1", date: dMinus15, amount: 9040, method: "Bank Transfer", reference: "WIRE-992102" }
        ],
        notes: "Completed setup milestone."
      },
      {
        id: "inv-102",
        invoiceNumber: "INV-2026-0002",
        clientId: "cli-2",
        clientName: "Nexus Retail Group",
        issueDate: dMinus15,
        dueDate: dPlus10,
        status: "Partially Paid",
        items: [
          { description: "Monthly Financial Bookkeeping & Auditing", qty: 1, rate: 3500, taxRate: 10, amount: 3500 },
          { description: "Quarterly Tax Preparation Service", qty: 1, rate: 1500, taxRate: 10, amount: 1500 }
        ],
        subtotal: 5000,
        taxAmount: 500,
        discountAmount: 0,
        total: 5500,
        paidAmount: 2500,
        balanceDue: 3000,
        payments: [
          { id: "pay-2", date: dMinus5, amount: 2500, method: "Credit Card", reference: "CC-AUTH-8821" }
        ],
        notes: "Part 1 retainer received. Remaining 3000 due next week."
      },
      {
        id: "inv-103",
        invoiceNumber: "INV-2026-0003",
        clientId: "cli-3",
        clientName: "Horizon Design Studio",
        issueDate: dMinus5,
        dueDate: dPlus20,
        status: "Sent",
        items: [
          { description: "Corporate Tax Strategy & Payroll Advisory", qty: 15, rate: 175, taxRate: 10, amount: 2625 }
        ],
        subtotal: 2625,
        taxAmount: 262.5,
        discountAmount: 0,
        total: 2887.5,
        paidAmount: 0,
        balanceDue: 2887.5,
        payments: [],
        notes: "Invoice delivered via email."
      }
    ],
    bills: [
      {
        id: "bill-101",
        billNumber: "BILL-2026-0001",
        vendorId: "ven-1",
        vendorName: "AWS Cloud Infrastructure",
        category: "Software & Hosting",
        billDate: dMinus25,
        dueDate: dMinus5,
        status: "Paid",
        amount: 850,
        taxAmount: 85,
        total: 935,
        paidAmount: 935,
        balanceDue: 0,
        paymentMethod: "Credit Card",
        notes: "Cloud computing instances"
      },
      {
        id: "bill-102",
        billNumber: "BILL-2026-0002",
        vendorId: "ven-2",
        vendorName: "Metropolis Office Properties",
        category: "Rent & Facilities",
        billDate: dMinus15,
        dueDate: dPlus10,
        status: "Paid",
        amount: 3200,
        taxAmount: 0,
        total: 3200,
        paidAmount: 3200,
        balanceDue: 0,
        paymentMethod: "Bank Transfer",
        notes: "Main office rent"
      },
      {
        id: "bill-103",
        billNumber: "BILL-2026-0003",
        vendorId: "ven-3",
        vendorName: "OfficeDepot & Supplies Co.",
        category: "Office Supplies",
        billDate: dMinus5,
        dueDate: dPlus20,
        status: "Unpaid",
        amount: 450,
        taxAmount: 45,
        total: 495,
        paidAmount: 0,
        balanceDue: 495,
        paymentMethod: "Net-30",
        notes: "Printer ink, paper, ergonomic chairs"
      }
    ],
    journalEntries: [
      {
        id: "je-1",
        entryNumber: "JE-2026-0001",
        date: dMinus25,
        description: "Invoice INV-2026-0001 to Acme Global Technologies",
        reference: "INV-2026-0001",
        lines: [
          { accountCode: "1200", accountName: "Accounts Receivable", debit: 9040, credit: 0 },
          { accountCode: "4000", accountName: "Sales & Professional Fees Revenue", debit: 0, credit: 8200 },
          { accountCode: "2200", accountName: "Sales Tax / GST Output Payable", debit: 0, credit: 840 }
        ]
      },
      {
        id: "je-2",
        entryNumber: "JE-2026-0002",
        date: dMinus15,
        description: "Payment received for INV-2026-0001",
        reference: "PAY-1",
        lines: [
          { accountCode: "1000", accountName: "Cash & Bank Account", debit: 9040, credit: 0 },
          { accountCode: "1200", accountName: "Accounts Receivable", debit: 0, credit: 9040 }
        ]
      },
      {
        id: "je-3",
        entryNumber: "JE-2026-0003",
        date: dMinus15,
        description: "Office Rent Payment to Metropolis Office Properties",
        reference: "BILL-2026-0002",
        lines: [
          { accountCode: "6100", accountName: "Rent & Facilities Expense", debit: 3200, credit: 0 },
          { accountCode: "1000", accountName: "Cash & Bank Account", debit: 0, credit: 3200 }
        ]
      }
    ],
    accounts: [
      { code: "1000", name: "Cash & Operating Bank Account", type: "Asset", balance: 25340 },
      { code: "1200", name: "Accounts Receivable (Clients)", type: "Asset", balance: 5887.5 },
      { code: "1500", name: "Office Equipment & Computers", type: "Asset", balance: 14500 },
      { code: "2000", name: "Accounts Payable (Vendors)", type: "Liability", balance: 495 },
      { code: "2200", name: "Sales Tax / GST Output Payable", type: "Liability", balance: 1472.5 },
      { code: "3000", name: "Owner's Equity & Retained Earnings", type: "Equity", balance: 35000 },
      { code: "4000", name: "Sales & Professional Fees Revenue", type: "Revenue", balance: 16025 },
      { code: "6000", name: "Software, Cloud & IT Services", type: "Expense", balance: 850 },
      { code: "6100", name: "Rent & Facilities Expense", type: "Expense", balance: 3200 },
      { code: "6200", name: "Salaries & Contractor Payroll", type: "Expense", balance: 6500 },
      { code: "6300", name: "Office Supplies & Admin Expense", type: "Expense", balance: 450 }
    ]
  };
}

// Read database
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = getDefaultData();
      saveData(initial);
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return getDefaultData();
  }
}

// Write database atomically
function saveData(data) {
  const tmpPath = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DATA_FILE);
}

// Helper to recalculate account balances based on invoices, payments and bills
function updateLedgerBalances(db) {
  let totalCash = 20000; // baseline capital
  let totalAR = 0;
  let totalAP = 0;
  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalTaxOutput = 0;
  let totalTaxInput = 0;

  // From Invoices
  db.invoices.forEach(inv => {
    totalRevenue += (inv.subtotal - (inv.discountAmount || 0));
    totalTaxOutput += (inv.taxAmount || 0);
    totalAR += (inv.balanceDue || 0);
    totalCash += (inv.paidAmount || 0);
  });

  // From Bills
  db.bills.forEach(bill => {
    totalExpenses += (bill.amount || 0);
    totalTaxInput += (bill.taxAmount || 0);
    totalAP += (bill.balanceDue || 0);
    totalCash -= (bill.paidAmount || 0);
  });

  const accCash = db.accounts.find(a => a.code === "1000");
  if (accCash) accCash.balance = Math.max(0, totalCash);

  const accAR = db.accounts.find(a => a.code === "1200");
  if (accAR) accAR.balance = totalAR;

  const accAP = db.accounts.find(a => a.code === "2000");
  if (accAP) accAP.balance = totalAP;

  const accTax = db.accounts.find(a => a.code === "2200");
  if (accTax) accTax.balance = Math.max(0, totalTaxOutput - totalTaxInput);

  const accRev = db.accounts.find(a => a.code === "4000");
  if (accRev) accRev.balance = totalRevenue;
}

// ----------------- API ROUTES -----------------

// Summary Dashboard metrics
app.get('/api/summary', (req, res) => {
  const db = loadData();
  updateLedgerBalances(db);

  let totalRevenue = 0;
  let totalPaidRevenue = 0;
  let accountsReceivable = 0;
  let overdueInvoicesCount = 0;
  const now = new Date();

  db.invoices.forEach(inv => {
    totalRevenue += inv.total;
    totalPaidRevenue += (inv.paidAmount || 0);
    accountsReceivable += (inv.balanceDue || 0);
    if (inv.status !== 'Paid' && new Date(inv.dueDate) < now) {
      overdueInvoicesCount++;
    }
  });

  let totalExpenses = 0;
  let accountsPayable = 0;
  db.bills.forEach(bill => {
    totalExpenses += bill.total;
    accountsPayable += (bill.balanceDue || 0);
  });

  const netIncome = totalPaidRevenue - (totalExpenses - accountsPayable);

  // Category breakdown for expenses
  const expenseByCategory = {};
  db.bills.forEach(b => {
    const cat = b.category || "General";
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + b.total;
  });

  // Recent activity
  const recentInvoices = [...db.invoices].sort((a,b) => new Date(b.issueDate) - new Date(a.issueDate)).slice(0, 5);
  const recentBills = [...db.bills].sort((a,b) => new Date(b.billDate) - new Date(a.billDate)).slice(0, 5);

  res.json({
    metrics: {
      totalRevenue,
      totalPaidRevenue,
      accountsReceivable,
      totalExpenses,
      accountsPayable,
      netIncome,
      overdueInvoicesCount,
      totalInvoices: db.invoices.length,
      totalBills: db.bills.length,
      totalClients: db.clients.length,
      totalVendors: db.vendors.length
    },
    expenseByCategory,
    recentInvoices,
    recentBills,
    settings: db.settings
  });
});

// Settings
app.get('/api/settings', (req, res) => {
  const db = loadData();
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const db = loadData();
  db.settings = { ...db.settings, ...req.body };
  saveData(db);
  res.json({ success: true, settings: db.settings });
});

// Clients CRUD
app.get('/api/clients', (req, res) => {
  const db = loadData();
  // enrich with total billed & outstanding
  const enriched = db.clients.map(c => {
    const clientInvoices = db.invoices.filter(i => i.clientId === c.id);
    const totalBilled = clientInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaid = clientInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const outstanding = clientInvoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);
    return { ...c, totalBilled, totalPaid, outstanding, invoiceCount: clientInvoices.length };
  });
  res.json(enriched);
});

app.post('/api/clients', (req, res) => {
  const db = loadData();
  const newClient = {
    id: 'cli-' + uuidv4().slice(0, 8),
    name: req.body.name,
    contactPerson: req.body.contactPerson || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    address: req.body.address || '',
    taxId: req.body.taxId || '',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString().split('T')[0]
  };
  db.clients.push(newClient);
  saveData(db);
  res.json(newClient);
});

app.put('/api/clients/:id', (req, res) => {
  const db = loadData();
  const idx = db.clients.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Client not found' });
  db.clients[idx] = { ...db.clients[idx], ...req.body };
  // If name changed, update clientName on invoices
  if (req.body.name) {
    db.invoices.forEach(inv => {
      if (inv.clientId === req.params.id) inv.clientName = req.body.name;
    });
  }
  saveData(db);
  res.json(db.clients[idx]);
});

app.delete('/api/clients/:id', (req, res) => {
  const db = loadData();
  db.clients = db.clients.filter(c => c.id !== req.params.id);
  saveData(db);
  res.json({ success: true });
});

// Vendors CRUD
app.get('/api/vendors', (req, res) => {
  const db = loadData();
  const enriched = db.vendors.map(v => {
    const vendorBills = db.bills.filter(b => b.vendorId === v.id);
    const totalBilled = vendorBills.reduce((sum, b) => sum + b.total, 0);
    const totalPaid = vendorBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const outstanding = vendorBills.reduce((sum, b) => sum + (b.balanceDue || 0), 0);
    return { ...v, totalBilled, totalPaid, outstanding, billCount: vendorBills.length };
  });
  res.json(enriched);
});

app.post('/api/vendors', (req, res) => {
  const db = loadData();
  const newVendor = {
    id: 'ven-' + uuidv4().slice(0, 8),
    name: req.body.name,
    contactPerson: req.body.contactPerson || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    address: req.body.address || '',
    taxId: req.body.taxId || '',
    category: req.body.category || 'General',
    notes: req.body.notes || ''
  };
  db.vendors.push(newVendor);
  saveData(db);
  res.json(newVendor);
});

app.put('/api/vendors/:id', (req, res) => {
  const db = loadData();
  const idx = db.vendors.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Vendor not found' });
  db.vendors[idx] = { ...db.vendors[idx], ...req.body };
  saveData(db);
  res.json(db.vendors[idx]);
});

app.delete('/api/vendors/:id', (req, res) => {
  const db = loadData();
  db.vendors = db.vendors.filter(v => v.id !== req.params.id);
  saveData(db);
  res.json({ success: true });
});

// Invoices CRUD & Workflow
app.get('/api/invoices', (req, res) => {
  const db = loadData();
  res.json(db.invoices);
});

app.get('/api/invoices/:id', (req, res) => {
  const db = loadData();
  const inv = db.invoices.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const client = db.clients.find(c => c.id === inv.clientId) || null;
  res.json({ ...inv, client, settings: db.settings });
});

app.post('/api/invoices', (req, res) => {
  const db = loadData();
  const nextNumber = db.settings.invoicePrefix + String(db.invoices.length + 1).padStart(4, '0');

  const items = (req.body.items || []).map(item => {
    const qty = parseFloat(item.qty) || 1;
    const rate = parseFloat(item.rate) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    const amount = qty * rate;
    return {
      description: item.description || '',
      qty,
      rate,
      taxRate,
      amount
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.amount * (item.taxRate / 100)), 0);
  const discountAmount = parseFloat(req.body.discountAmount) || 0;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);
  const paidAmount = parseFloat(req.body.paidAmount) || 0;
  const balanceDue = Math.max(0, total - paidAmount);

  let status = req.body.status || 'Draft';
  if (balanceDue === 0 && total > 0) status = 'Paid';
  else if (paidAmount > 0 && balanceDue > 0) status = 'Partially Paid';

  const newInvoice = {
    id: 'inv-' + uuidv4().slice(0, 8),
    invoiceNumber: req.body.invoiceNumber || nextNumber,
    clientId: req.body.clientId,
    clientName: req.body.clientName || 'Unknown Client',
    issueDate: req.body.issueDate || new Date().toISOString().split('T')[0],
    dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
    status,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
    payments: paidAmount > 0 ? [{
      id: 'pay-' + uuidv4().slice(0, 8),
      date: req.body.issueDate,
      amount: paidAmount,
      method: req.body.paymentMethod || 'Bank Transfer',
      reference: 'Initial Payment'
    }] : [],
    notes: req.body.notes || ''
  };

  // Auto record Journal Entry for double entry bookkeeping
  const jeNumber = 'JE-2026-' + String(db.journalEntries.length + 1).padStart(4, '0');
  db.journalEntries.push({
    id: 'je-' + uuidv4().slice(0, 8),
    entryNumber: jeNumber,
    date: newInvoice.issueDate,
    description: `Invoice ${newInvoice.invoiceNumber} to ${newInvoice.clientName}`,
    reference: newInvoice.invoiceNumber,
    lines: [
      { accountCode: "1200", accountName: "Accounts Receivable", debit: newInvoice.total, credit: 0 },
      { accountCode: "4000", accountName: "Sales Revenue", debit: 0, credit: newInvoice.subtotal - newInvoice.discountAmount },
      { accountCode: "2200", accountName: "Tax Output Payable", debit: 0, credit: newInvoice.taxAmount }
    ]
  });

  db.invoices.push(newInvoice);
  updateLedgerBalances(db);
  saveData(db);
  res.json(newInvoice);
});

// Update invoice
app.put('/api/invoices/:id', (req, res) => {
  const db = loadData();
  const idx = db.invoices.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });

  const existing = db.invoices[idx];
  const items = req.body.items ? req.body.items.map(item => {
    const qty = parseFloat(item.qty) || 1;
    const rate = parseFloat(item.rate) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    return {
      description: item.description,
      qty,
      rate,
      taxRate,
      amount: qty * rate
    };
  }) : existing.items;

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.amount * (item.taxRate / 100)), 0);
  const discountAmount = req.body.discountAmount !== undefined ? parseFloat(req.body.discountAmount) : existing.discountAmount;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);
  const paidAmount = existing.paidAmount || 0;
  const balanceDue = Math.max(0, total - paidAmount);

  let status = req.body.status || existing.status;
  if (balanceDue === 0 && total > 0) status = 'Paid';
  else if (paidAmount > 0 && balanceDue > 0) status = 'Partially Paid';

  db.invoices[idx] = {
    ...existing,
    ...req.body,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
    status
  };

  updateLedgerBalances(db);
  saveData(db);
  res.json(db.invoices[idx]);
});

// Record Payment on Invoice
app.post('/api/invoices/:id/payment', (req, res) => {
  const db = loadData();
  const inv = db.invoices.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  const paymentAmount = parseFloat(req.body.amount) || 0;
  if (paymentAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than 0' });
  }

  const paymentRecord = {
    id: 'pay-' + uuidv4().slice(0, 8),
    date: req.body.date || new Date().toISOString().split('T')[0],
    amount: paymentAmount,
    method: req.body.method || 'Bank Transfer',
    reference: req.body.reference || ''
  };

  inv.payments = inv.payments || [];
  inv.payments.push(paymentRecord);
  inv.paidAmount = (inv.paidAmount || 0) + paymentAmount;
  inv.balanceDue = Math.max(0, inv.total - inv.paidAmount);

  if (inv.balanceDue <= 0.01) {
    inv.balanceDue = 0;
    inv.status = 'Paid';
  } else {
    inv.status = 'Partially Paid';
  }

  // Double entry journal entry for payment receipt
  const jeNumber = 'JE-2026-' + String(db.journalEntries.length + 1).padStart(4, '0');
  db.journalEntries.push({
    id: 'je-' + uuidv4().slice(0, 8),
    entryNumber: jeNumber,
    date: paymentRecord.date,
    description: `Payment received for ${inv.invoiceNumber} (${paymentRecord.method})`,
    reference: inv.invoiceNumber,
    lines: [
      { accountCode: "1000", accountName: "Cash & Bank Account", debit: paymentAmount, credit: 0 },
      { accountCode: "1200", accountName: "Accounts Receivable", debit: 0, credit: paymentAmount }
    ]
  });

  updateLedgerBalances(db);
  saveData(db);
  res.json({ success: true, invoice: inv, payment: paymentRecord });
});

// Delete invoice
app.delete('/api/invoices/:id', (req, res) => {
  const db = loadData();
  db.invoices = db.invoices.filter(i => i.id !== req.params.id);
  updateLedgerBalances(db);
  saveData(db);
  res.json({ success: true });
});

// Bills & Expense Maintenance CRUD
app.get('/api/bills', (req, res) => {
  const db = loadData();
  res.json(db.bills);
});

app.post('/api/bills', (req, res) => {
  const db = loadData();
  const nextNumber = db.settings.billPrefix + String(db.bills.length + 1).padStart(4, '0');

  const amount = parseFloat(req.body.amount) || 0;
  const taxAmount = parseFloat(req.body.taxAmount) || 0;
  const total = amount + taxAmount;
  const isPaid = req.body.status === 'Paid';
  const paidAmount = isPaid ? total : 0;
  const balanceDue = total - paidAmount;

  const newBill = {
    id: 'bill-' + uuidv4().slice(0, 8),
    billNumber: req.body.billNumber || nextNumber,
    vendorId: req.body.vendorId || '',
    vendorName: req.body.vendorName || 'General Vendor',
    category: req.body.category || 'General Expense',
    billDate: req.body.billDate || new Date().toISOString().split('T')[0],
    dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
    status: isPaid ? 'Paid' : 'Unpaid',
    amount: Math.round(amount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
    paymentMethod: req.body.paymentMethod || 'Bank Transfer',
    notes: req.body.notes || ''
  };

  // Journal entry for vendor bill
  const jeNumber = 'JE-2026-' + String(db.journalEntries.length + 1).padStart(4, '0');
  db.journalEntries.push({
    id: 'je-' + uuidv4().slice(0, 8),
    entryNumber: jeNumber,
    date: newBill.billDate,
    description: `Expense Bill ${newBill.billNumber} from ${newBill.vendorName} (${newBill.category})`,
    reference: newBill.billNumber,
    lines: [
      { accountCode: "6000", accountName: `Expense - ${newBill.category}`, debit: newBill.amount, credit: 0 },
      ...(newBill.taxAmount > 0 ? [{ accountCode: "2200", accountName: "Tax Input Credit", debit: newBill.taxAmount, credit: 0 }] : []),
      { accountCode: isPaid ? "1000" : "2000", accountName: isPaid ? "Cash & Bank Account" : "Accounts Payable", debit: 0, credit: newBill.total }
    ]
  });

  db.bills.push(newBill);
  updateLedgerBalances(db);
  saveData(db);
  res.json(newBill);
});

app.put('/api/bills/:id/pay', (req, res) => {
  const db = loadData();
  const bill = db.bills.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  const amountToPay = parseFloat(req.body.amount) || bill.balanceDue;
  bill.paidAmount = (bill.paidAmount || 0) + amountToPay;
  bill.balanceDue = Math.max(0, bill.total - bill.paidAmount);
  if (bill.balanceDue <= 0.01) {
    bill.balanceDue = 0;
    bill.status = 'Paid';
  }

  // Journal Entry
  const jeNumber = 'JE-2026-' + String(db.journalEntries.length + 1).padStart(4, '0');
  db.journalEntries.push({
    id: 'je-' + uuidv4().slice(0, 8),
    entryNumber: jeNumber,
    date: new Date().toISOString().split('T')[0],
    description: `Vendor Bill Payment for ${bill.billNumber} (${bill.vendorName})`,
    reference: bill.billNumber,
    lines: [
      { accountCode: "2000", accountName: "Accounts Payable", debit: amountToPay, credit: 0 },
      { accountCode: "1000", accountName: "Cash & Bank Account", debit: 0, credit: amountToPay }
    ]
  });

  updateLedgerBalances(db);
  saveData(db);
  res.json(bill);
});

app.delete('/api/bills/:id', (req, res) => {
  const db = loadData();
  db.bills = db.bills.filter(b => b.id !== req.params.id);
  updateLedgerBalances(db);
  saveData(db);
  res.json({ success: true });
});

// Journal & Accounting Entries
app.get('/api/journal', (req, res) => {
  const db = loadData();
  res.json(db.journalEntries);
});

app.post('/api/journal', (req, res) => {
  const db = loadData();
  const { date, description, lines } = req.body;

  if (!lines || lines.length < 2) {
    return res.status(400).json({ error: 'A journal entry must have at least 2 lines (debit & credit)' });
  }

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return res.status(400).json({ error: `Double-entry violation: Total debits (${totalDebit}) must equal total credits (${totalCredit})` });
  }

  const jeNumber = 'JE-2026-' + String(db.journalEntries.length + 1).padStart(4, '0');
  const entry = {
    id: 'je-' + uuidv4().slice(0, 8),
    entryNumber: jeNumber,
    date: date || new Date().toISOString().split('T')[0],
    description: description || 'Manual Journal Adjustment',
    reference: req.body.reference || 'Manual Entry',
    lines: lines.map(l => ({
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0
    }))
  };

  db.journalEntries.push(entry);
  saveData(db);
  res.json(entry);
});

// Chart of accounts
app.get('/api/accounts', (req, res) => {
  const db = loadData();
  updateLedgerBalances(db);
  res.json(db.accounts);
});

// Financial Reports: Profit & Loss Statement
app.get('/api/reports/pnl', (req, res) => {
  const db = loadData();
  const { startDate, endDate } = req.query;

  let invoices = db.invoices;
  let bills = db.bills;

  if (startDate) {
    invoices = invoices.filter(i => i.issueDate >= startDate);
    bills = bills.filter(b => b.billDate >= startDate);
  }
  if (endDate) {
    invoices = invoices.filter(i => i.issueDate <= endDate);
    bills = bills.filter(b => b.billDate <= endDate);
  }

  const grossRevenue = invoices.reduce((s, i) => s + i.subtotal, 0);
  const discountsGiven = invoices.reduce((s, i) => s + (i.discountAmount || 0), 0);
  const netRevenue = grossRevenue - discountsGiven;

  const expenseBreakdown = {};
  bills.forEach(b => {
    const cat = b.category || "General Operating";
    expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + b.amount;
  });

  const totalExpenses = Object.values(expenseBreakdown).reduce((s, v) => s + v, 0);
  const netProfit = netRevenue - totalExpenses;
  const netMargin = netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(1) : 0;

  res.json({
    grossRevenue,
    discountsGiven,
    netRevenue,
    expenseBreakdown,
    totalExpenses,
    netProfit,
    netMargin
  });
});

// Financial Reports: Tax / GST Breakdown
app.get('/api/reports/tax', (req, res) => {
  const db = loadData();
  const outputTax = db.invoices.reduce((s, i) => s + (i.taxAmount || 0), 0);
  const inputTaxCredit = db.bills.reduce((s, b) => s + (b.taxAmount || 0), 0);
  const netTaxPayable = outputTax - inputTaxCredit;

  res.json({
    outputTax,
    inputTaxCredit,
    netTaxPayable,
    invoicesWithTax: db.invoices.map(i => ({ number: i.invoiceNumber, client: i.clientName, total: i.total, tax: i.taxAmount })),
    billsWithTax: db.bills.map(b => ({ number: b.billNumber, vendor: b.vendorName, total: b.total, tax: b.taxAmount }))
  });
});

// Financial Reports: Balance Sheet
app.get('/api/reports/balance-sheet', (req, res) => {
  const db = loadData();
  updateLedgerBalances(db);

  const assets = db.accounts.filter(a => a.type === 'Asset');
  const liabilities = db.accounts.filter(a => a.type === 'Liability');
  const equity = db.accounts.filter(a => a.type === 'Equity');

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquity = equity.reduce((s, a) => s + a.balance, 0);

  res.json({
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 100 // within operational drift
  });
});

// Backup & Reset endpoints
app.get('/api/backup', (req, res) => {
  const db = loadData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=accounting_backup.json');
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/reset', (req, res) => {
  const fresh = getDefaultData();
  saveData(fresh);
  res.json({ success: true, message: 'Data reset to sample accountant demo data' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AccounTech - Accountant & Invoice Billing App`);
  console.log(`👉 Running on http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
