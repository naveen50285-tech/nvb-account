// Global App State
let appData = {
  settings: {},
  metrics: {},
  invoices: [],
  bills: [],
  clients: [],
  vendors: [],
  journal: [],
  accounts: []
};

let currentTab = 'dashboard';
let currentPartySubTab = 'clients';
let currentReportType = 'pnl';
let revExpenseChart = null;
let expenseCategoryChart = null;

// Currency formatter helper
function fmtCur(amount) {
  const symbol = appData.settings?.currency || '$';
  const val = parseFloat(amount) || 0;
  return `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Show Toast
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');

  toastMsg.textContent = message;
  if (isError) {
    toastIcon.setAttribute('data-lucide', 'alert-circle');
    toastIcon.className = 'w-4 h-4 text-rose-400';
  } else {
    toastIcon.setAttribute('data-lucide', 'check-circle');
    toastIcon.className = 'w-4 h-4 text-emerald-400';
  }
  lucide.createIcons();

  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3200);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAllData();
  switchTab('dashboard');
  lucide.createIcons();
});

// Fetch all required data
async function fetchAllData() {
  try {
    const [summaryRes, invoicesRes, billsRes, clientsRes, vendorsRes, journalRes, accountsRes, settingsRes] = await Promise.all([
      fetch('/api/summary').then(r => r.json()),
      fetch('/api/invoices').then(r => r.json()),
      fetch('/api/bills').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/vendors').then(r => r.json()),
      fetch('/api/journal').then(r => r.json()),
      fetch('/api/accounts').then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ]);

    appData.metrics = summaryRes.metrics;
    appData.expenseByCategory = summaryRes.expenseByCategory;
    appData.invoices = invoicesRes;
    appData.bills = billsRes;
    appData.clients = clientsRes;
    appData.vendors = vendorsRes;
    appData.journal = journalRes;
    appData.accounts = accountsRes;
    appData.settings = settingsRes;

    // Update header & badges
    document.getElementById('headerCompanyName').textContent = appData.settings.companyName || 'Business Suite';
    document.getElementById('badgeInvoiceCount').textContent = appData.invoices.length;
    document.getElementById('badgeBillCount').textContent = appData.bills.length;

    // Mini sidebar balances
    const cashAcc = appData.accounts.find(a => a.code === "1000");
    document.getElementById('miniCashBalance').textContent = fmtCur(cashAcc ? cashAcc.balance : 0);
    document.getElementById('miniReceivables').textContent = fmtCur(appData.metrics.accountsReceivable || 0);
    document.getElementById('miniPayables').textContent = fmtCur(appData.metrics.accountsPayable || 0);

    // Refresh current view
    renderCurrentTab();
  } catch (err) {
    console.error('Failed to load accounting data:', err);
    showToast('Failed to connect to accounting server', true);
  }
}

// Tab Switching
function switchTab(tabId) {
  currentTab = tabId;
  const tabs = ['dashboard', 'invoices', 'bills', 'parties', 'ledger', 'reports', 'settings'];
  
  tabs.forEach(t => {
    const section = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (t === tabId) {
      section.classList.remove('hidden');
      if (btn) {
        btn.classList.add('text-sky-700', 'bg-sky-50');
        btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
      }
    } else {
      section.classList.add('hidden');
      if (btn) {
        btn.classList.remove('text-sky-700', 'bg-sky-50');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
      }
    }
  });

  renderCurrentTab();
  lucide.createIcons();
}

function renderCurrentTab() {
  switch (currentTab) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'invoices':
      renderInvoices();
      break;
    case 'bills':
      renderBills();
      break;
    case 'parties':
      renderParties();
      break;
    case 'ledger':
      renderLedger();
      break;
    case 'reports':
      renderReports();
      break;
    case 'settings':
      populateSettingsForm();
      break;
  }
}

// ----------------- 1. DASHBOARD -----------------
function renderDashboard() {
  const m = appData.metrics || {};
  document.getElementById('kpiRevenue').textContent = fmtCur(m.totalRevenue || 0);
  document.getElementById('kpiPaidRevenue').textContent = fmtCur(m.totalPaidRevenue || 0);
  document.getElementById('kpiExpenses').textContent = fmtCur(m.totalExpenses || 0);
  document.getElementById('kpiReceivables').textContent = fmtCur(m.accountsReceivable || 0);
  document.getElementById('kpiOverdueCount').textContent = `${m.overdueInvoicesCount || 0} overdue invoices`;
  document.getElementById('kpiNetIncome').textContent = fmtCur(m.netIncome || 0);

  // Recent invoices list
  const recentInvoicesEl = document.getElementById('recentInvoicesList');
  if (appData.invoices.length === 0) {
    recentInvoicesEl.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No invoices generated yet</div>`;
  } else {
    recentInvoicesEl.innerHTML = appData.invoices.slice(0, 5).map(inv => `
      <div class="p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer" onclick="viewPrintInvoice('${inv.id}')">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm text-slate-900">${inv.invoiceNumber}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(inv.status)}">${inv.status}</span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">${inv.clientName} &bull; Due ${inv.dueDate}</p>
        </div>
        <div class="text-right">
          <span class="font-bold text-sm text-slate-900">${fmtCur(inv.total)}</span>
          <p class="text-xs ${inv.balanceDue > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}">
            ${inv.balanceDue > 0 ? `Due: ${fmtCur(inv.balanceDue)}` : 'Fully Paid'}
          </p>
        </div>
      </div>
    `).join('');
  }

  // Recent bills list
  const recentBillsEl = document.getElementById('recentBillsList');
  if (appData.bills.length === 0) {
    recentBillsEl.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No bills recorded yet</div>`;
  } else {
    recentBillsEl.innerHTML = appData.bills.slice(0, 5).map(b => `
      <div class="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm text-slate-900">${b.billNumber}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${b.status === 'Paid' ? 'badge-paid' : 'badge-overdue'}">${b.status}</span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">${b.vendorName} &bull; ${b.category}</p>
        </div>
        <div class="text-right">
          <span class="font-bold text-sm text-slate-900">${fmtCur(b.total)}</span>
          ${b.status !== 'Paid' ? `
            <button onclick="payBill('${b.id}')" class="text-xs text-sky-600 hover:text-sky-800 font-semibold block mt-0.5">Pay Now &rarr;</button>
          ` : `<p class="text-xs text-slate-400 mt-0.5">Settled</p>`}
        </div>
      </div>
    `).join('');
  }

  // Update Charts
  initDashboardCharts();
}

function initDashboardCharts() {
  // Chart 1: Revenue vs Expense
  const ctx1 = document.getElementById('revExpenseChart');
  if (ctx1) {
    if (revExpenseChart) revExpenseChart.destroy();
    revExpenseChart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Current Month'],
        datasets: [
          {
            label: 'Invoiced Revenue',
            data: [6800, 8200, 9500, 11200, 13400, appData.metrics.totalRevenue || 17427],
            backgroundColor: '#0284c7',
            borderRadius: 6
          },
          {
            label: 'Expenses & Bills',
            data: [3200, 2900, 4100, 3800, 4600, appData.metrics.totalExpenses || 4630],
            backgroundColor: '#f43f5e',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        scales: {
          y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  // Chart 2: Category Breakdown
  const ctx2 = document.getElementById('expenseCategoryChart');
  if (ctx2) {
    if (expenseCategoryChart) expenseCategoryChart.destroy();
    const categories = Object.keys(appData.expenseByCategory || {});
    const values = Object.values(appData.expenseByCategory || {});

    expenseCategoryChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: categories.length ? categories : ['Rent', 'Software', 'Supplies'],
        datasets: [{
          data: values.length ? values : [3200, 850, 495],
          backgroundColor: ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
        },
        cutout: '70%'
      }
    });
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Paid': return 'badge-paid';
    case 'Partially Paid': return 'badge-partial';
    case 'Sent': return 'badge-sent';
    case 'Overdue': return 'badge-overdue';
    default: return 'badge-draft';
  }
}

// ----------------- 2. INVOICES MODULE -----------------
function renderInvoices() {
  const tbody = document.getElementById('invoicesTableBody');
  const search = (document.getElementById('invoiceSearchInput')?.value || '').toLowerCase();
  const filter = document.getElementById('invoiceStatusFilter')?.value || 'ALL';

  const filtered = appData.invoices.filter(inv => {
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(search) || inv.clientName.toLowerCase().includes(search);
    const matchFilter = filter === 'ALL' || inv.status === filter;
    return matchSearch && matchFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-xs text-slate-400">No matching invoices found</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(inv => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="py-3 px-4 font-bold text-slate-900">${inv.invoiceNumber}</td>
      <td class="py-3 px-4 font-medium text-slate-800">${inv.clientName}</td>
      <td class="py-3 px-4 text-xs text-slate-500">${inv.issueDate}</td>
      <td class="py-3 px-4 text-xs text-slate-500">${inv.dueDate}</td>
      <td class="py-3 px-4 text-right font-bold text-slate-900">${fmtCur(inv.total)}</td>
      <td class="py-3 px-4 text-right font-semibold ${inv.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}">
        ${fmtCur(inv.balanceDue)}
      </td>
      <td class="py-3 px-4 text-center">
        <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${getStatusBadgeClass(inv.status)}">${inv.status}</span>
      </td>
      <td class="py-3 px-4 text-right space-x-1">
        <button onclick="viewPrintInvoice('${inv.id}')" title="Print/PDF" class="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition inline-block">
          <i data-lucide="printer" class="w-4 h-4"></i>
        </button>
        ${inv.balanceDue > 0 ? `
          <button onclick="openPaymentModal('${inv.id}')" title="Record Payment" class="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition inline-block">
            <i data-lucide="dollar-sign" class="w-4 h-4"></i>
          </button>
        ` : ''}
        <button onclick="deleteInvoice('${inv.id}')" title="Delete Invoice" class="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition inline-block">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

// Open Invoice Form Modal
function openInvoiceModal() {
  document.getElementById('invFormId').value = '';
  document.getElementById('invFormNumber').value = (appData.settings.invoicePrefix || 'INV-2026-') + String(appData.invoices.length + 1).padStart(4, '0');
  
  const today = new Date().toISOString().split('T')[0];
  const due = new Date();
  due.setDate(due.getDate() + 30);

  document.getElementById('invFormIssueDate').value = today;
  document.getElementById('invFormDueDate').value = due.toISOString().split('T')[0];
  document.getElementById('invFormNotes').value = appData.settings.bankDetails || '';
  document.getElementById('invFormDiscount').value = '0';

  // Populate client dropdown
  const clientSelect = document.getElementById('invFormClientSelect');
  clientSelect.innerHTML = appData.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  // Clear and add 1 default line item
  const tbody = document.getElementById('invoiceItemsTableBody');
  tbody.innerHTML = '';
  addInvoiceItemRow('Professional Bookkeeping & Accounting Services', 1, 1500, 10);

  calculateInvoiceTotals();
  document.getElementById('invoiceModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeInvoiceModal() {
  document.getElementById('invoiceModal').classList.add('hidden');
}

function addInvoiceItemRow(description = '', qty = 1, rate = 0, taxRate = 10) {
  const tbody = document.getElementById('invoiceItemsTableBody');
  const tr = document.createElement('tr');
  tr.className = 'border-b border-slate-100 hover:bg-slate-50/50';
  tr.innerHTML = `
    <td class="p-2">
      <input type="text" class="item-desc w-full px-2 py-1 text-xs border border-slate-200 rounded-lg" value="${description}" placeholder="Description of service/goods" required>
    </td>
    <td class="p-2 text-center">
      <input type="number" min="1" step="0.5" class="item-qty w-16 text-center px-1.5 py-1 text-xs border border-slate-200 rounded-lg" value="${qty}" oninput="calculateInvoiceTotals()">
    </td>
    <td class="p-2 text-right">
      <input type="number" min="0" step="0.01" class="item-rate w-24 text-right px-1.5 py-1 text-xs border border-slate-200 rounded-lg" value="${rate}" oninput="calculateInvoiceTotals()">
    </td>
    <td class="p-2 text-center">
      <input type="number" min="0" max="100" step="1" class="item-tax w-14 text-center px-1 py-1 text-xs border border-slate-200 rounded-lg" value="${taxRate}" oninput="calculateInvoiceTotals()">
    </td>
    <td class="p-2 text-right font-bold text-slate-800 item-line-total text-xs">
      ${fmtCur(qty * rate)}
    </td>
    <td class="p-2 text-center">
      <button type="button" onclick="this.closest('tr').remove(); calculateInvoiceTotals();" class="text-rose-400 hover:text-rose-600 p-1">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  calculateInvoiceTotals();
  lucide.createIcons();
}

function calculateInvoiceTotals() {
  const rows = document.querySelectorAll('#invoiceItemsTableBody tr');
  let subtotal = 0;
  let totalTax = 0;

  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
    const taxRate = parseFloat(row.querySelector('.item-tax')?.value) || 0;
    const lineAmount = qty * rate;
    const lineTax = lineAmount * (taxRate / 100);

    const totalEl = row.querySelector('.item-line-total');
    if (totalEl) totalEl.textContent = fmtCur(lineAmount);

    subtotal += lineAmount;
    totalTax += lineTax;
  });

  const discount = parseFloat(document.getElementById('invFormDiscount')?.value) || 0;
  const grandTotal = Math.max(0, subtotal + totalTax - discount);

  document.getElementById('invCalcSubtotal').textContent = fmtCur(subtotal);
  document.getElementById('invCalcTax').textContent = fmtCur(totalTax);
  document.getElementById('invCalcGrandTotal').textContent = fmtCur(grandTotal);
}

async function submitInvoiceForm() {
  const clientId = document.getElementById('invFormClientSelect').value;
  const clientObj = appData.clients.find(c => c.id === clientId);
  if (!clientObj) {
    showToast('Please select a valid client', true);
    return;
  }

  const rows = document.querySelectorAll('#invoiceItemsTableBody tr');
  if (rows.length === 0) {
    showToast('Add at least one item row to the invoice', true);
    return;
  }

  const items = [];
  rows.forEach(row => {
    const desc = row.querySelector('.item-desc').value.trim();
    const qty = parseFloat(row.querySelector('.item-qty').value) || 1;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const taxRate = parseFloat(row.querySelector('.item-tax').value) || 0;
    if (desc) {
      items.push({ description: desc, qty, rate, taxRate, amount: qty * rate });
    }
  });

  if (items.length === 0) {
    showToast('Please provide descriptions for line items', true);
    return;
  }

  const payload = {
    invoiceNumber: document.getElementById('invFormNumber').value.trim(),
    clientId: clientObj.id,
    clientName: clientObj.name,
    issueDate: document.getElementById('invFormIssueDate').value,
    dueDate: document.getElementById('invFormDueDate').value,
    status: document.getElementById('invFormStatus').value,
    discountAmount: parseFloat(document.getElementById('invFormDiscount').value) || 0,
    notes: document.getElementById('invFormNotes').value.trim(),
    items
  };

  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Save failed');
    closeInvoiceModal();
    showToast(`Invoice ${payload.invoiceNumber} created successfully!`);
    await fetchAllData();
  } catch (err) {
    showToast('Failed to create invoice', true);
  }
}

async function deleteInvoice(id) {
  if (!confirm('Are you sure you want to delete this invoice?')) return;
  try {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    showToast('Invoice deleted');
    await fetchAllData();
  } catch (err) {
    showToast('Failed to delete invoice', true);
  }
}

// ----------------- INVOICE VIEW / PRINT MODAL -----------------
async function viewPrintInvoice(invId) {
  try {
    const res = await fetch(`/api/invoices/${invId}`);
    const inv = await res.json();
    const s = inv.settings || appData.settings;
    const client = inv.client || { name: inv.clientName, address: '', email: '', phone: '', taxId: '' };

    const statusBadge = document.getElementById('printModalStatus');
    statusBadge.textContent = inv.status;
    statusBadge.className = `px-2 py-0.5 text-xs rounded-full font-bold ${getStatusBadgeClass(inv.status)}`;

    const template = document.getElementById('invoicePrintTemplate');
    template.innerHTML = `
      <div class="space-y-6 text-slate-800">
        <!-- Header -->
        <div class="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <h1 class="text-2xl font-black tracking-tight text-slate-900">${s.companyName || 'Business Suite'}</h1>
            <p class="text-xs text-slate-500 mt-1">${s.address || ''}</p>
            <p class="text-xs text-slate-500">Tax ID: <strong>${s.taxId || 'N/A'}</strong></p>
            <p class="text-xs text-slate-500">Email: ${s.email || ''} | Phone: ${s.phone || ''}</p>
          </div>
          <div class="text-right">
            <span class="text-2xl font-bold uppercase tracking-widest text-sky-600 block">INVOICE</span>
            <span class="text-base font-bold text-slate-900">${inv.invoiceNumber}</span>
            <div class="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Issue Date: <strong>${inv.issueDate}</strong></p>
              <p>Due Date: <strong>${inv.dueDate}</strong></p>
            </div>
          </div>
        </div>

        <!-- Billed To & Summary -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
            <h4 class="font-bold text-slate-900 text-sm">${client.name}</h4>
            <p class="text-xs text-slate-600 mt-0.5">${client.address || 'Address on file'}</p>
            ${client.taxId ? `<p class="text-xs text-slate-500 mt-0.5">Tax/GST: ${client.taxId}</p>` : ''}
            ${client.email ? `<p class="text-xs text-slate-500 mt-0.5">${client.email} | ${client.phone || ''}</p>` : ''}
          </div>
          <div class="bg-sky-50/70 p-4 rounded-xl border border-sky-100 flex flex-col justify-center">
            <span class="text-xs font-bold text-sky-700 uppercase tracking-wider block">Total Amount Due</span>
            <span class="text-2xl font-black text-sky-950 mt-1">${fmtCur(inv.balanceDue)}</span>
            <span class="text-xs text-sky-800 mt-1">Total Invoiced: ${fmtCur(inv.total)} &bull; Paid: ${fmtCur(inv.paidAmount || 0)}</span>
          </div>
        </div>

        <!-- Line Items Table -->
        <div class="rounded-xl border border-slate-200 overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100/80 font-bold uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Item & Description</th>
                <th class="py-3 px-3 text-center">Qty</th>
                <th class="py-3 px-3 text-right">Unit Rate</th>
                <th class="py-3 px-3 text-center">Tax %</th>
                <th class="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${inv.items.map(item => `
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-800">${item.description}</td>
                  <td class="py-3 px-3 text-center">${item.qty}</td>
                  <td class="py-3 px-3 text-right">${fmtCur(item.rate)}</td>
                  <td class="py-3 px-3 text-center">${item.taxRate}%</td>
                  <td class="py-3 px-4 text-right font-bold text-slate-900">${fmtCur(item.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals & Payment Instructions -->
        <div class="grid grid-cols-2 gap-6 pt-2">
          <div class="text-xs text-slate-600 space-y-2">
            <h5 class="font-bold text-slate-800 uppercase tracking-wider">Payment Instructions</h5>
            <p class="whitespace-pre-line text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">${s.bankDetails || 'Contact accounts department for wire details.'}</p>
            ${inv.notes ? `<p class="italic text-slate-500">Note: ${inv.notes}</p>` : ''}
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 text-slate-600">
              <span>Subtotal:</span>
              <span class="font-bold text-slate-800">${fmtCur(inv.subtotal)}</span>
            </div>
            <div class="flex justify-between py-1 text-slate-600">
              <span>Tax / GST:</span>
              <span class="font-bold text-slate-800">${fmtCur(inv.taxAmount)}</span>
            </div>
            ${inv.discountAmount > 0 ? `
              <div class="flex justify-between py-1 text-slate-600">
                <span>Discount:</span>
                <span class="font-bold text-slate-800">-${fmtCur(inv.discountAmount)}</span>
              </div>
            ` : ''}
            <div class="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span>${fmtCur(inv.total)}</span>
            </div>
            <div class="flex justify-between text-xs font-semibold text-emerald-700">
              <span>Amount Paid:</span>
              <span>${fmtCur(inv.paidAmount || 0)}</span>
            </div>
            <div class="border-t-2 border-slate-900 pt-2 flex justify-between text-base font-black text-slate-900">
              <span>Balance Due:</span>
              <span class="${inv.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}">${fmtCur(inv.balanceDue)}</span>
            </div>
          </div>
        </div>

        <!-- Footer terms -->
        <div class="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
          <p>${s.paymentTermsNote || 'Thank you for your business!'}</p>
          <div class="text-center w-48 border-t border-slate-300 pt-1">
            <p class="font-semibold text-slate-600">Authorized Signatory</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('printModal').classList.remove('hidden');
    lucide.createIcons();
  } catch (err) {
    showToast('Failed to load invoice preview', true);
  }
}

function closePrintModal() {
  document.getElementById('printModal').classList.add('hidden');
}

// ----------------- PAYMENT MODAL -----------------
function openPaymentModal(invId) {
  const inv = appData.invoices.find(i => i.id === invId);
  if (!inv) return;

  document.getElementById('payInvoiceId').value = inv.id;
  document.getElementById('payInvoiceNumber').value = `${inv.invoiceNumber} - ${inv.clientName}`;
  document.getElementById('payRemainingBalance').textContent = fmtCur(inv.balanceDue);
  document.getElementById('payAmount').value = inv.balanceDue;
  document.getElementById('payDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('paymentModal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.add('hidden');
}

async function submitPaymentForm(e) {
  e.preventDefault();
  const invId = document.getElementById('payInvoiceId').value;
  const payload = {
    amount: parseFloat(document.getElementById('payAmount').value) || 0,
    date: document.getElementById('payDate').value,
    method: document.getElementById('payMethod').value,
    reference: document.getElementById('payReference').value.trim()
  };

  try {
    const res = await fetch(`/api/invoices/${invId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Payment failed');
    closePaymentModal();
    showToast(`Payment of ${fmtCur(payload.amount)} recorded!`);
    await fetchAllData();
  } catch (err) {
    showToast('Failed to record payment', true);
  }
}

// ----------------- 3. BILLS / EXPENSES MODULE -----------------
function renderBills() {
  const tbody = document.getElementById('billsTableBody');
  const search = (document.getElementById('billSearchInput')?.value || '').toLowerCase();
  const catFilter = document.getElementById('billCategoryFilter')?.value || 'ALL';
  const statusFilter = document.getElementById('billStatusFilter')?.value || 'ALL';

  const filtered = appData.bills.filter(b => {
    const matchSearch = b.billNumber.toLowerCase().includes(search) || b.vendorName.toLowerCase().includes(search) || b.category.toLowerCase().includes(search);
    const matchCat = catFilter === 'ALL' || b.category === catFilter;
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-xs text-slate-400">No matching expense bills found</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="py-3 px-4 font-bold text-slate-900">${b.billNumber}</td>
      <td class="py-3 px-4 font-medium text-slate-800">${b.vendorName}</td>
      <td class="py-3 px-4 text-xs font-semibold text-slate-600">
        <span class="px-2 py-0.5 bg-slate-100 rounded-md">${b.category}</span>
      </td>
      <td class="py-3 px-4 text-xs text-slate-500">${b.billDate}</td>
      <td class="py-3 px-4 text-xs text-slate-500">${b.dueDate}</td>
      <td class="py-3 px-4 text-right text-xs text-slate-500">${fmtCur(b.taxAmount)}</td>
      <td class="py-3 px-4 text-right font-bold text-slate-900">${fmtCur(b.total)}</td>
      <td class="py-3 px-4 text-center">
        <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${b.status === 'Paid' ? 'badge-paid' : 'badge-overdue'}">${b.status}</span>
      </td>
      <td class="py-3 px-4 text-right space-x-1">
        ${b.status !== 'Paid' ? `
          <button onclick="payBill('${b.id}')" title="Settle / Mark Paid" class="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-xs font-bold transition">
            Pay
          </button>
        ` : ''}
        <button onclick="deleteBill('${b.id}')" title="Delete Bill" class="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition inline-block">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

function openBillModal() {
  document.getElementById('billFormNumber').value = (appData.settings.billPrefix || 'BILL-2026-') + String(appData.bills.length + 1).padStart(4, '0');
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('billFormDate').value = today;
  document.getElementById('billFormDueDate').value = today;
  document.getElementById('billModal').classList.remove('hidden');
}

function closeBillModal() {
  document.getElementById('billModal').classList.add('hidden');
}

async function submitBillForm(e) {
  e.preventDefault();
  const payload = {
    billNumber: document.getElementById('billFormNumber').value.trim(),
    vendorName: document.getElementById('billFormVendor').value.trim(),
    category: document.getElementById('billFormCategory').value,
    status: document.getElementById('billFormStatus').value,
    billDate: document.getElementById('billFormDate').value,
    dueDate: document.getElementById('billFormDueDate').value,
    amount: parseFloat(document.getElementById('billFormAmount').value) || 0,
    taxAmount: parseFloat(document.getElementById('billFormTax').value) || 0,
    notes: document.getElementById('billFormNotes').value.trim()
  };

  try {
    const res = await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Save bill failed');
    closeBillModal();
    showToast(`Bill ${payload.billNumber} recorded`);
    await fetchAllData();
  } catch (err) {
    showToast('Failed to save bill', true);
  }
}

async function payBill(billId) {
  if (!confirm('Mark this vendor bill as Paid?')) return;
  try {
    await fetch(`/api/bills/${billId}/pay`, { method: 'PUT' });
    showToast('Vendor bill marked as Paid');
    await fetchAllData();
  } catch (err) {
    showToast('Failed to update bill', true);
  }
}

async function deleteBill(billId) {
  if (!confirm('Are you sure you want to delete this bill?')) return;
  try {
    await fetch(`/api/bills/${billId}`, { method: 'DELETE' });
    showToast('Bill removed');
    await fetchAllData();
  } catch (err) {
    showToast('Failed to delete bill', true);
  }
}

// ----------------- 4. CLIENTS & VENDORS MODULE -----------------
function setPartySubTab(tab) {
  currentPartySubTab = tab;
  const btnC = document.getElementById('subtab-btn-clients');
  const btnV = document.getElementById('subtab-btn-vendors');
  const btnAdd = document.getElementById('btnAddPartyText');

  if (tab === 'clients') {
    btnC.className = 'px-4 py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-sm transition';
    btnV.className = 'px-4 py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 transition';
    btnAdd.textContent = 'Add New Client';
  } else {
    btnV.className = 'px-4 py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-sm transition';
    btnC.className = 'px-4 py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 transition';
    btnAdd.textContent = 'Add New Vendor';
  }
  renderParties();
}

function renderParties() {
  const tbody = document.getElementById('partiesTableBody');
  const list = currentPartySubTab === 'clients' ? appData.clients : appData.vendors;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-xs text-slate-400">No records found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="py-3 px-4">
        <span class="font-bold text-slate-900 block">${item.name}</span>
        ${item.contactPerson ? `<span class="text-xs text-slate-500">${item.contactPerson}</span>` : ''}
      </td>
      <td class="py-3 px-4 text-xs font-mono text-slate-600">${item.taxId || 'N/A'}</td>
      <td class="py-3 px-4 text-xs text-slate-500">
        <div>${item.email || 'No email'}</div>
        <div>${item.phone || ''}</div>
      </td>
      <td class="py-3 px-4 text-right font-bold text-slate-900">${fmtCur(item.totalBilled || 0)}</td>
      <td class="py-3 px-4 text-right font-bold ${item.outstanding > 0 ? 'text-amber-600' : 'text-slate-400'}">
        ${fmtCur(item.outstanding || 0)}
      </td>
      <td class="py-3 px-4 text-right">
        <button onclick="deleteParty('${item.id}', '${currentPartySubTab}')" class="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition inline-block">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

function openPartyModal(forceType) {
  const type = forceType || (currentPartySubTab === 'clients' ? 'client' : 'vendor');
  document.getElementById('partyType').value = type;
  document.getElementById('partyModalTitle').textContent = type === 'client' ? 'Add New Client' : 'Add New Vendor';
  document.getElementById('partyForm').reset();
  document.getElementById('partyModal').classList.remove('hidden');
}

function closePartyModal() {
  document.getElementById('partyModal').classList.add('hidden');
}

async function submitPartyForm(e) {
  e.preventDefault();
  const type = document.getElementById('partyType').value;
  const endpoint = type === 'client' ? '/api/clients' : '/api/vendors';
  const payload = {
    name: document.getElementById('partyName').value.trim(),
    contactPerson: document.getElementById('partyContact').value.trim(),
    taxId: document.getElementById('partyTaxId').value.trim(),
    email: document.getElementById('partyEmail').value.trim(),
    phone: document.getElementById('partyPhone').value.trim(),
    address: document.getElementById('partyAddress').value.trim()
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed');
    closePartyModal();
    showToast(`${type === 'client' ? 'Client' : 'Vendor'} saved successfully!`);
    await fetchAllData();
  } catch (err) {
    showToast('Failed to save record', true);
  }
}

async function deleteParty(id, type) {
  if (!confirm(`Are you sure you want to delete this ${type === 'clients' ? 'client' : 'vendor'}?`)) return;
  const endpoint = type === 'clients' ? `/api/clients/${id}` : `/api/vendors/${id}`;
  try {
    await fetch(endpoint, { method: 'DELETE' });
    showToast('Record deleted');
    await fetchAllData();
  } catch (err) {
    showToast('Failed to delete', true);
  }
}

// ----------------- 5. GENERAL LEDGER & JOURNALS -----------------
function renderLedger() {
  // 1. Chart of Accounts pills
  const accountsGrid = document.getElementById('accountsGrid');
  accountsGrid.innerHTML = appData.accounts.map(acc => {
    let typeBg = 'bg-slate-100 text-slate-700';
    if (acc.type === 'Asset') typeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (acc.type === 'Liability') typeBg = 'bg-amber-50 text-amber-700 border-amber-200';
    else if (acc.type === 'Revenue') typeBg = 'bg-sky-50 text-sky-700 border-sky-200';
    else if (acc.type === 'Expense') typeBg = 'bg-rose-50 text-rose-700 border-rose-200';

    return `
      <div class="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span class="font-mono">${acc.code}</span>
          <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeBg}">${acc.type}</span>
        </div>
        <h5 class="font-bold text-slate-800 text-xs mt-1 truncate" title="${acc.name}">${acc.name}</h5>
        <p class="text-base font-black text-slate-900 mt-2">${fmtCur(acc.balance)}</p>
      </div>
    `;
  }).join('');

  // 2. Journal Entries
  const journalList = document.getElementById('journalEntriesList');
  if (appData.journal.length === 0) {
    journalList.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">No journal logs found</div>`;
    return;
  }

  journalList.innerHTML = [...appData.journal].reverse().map(je => `
    <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
        <div>
          <span class="font-bold text-sm text-slate-900">${je.entryNumber}</span>
          <span class="text-xs text-slate-500 ml-2">&bull; ${je.date}</span>
          <p class="text-xs font-semibold text-slate-700 mt-0.5">${je.description}</p>
        </div>
        ${je.reference ? `<span class="text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 self-start sm:self-auto">${je.reference}</span>` : ''}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="text-slate-400 uppercase text-[10px]">
            <tr>
              <th class="py-1 text-left">Account</th>
              <th class="py-1 text-right w-28">Debit</th>
              <th class="py-1 text-right w-28">Credit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            ${je.lines.map(line => `
              <tr>
                <td class="py-1.5 text-slate-800 flex items-center gap-2">
                  <span class="font-mono text-slate-400 text-[11px]">${line.accountCode || ''}</span>
                  <span>${line.accountName}</span>
                </td>
                <td class="py-1.5 text-right font-bold ${line.debit > 0 ? 'text-slate-900' : 'text-slate-300'}">
                  ${line.debit > 0 ? fmtCur(line.debit) : '-'}
                </td>
                <td class="py-1.5 text-right font-bold ${line.credit > 0 ? 'text-slate-900' : 'text-slate-300'}">
                  ${line.credit > 0 ? fmtCur(line.credit) : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');
}

// Journal Entry Modal
function openJournalModal() {
  document.getElementById('journalDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('journalReference').value = 'ADJ-' + String(appData.journal.length + 1).padStart(3, '0');
  document.getElementById('journalDescription').value = '';

  const tbody = document.getElementById('journalLinesBody');
  tbody.innerHTML = '';
  addJournalLine('1000', 'Cash & Operating Bank Account', 1000, 0);
  addJournalLine('3000', "Owner's Equity & Retained Earnings", 0, 1000);

  calculateJournalBalance();
  document.getElementById('journalModal').classList.remove('hidden');
}

function closeJournalModal() {
  document.getElementById('journalModal').classList.add('hidden');
}

function addJournalLine(code = '', name = '', debit = 0, credit = 0) {
  const tbody = document.getElementById('journalLinesBody');
  const tr = document.createElement('tr');
  tr.className = 'border-b border-slate-100';

  const options = appData.accounts.map(a => `<option value="${a.code}|${a.name}" ${a.code === code ? 'selected' : ''}>${a.code} - ${a.name}</option>`).join('');

  tr.innerHTML = `
    <td class="p-2">
      <select class="je-account w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white">
        ${options}
      </select>
    </td>
    <td class="p-2 text-right">
      <input type="number" step="0.01" min="0" class="je-debit w-24 text-right px-2 py-1 text-xs border border-slate-200 rounded-lg" value="${debit}" oninput="calculateJournalBalance()">
    </td>
    <td class="p-2 text-right">
      <input type="number" step="0.01" min="0" class="je-credit w-24 text-right px-2 py-1 text-xs border border-slate-200 rounded-lg" value="${credit}" oninput="calculateJournalBalance()">
    </td>
    <td class="p-2 text-center">
      <button type="button" onclick="this.closest('tr').remove(); calculateJournalBalance();" class="text-rose-400 hover:text-rose-600 p-1">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  calculateJournalBalance();
  lucide.createIcons();
}

function calculateJournalBalance() {
  const rows = document.querySelectorAll('#journalLinesBody tr');
  let totalDebits = 0;
  let totalCredits = 0;

  rows.forEach(r => {
    const d = parseFloat(r.querySelector('.je-debit')?.value) || 0;
    const c = parseFloat(r.querySelector('.je-credit')?.value) || 0;
    totalDebits += d;
    totalCredits += c;
  });

  document.getElementById('journalTotalDebits').textContent = fmtCur(totalDebits);
  document.getElementById('journalTotalCredits').textContent = fmtCur(totalCredits);

  const statusEl = document.getElementById('journalBalanceStatus');
  const submitBtn = document.getElementById('btnSubmitJournal');
  const banner = document.getElementById('journalBalanceBanner');

  const diff = Math.abs(totalDebits - totalCredits);
  if (diff < 0.01 && totalDebits > 0) {
    statusEl.textContent = 'Balanced (Debits = Credits)';
    statusEl.className = 'font-bold text-emerald-600';
    banner.className = 'p-3 rounded-xl flex items-center justify-between text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800';
    submitBtn.disabled = false;
  } else {
    statusEl.textContent = `Unbalanced: Difference is ${fmtCur(diff)}`;
    statusEl.className = 'font-bold text-rose-600';
    banner.className = 'p-3 rounded-xl flex items-center justify-between text-xs font-medium bg-rose-50 border border-rose-200 text-rose-800';
    submitBtn.disabled = true;
  }
}

async function submitJournalForm(e) {
  e.preventDefault();
  const rows = document.querySelectorAll('#journalLinesBody tr');
  const lines = [];

  rows.forEach(r => {
    const accVal = r.querySelector('.je-account').value.split('|');
    const debit = parseFloat(r.querySelector('.je-debit').value) || 0;
    const credit = parseFloat(r.querySelector('.je-credit').value) || 0;
    if (debit > 0 || credit > 0) {
      lines.push({ accountCode: accVal[0], accountName: accVal[1], debit, credit });
    }
  });

  const payload = {
    date: document.getElementById('journalDate').value,
    reference: document.getElementById('journalReference').value.trim(),
    description: document.getElementById('journalDescription').value.trim(),
    lines
  };

  try {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Posting failed');
    closeJournalModal();
    showToast('Journal Entry posted to General Ledger');
    await fetchAllData();
  } catch (err) {
    showToast('Failed to post journal entry', true);
  }
}

// ----------------- 6. FINANCIAL REPORTS MODULE -----------------
function setReportType(type) {
  currentReportType = type;
  ['pnl', 'tax', 'balance'].forEach(t => {
    const btn = document.getElementById(`rep-btn-${t}`);
    if (t === type) {
      btn.className = 'pb-3 text-sm font-bold text-sky-600 border-b-2 border-sky-600 transition';
    } else {
      btn.className = 'pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition';
    }
  });
  renderReports();
}

async function renderReports() {
  const container = document.getElementById('reportContainer');
  container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">Loading statement...</div>`;

  if (currentReportType === 'pnl') {
    const res = await fetch('/api/reports/pnl');
    const data = await res.json();

    container.innerHTML = `
      <div class="space-y-6 max-w-3xl">
        <div class="border-b border-slate-200 pb-4">
          <h4 class="text-lg font-bold text-slate-900">Profit & Loss Statement (Income Statement)</h4>
          <p class="text-xs text-slate-500">For the period ending today &bull; Accrual Accounting Method</p>
        </div>

        <!-- Revenue Section -->
        <div class="space-y-2">
          <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue</h5>
          <div class="flex justify-between py-2 border-b border-slate-100 text-sm">
            <span class="text-slate-700">Gross Invoiced Revenue</span>
            <span class="font-bold text-slate-900">${fmtCur(data.grossRevenue)}</span>
          </div>
          ${data.discountsGiven > 0 ? `
            <div class="flex justify-between py-2 border-b border-slate-100 text-sm text-rose-600">
              <span>Less: Sales Discounts Allowed</span>
              <span class="font-bold">-${fmtCur(data.discountsGiven)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between py-2 bg-slate-50 px-3 rounded-lg font-bold text-sm text-slate-900">
            <span>Net Revenue</span>
            <span class="text-emerald-700">${fmtCur(data.netRevenue)}</span>
          </div>
        </div>

        <!-- Expenses Section -->
        <div class="space-y-2">
          <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Operating Expenses</h5>
          ${Object.entries(data.expenseBreakdown).map(([cat, amt]) => `
            <div class="flex justify-between py-1.5 border-b border-slate-100 text-xs text-slate-600">
              <span>${cat}</span>
              <span class="font-semibold text-slate-800">${fmtCur(amt)}</span>
            </div>
          `).join('')}
          <div class="flex justify-between py-2 bg-slate-50 px-3 rounded-lg font-bold text-sm text-slate-900">
            <span>Total Operating Expenses</span>
            <span class="text-rose-700">${fmtCur(data.totalExpenses)}</span>
          </div>
        </div>

        <!-- Net Profit -->
        <div class="p-5 rounded-2xl ${data.netProfit >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'} flex items-center justify-between">
          <div>
            <h5 class="font-black text-slate-900 text-base">Net Operating Profit</h5>
            <p class="text-xs ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}">Operating Profit Margin: <strong>${data.netMargin}%</strong></p>
          </div>
          <span class="text-2xl font-black ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${fmtCur(data.netProfit)}</span>
        </div>
      </div>
    `;
  } else if (currentReportType === 'tax') {
    const res = await fetch('/api/reports/tax');
    const data = await res.json();

    container.innerHTML = `
      <div class="space-y-6 max-w-3xl">
        <div class="border-b border-slate-200 pb-4">
          <h4 class="text-lg font-bold text-slate-900">Sales Tax / GST Liability Summary</h4>
          <p class="text-xs text-slate-500">Output tax on sales less input tax credits on operational bills</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-4 rounded-xl border border-slate-200 bg-white">
            <span class="text-xs font-bold text-slate-400 uppercase">Output Tax (Invoices)</span>
            <h5 class="text-xl font-bold text-slate-900 mt-2">${fmtCur(data.outputTax)}</h5>
            <p class="text-[11px] text-slate-500 mt-1">Tax collected from clients</p>
          </div>
          <div class="p-4 rounded-xl border border-slate-200 bg-white">
            <span class="text-xs font-bold text-slate-400 uppercase">Input Tax Credit (Bills)</span>
            <h5 class="text-xl font-bold text-slate-900 mt-2">${fmtCur(data.inputTaxCredit)}</h5>
            <p class="text-[11px] text-slate-500 mt-1">Tax paid on purchases</p>
          </div>
          <div class="p-4 rounded-xl border border-sky-200 bg-sky-50">
            <span class="text-xs font-bold text-sky-800 uppercase">Net Tax Payable</span>
            <h5 class="text-xl font-bold text-sky-900 mt-2">${fmtCur(data.netTaxPayable)}</h5>
            <p class="text-[11px] text-sky-700 mt-1">Remittance due to tax authority</p>
          </div>
        </div>
      </div>
    `;
  } else if (currentReportType === 'balance') {
    const res = await fetch('/api/reports/balance-sheet');
    const data = await res.json();

    container.innerHTML = `
      <div class="space-y-6 max-w-3xl">
        <div class="border-b border-slate-200 pb-4">
          <h4 class="text-lg font-bold text-slate-900">Balance Sheet Overview</h4>
          <p class="text-xs text-slate-500">Assets = Liabilities + Owner's Equity</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Assets -->
          <div class="space-y-2">
            <h5 class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Assets</h5>
            ${data.assets.map(a => `
              <div class="flex justify-between py-1.5 border-b border-slate-100 text-xs">
                <span class="text-slate-700">${a.name}</span>
                <span class="font-bold text-slate-900">${fmtCur(a.balance)}</span>
              </div>
            `).join('')}
            <div class="flex justify-between py-2 bg-emerald-50 px-3 rounded-lg font-bold text-sm text-emerald-900">
              <span>Total Assets</span>
              <span>${fmtCur(data.totalAssets)}</span>
            </div>
          </div>

          <!-- Liabilities & Equity -->
          <div class="space-y-4">
            <div class="space-y-2">
              <h5 class="text-xs font-bold text-amber-700 uppercase tracking-wider">Liabilities</h5>
              ${data.liabilities.map(l => `
                <div class="flex justify-between py-1.5 border-b border-slate-100 text-xs">
                  <span class="text-slate-700">${l.name}</span>
                  <span class="font-bold text-slate-900">${fmtCur(l.balance)}</span>
                </div>
              `).join('')}
              <div class="flex justify-between py-2 bg-amber-50 px-3 rounded-lg font-bold text-sm text-amber-900">
                <span>Total Liabilities</span>
                <span>${fmtCur(data.totalLiabilities)}</span>
              </div>
            </div>

            <div class="space-y-2">
              <h5 class="text-xs font-bold text-indigo-700 uppercase tracking-wider">Equity</h5>
              ${data.equity.map(e => `
                <div class="flex justify-between py-1.5 border-b border-slate-100 text-xs">
                  <span class="text-slate-700">${e.name}</span>
                  <span class="font-bold text-slate-900">${fmtCur(e.balance)}</span>
                </div>
              `).join('')}
              <div class="flex justify-between py-2 bg-indigo-50 px-3 rounded-lg font-bold text-sm text-indigo-900">
                <span>Total Liabilities & Equity</span>
                <span>${fmtCur(data.totalLiabilities + data.totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// ----------------- 7. SETTINGS MODULE -----------------
function populateSettingsForm() {
  const s = appData.settings || {};
  document.getElementById('setCompanyName').value = s.companyName || '';
  document.getElementById('setTaxId').value = s.taxId || '';
  document.getElementById('setEmail').value = s.email || '';
  document.getElementById('setPhone').value = s.phone || '';
  document.getElementById('setAddress').value = s.address || '';
  document.getElementById('setCurrency').value = s.currency || '$';
  document.getElementById('setInvoicePrefix').value = s.invoicePrefix || 'INV-2026-';
  document.getElementById('setBankDetails').value = s.bankDetails || '';
  document.getElementById('setPaymentTerms').value = s.paymentTermsNote || '';
}

async function saveCompanySettings(e) {
  e.preventDefault();
  const payload = {
    companyName: document.getElementById('setCompanyName').value.trim(),
    taxId: document.getElementById('setTaxId').value.trim(),
    email: document.getElementById('setEmail').value.trim(),
    phone: document.getElementById('setPhone').value.trim(),
    address: document.getElementById('setAddress').value.trim(),
    currency: document.getElementById('setCurrency').value.trim() || '$',
    invoicePrefix: document.getElementById('setInvoicePrefix').value.trim() || 'INV-2026-',
    bankDetails: document.getElementById('setBankDetails').value.trim(),
    paymentTermsNote: document.getElementById('setPaymentTerms').value.trim()
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Settings save failed');
    showToast('Company settings updated');
    await fetchAllData();
  } catch (err) {
    showToast('Failed to save settings', true);
  }
}

async function resetToSampleData() {
  if (!confirm('Reset all invoices, bills, and accounting records to sample data? Any unsaved edits will be refreshed.')) return;
  try {
    await fetch('/api/reset', { method: 'POST' });
    showToast('Demo data reloaded');
    await fetchAllData();
  } catch (err) {
    showToast('Reset failed', true);
  }
}

// ----------------- EXPORT TO CSV -----------------
function exportInvoicesCSV() {
  const headers = ['Invoice #', 'Client Name', 'Issue Date', 'Due Date', 'Status', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance Due'];
  const rows = appData.invoices.map(i => [
    i.invoiceNumber,
    `"${i.clientName.replace(/"/g, '""')}"`,
    i.issueDate,
    i.dueDate,
    i.status,
    i.subtotal,
    i.taxAmount,
    i.total,
    i.paidAmount || 0,
    i.balanceDue
  ]);
  downloadCSV('invoices.csv', [headers, ...rows]);
}

function exportBillsCSV() {
  const headers = ['Bill #', 'Vendor', 'Category', 'Bill Date', 'Due Date', 'Status', 'Amount', 'Tax', 'Total', 'Paid', 'Balance Due'];
  const rows = appData.bills.map(b => [
    b.billNumber,
    `"${b.vendorName.replace(/"/g, '""')}"`,
    `"${b.category}"`,
    b.billDate,
    b.dueDate,
    b.status,
    b.amount,
    b.taxAmount,
    b.total,
    b.paidAmount || 0,
    b.balanceDue
  ]);
  downloadCSV('bills_expenses.csv', [headers, ...rows]);
}

function downloadCSV(filename, data) {
  const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
