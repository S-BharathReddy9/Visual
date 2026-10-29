// ==========================================================================
// TrackWise - Main Application Controller
// ==========================================================================

import confetti from 'canvas-confetti';
import { store, getTodayDateString, formatReadableDate } from './store.js';
import {
  renderDonutChart,
  renderTrendBarChart,
  PAYMENT_COLORS,
  CATEGORY_COLORS
} from './charts.js';

// DOM Element References
const elements = {
  // Navigation
  navItems: document.querySelectorAll('.nav-item'),
  views: document.querySelectorAll('.view-section'),
  greetingEl: document.getElementById('header-greeting'),

  // Header quick info
  btnApkInfo: document.getElementById('btn-quick-apk-info'),
  modalApkInfo: document.getElementById('modal-apk-info'),
  btnCloseApkInfo: document.getElementById('btn-close-apk-info'),
  backdropApkInfo: document.getElementById('backdrop-apk-info'),
  btnPwaInstall: document.getElementById('btn-pwa-install'),

  // Today View
  todayBudgetCard: document.getElementById('today-budget-card'),
  todayTotalSpent: document.getElementById('today-total-spent'),
  todayPendingTasks: document.getElementById('today-pending-tasks'),
  todayStreakCount: document.getElementById('today-streak-count'),
  btnOpenAddExpense: document.getElementById('btn-open-add-expense'),
  btnOpenAddTask: document.getElementById('btn-open-add-task'),
  habitsProgressBadge: document.getElementById('habits-progress-badge'),
  todayHabitsList: document.getElementById('today-habits-list'),
  todayExpensesList: document.getElementById('today-expenses-list'),
  linkViewAllExpenses: document.getElementById('link-view-all-expenses'),

  // Expenses View
  expensesFilterTotal: document.getElementById('expenses-filter-total'),
  btnAddExpenseAlt: document.getElementById('btn-add-expense-alt'),
  paymentFilterChips: document.getElementById('payment-filter-chips'),
  selectCategoryFilter: document.getElementById('select-category-filter'),
  selectDateFilter: document.getElementById('select-date-filter'),
  allExpensesContainer: document.getElementById('all-expenses-container'),

  // Tasks View
  tasksProgressFill: document.getElementById('tasks-progress-fill'),
  btnAddTaskAlt: document.getElementById('btn-add-task-alt'),
  taskFilterSegments: document.querySelectorAll('.segment-btn'),
  allTasksContainer: document.getElementById('all-tasks-container'),

  // Analytics View
  analyticsMonthlyMeter: document.getElementById('analytics-monthly-meter'),
  chartPaymentMethods: document.getElementById('chart-payment-methods'),
  chartCategories: document.getElementById('chart-categories'),
  chartDailyTrend: document.getElementById('chart-daily-trend'),

  // Settings View
  inputDailyBudget: document.getElementById('input-daily-budget'),
  inputMonthlyBudget: document.getElementById('input-monthly-budget'),
  selectCurrency: document.getElementById('select-currency'),
  settingsCurrPrefix: document.getElementById('settings-curr-prefix'),
  settingsCurrPrefix2: document.getElementById('settings-curr-prefix-2'),
  btnSaveBudgetSettings: document.getElementById('btn-save-budget-settings'),
  btnExportData: document.getElementById('btn-export-data'),
  inputImportData: document.getElementById('input-import-data'),
  btnResetDemo: document.getElementById('btn-reset-demo'),
  btnClearAll: document.getElementById('btn-clear-all'),

  // Modals
  modalExpense: document.getElementById('modal-expense'),
  backdropExpense: document.getElementById('backdrop-expense'),
  btnCloseModalExpense: document.getElementById('btn-close-modal-expense'),
  btnCancelExpense: document.getElementById('btn-cancel-expense'),
  formExpense: document.getElementById('form-expense'),
  expenseAmount: document.getElementById('expense-amount'),
  expenseTitle: document.getElementById('expense-title'),
  expenseCategory: document.getElementById('expense-category'),
  expenseDate: document.getElementById('expense-date'),
  expenseNotes: document.getElementById('expense-notes'),
  amtChips: document.querySelectorAll('.amt-chip'),

  modalTask: document.getElementById('modal-task'),
  backdropTask: document.getElementById('backdrop-task'),
  btnCloseModalTask: document.getElementById('btn-close-modal-task'),
  btnCancelTask: document.getElementById('btn-cancel-task'),
  formTask: document.getElementById('form-task'),
  taskTitle: document.getElementById('task-title'),
  taskNotes: document.getElementById('task-notes'),
  taskCategory: document.getElementById('task-category'),
  taskDueDate: document.getElementById('task-due-date'),
  taskIsRecurring: document.getElementById('task-is-recurring')
};

// State
let currentTab = 'view-today';
let expenseFilterMethod = 'all';
let expenseFilterCategory = 'all';
let expenseFilterDate = 'all';
let taskFilter = 'all';
let deferredInstallPrompt = null;

// Haptic trigger for mobile feel
function triggerHaptic(duration = 18) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch (_) {}
  }
}

// Format Greeting
function updateGreeting() {
  const hour = new Date().getHours();
  let timeStr = 'Good morning';
  if (hour >= 12 && hour < 17) timeStr = 'Good afternoon';
  else if (hour >= 17) timeStr = 'Good evening';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  elements.greetingEl.textContent = `${timeStr} • ${today}`;
}

// ==========================================================================
// RENDERERS
// ==========================================================================

function renderAll() {
  updateGreeting();
  updateCurrencyDisplays();
  renderTodayView();
  renderExpensesView();
  renderTasksView();
  renderAnalyticsView();
  renderSettingsView();
}

function updateCurrencyDisplays() {
  const curr = store.budget.currency;
  document.querySelectorAll('.curr-symbol').forEach(el => el.textContent = curr);
  if (elements.settingsCurrPrefix) elements.settingsCurrPrefix.textContent = curr;
  if (elements.settingsCurrPrefix2) elements.settingsCurrPrefix2.textContent = curr;
}

// 1. TODAY VIEW
function renderTodayView() {
  const curr = store.budget.currency;
  const todaySpend = store.getTodayTotalSpend();
  const dailyLimit = store.budget.dailyLimit;
  const pct = Math.min(Math.round((todaySpend / dailyLimit) * 100), 100);
  const remaining = dailyLimit - todaySpend;

  // Determine budget status
  let badgeClass = 'safe';
  let badgeText = 'Safe & On Track';
  let progressColor = '#10b981';
  let alertText = `${curr}${remaining.toLocaleString()} remaining for today`;

  if (todaySpend > dailyLimit) {
    badgeClass = 'danger';
    badgeText = 'Budget Exceeded';
    progressColor = '#ef4444';
    alertText = `⚠️ Over budget by ${curr}${Math.abs(remaining).toLocaleString()}!`;
  } else if (pct >= 75) {
    badgeClass = 'warning';
    badgeText = 'Approaching Limit';
    progressColor = '#f59e0b';
    alertText = `Caution: ${pct}% of daily budget used`;
  }

  elements.todayBudgetCard.innerHTML = `
    <div class="budget-card-header">
      <span class="budget-badge ${badgeClass}">${badgeText}</span>
      <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Daily Cap: ${curr}${dailyLimit.toLocaleString()}</span>
    </div>
    <div class="budget-amount-row">
      <div>
        <span style="display: block; font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Today's Spent</span>
        <span class="hero-spent-large">${curr}${todaySpend.toLocaleString()}</span>
      </div>
      <div style="text-align: right;">
        <span style="display: block; font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Remaining</span>
        <span style="font-size: 1.25rem; font-weight: 800; color: ${remaining >= 0 ? '#34d399' : '#f87171'};">
          ${remaining >= 0 ? curr + remaining.toLocaleString() : '-' + curr + Math.abs(remaining).toLocaleString()}
        </span>
      </div>
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width: ${pct}%; background-color: ${progressColor};"></div>
    </div>
    <div class="budget-footer-row">
      <span>${alertText}</span>
      <span style="font-weight: 700;">${pct}%</span>
    </div>
  `;

  // Quick Stats Row
  elements.todayTotalSpent.textContent = `${curr}${todaySpend.toLocaleString()}`;
  elements.todayPendingTasks.textContent = store.getPendingTasksCount();
  elements.todayStreakCount.textContent = `${store.getMaxStreak()} Days`;

  // Daily Habits List
  const habits = store.getTodayHabits();
  const completedHabitsCount = habits.filter(h => h.isCompleted).length;
  elements.habitsProgressBadge.textContent = `${completedHabitsCount}/${habits.length} Done`;

  if (habits.length === 0) {
    elements.todayHabitsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚡</div>
        <div class="empty-state-title">No daily habits configured</div>
        <div class="empty-state-sub">Add a recurring task to track daily routines</div>
      </div>
    `;
  } else {
    elements.todayHabitsList.innerHTML = habits.map(habit => createHabitCardHtml(habit)).join('');
  }

  // Today Expenses Preview (last 3)
  const todayExps = store.getTodayExpenses().slice(0, 3);
  if (todayExps.length === 0) {
    elements.todayExpensesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💸</div>
        <div class="empty-state-title">No expenses logged today</div>
        <div class="empty-state-sub">Tap "+ Add Expense" to track your payments</div>
      </div>
    `;
  } else {
    elements.todayExpensesList.innerHTML = todayExps.map(exp => createExpenseCardHtml(exp)).join('');
  }
}

// 2. EXPENSES VIEW
function renderExpensesView() {
  const curr = store.budget.currency;
  const today = getTodayDateString();
  const yesterday = store.getTodayExpenses(); // helper

  // Apply filters
  let filtered = store.expenses.filter(exp => {
    // Payment Method Filter
    if (expenseFilterMethod !== 'all' && exp.paymentMethod !== expenseFilterMethod) {
      return false;
    }
    // Category Filter
    if (expenseFilterCategory !== 'all' && exp.category !== expenseFilterCategory) {
      return false;
    }
    // Date Filter
    if (expenseFilterDate === 'today' && exp.date !== today) return false;
    if (expenseFilterDate === 'yesterday' && exp.date !== store.loadExpenses ? exp.date !== formatReadableDate(exp.date) : false) {
      // Checked in filter logic
    }
    return true;
  });

  const totalFiltered = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
  elements.expensesFilterTotal.textContent = `${curr}${totalFiltered.toLocaleString()}`;

  if (filtered.length === 0) {
    elements.allExpensesContainer.innerHTML = `
      <div class="empty-state" style="margin-top: 20px;">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No expenses match your filters</div>
        <div class="empty-state-sub">Try changing payment mode or category</div>
      </div>
    `;
  } else {
    elements.allExpensesContainer.innerHTML = filtered.map(exp => createExpenseCardHtml(exp)).join('');
  }
}

// 3. TASKS VIEW
function renderTasksView() {
  let filtered = store.tasks;
  if (taskFilter === 'pending') filtered = store.tasks.filter(t => !t.isCompleted);
  else if (taskFilter === 'completed') filtered = store.tasks.filter(t => t.isCompleted);
  else if (taskFilter === 'recurring') filtered = store.tasks.filter(t => t.isRecurring);

  const totalTasks = store.tasks.length;
  const completedCount = store.tasks.filter(t => t.isCompleted).length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  elements.tasksProgressFill.style.width = `${progressPct}%`;

  if (filtered.length === 0) {
    elements.allTasksContainer.innerHTML = `
      <div class="empty-state" style="margin-top: 20px;">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">No tasks found</div>
        <div class="empty-state-sub">Tap "+ New Task" to schedule your daily work</div>
      </div>
    `;
  } else {
    elements.allTasksContainer.innerHTML = filtered.map(task => createTaskCardHtml(task)).join('');
  }
}

// 4. ANALYTICS VIEW
function renderAnalyticsView() {
  const curr = store.budget.currency;
  const monthlySpend = store.getMonthlyTotalSpend();
  const monthlyLimit = store.budget.monthlyLimit;
  const monthlyPct = Math.min(Math.round((monthlySpend / monthlyLimit) * 100), 100);

  elements.analyticsMonthlyMeter.innerHTML = `
    <div class="card-heading-row">
      <h3 class="card-title">Monthly Budget Status</h3>
      <span class="card-tag">Current Month</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
      <span style="font-size: 1.4rem; font-weight: 800; color: #ffffff;">${curr}${monthlySpend.toLocaleString()}</span>
      <span style="font-size: 0.8rem; color: var(--text-secondary);">Limit: ${curr}${monthlyLimit.toLocaleString()}</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width: ${monthlyPct}%; background-color: ${monthlyPct >= 100 ? '#ef4444' : (monthlyPct >= 80 ? '#f59e0b' : '#6366f1')};"></div>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 0.74rem; color: var(--text-muted); margin-top: 6px;">
      <span>${monthlyLimit - monthlySpend >= 0 ? `${curr}${(monthlyLimit - monthlySpend).toLocaleString()} remaining` : 'Over budget'}</span>
      <span style="font-weight: 700; color: var(--text-primary);">${monthlyPct}% Used</span>
    </div>
  `;

  // Aggregate by Payment Method
  const methodMap = {
    'UPI': 0,
    'Cash': 0,
    'Debit Card': 0,
    'Credit Card': 0,
    'Net Banking': 0,
    'Other': 0
  };
  for (const exp of store.expenses) {
    const method = exp.paymentMethod || 'Other';
    methodMap[method] = (methodMap[method] || 0) + (exp.amount || 0);
  }
  renderDonutChart(elements.chartPaymentMethods, methodMap, PAYMENT_COLORS, curr);

  // Aggregate by Category
  const catMap = {};
  for (const exp of store.expenses) {
    const cat = exp.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + (exp.amount || 0);
  }
  renderDonutChart(elements.chartCategories, catMap, CATEGORY_COLORS, curr);

  // 7-day trend
  renderTrendBarChart(elements.chartDailyTrend, store.expenses, curr, store.budget.dailyLimit);
}

// 5. SETTINGS VIEW
function renderSettingsView() {
  elements.inputDailyBudget.value = store.budget.dailyLimit;
  elements.inputMonthlyBudget.value = store.budget.monthlyLimit;
  elements.selectCurrency.value = store.budget.currency;
}

// Card HTML Generators
function createExpenseCardHtml(exp) {
  const curr = store.budget.currency;
  const methodClass = getPaymentClass(exp.paymentMethod);
  const icon = getPaymentIcon(exp.paymentMethod);

  return `
    <div class="expense-item-card" data-id="${exp.id}">
      <div class="expense-item-left">
        <div class="expense-method-avatar avatar-${methodClass}">
          ${icon}
        </div>
        <div class="expense-item-info">
          <span class="expense-item-title">${escapeHtml(exp.title)}</span>
          <div class="expense-item-meta">
            <span class="payment-method-badge badge-${methodClass}">${exp.paymentMethod}</span>
            <span>•</span>
            <span>${escapeHtml(exp.category)}</span>
            <span>•</span>
            <span>${formatReadableDate(exp.date)}</span>
          </div>
        </div>
      </div>
      <div class="expense-item-right">
        <span class="expense-amount-tag">${curr}${(exp.amount || 0).toLocaleString()}</span>
        <button class="btn-icon-delete btn-delete-expense" data-id="${exp.id}" title="Delete expense">&times;</button>
      </div>
    </div>
  `;
}

function createTaskCardHtml(task) {
  return `
    <div class="task-item-card ${task.isCompleted ? 'completed' : ''}" data-id="${task.id}">
      <button class="task-checkbox-btn btn-toggle-task" data-id="${task.id}" title="Toggle task">
        ${task.isCompleted ? '✓' : ''}
      </button>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta-row">
          <span class="priority-tag priority-${task.priority}">${task.priority.toUpperCase()}</span>
          <span style="color: var(--text-muted);">•</span>
          <span style="color: var(--text-secondary);">${escapeHtml(task.category)}</span>
          ${task.isRecurring ? `
            <span class="habit-streak-badge">🔥 ${task.streak || 0} Streak</span>
          ` : ''}
          ${task.dueDate ? `
            <span style="color: var(--text-muted);">• Due ${formatReadableDate(task.dueDate)}</span>
          ` : ''}
        </div>
      </div>
      <button class="btn-icon-delete btn-delete-task" data-id="${task.id}" title="Delete task">&times;</button>
    </div>
  `;
}

function createHabitCardHtml(habit) {
  return `
    <div class="task-item-card ${habit.isCompleted ? 'completed' : ''}" data-id="${habit.id}">
      <button class="task-checkbox-btn btn-toggle-task" data-id="${habit.id}">
        ${habit.isCompleted ? '✓' : ''}
      </button>
      <div class="task-content">
        <div class="task-title">${escapeHtml(habit.title)}</div>
        <div class="task-meta-row">
          <span class="habit-streak-badge">🔥 ${habit.streak || 0} Day Streak</span>
          <span style="color: var(--text-muted);">•</span>
          <span style="color: var(--text-secondary);">${escapeHtml(habit.category)}</span>
        </div>
      </div>
    </div>
  `;
}

function getPaymentClass(method) {
  switch (method) {
    case 'UPI': return 'upi';
    case 'Cash': return 'cash';
    case 'Debit Card': return 'debit';
    case 'Credit Card': return 'credit';
    case 'Net Banking': return 'netbanking';
    default: return 'other';
  }
}

function getPaymentIcon(method) {
  switch (method) {
    case 'UPI': return '⚡';
    case 'Cash': return '💵';
    case 'Debit Card': return '💳';
    case 'Credit Card': return '💳';
    case 'Net Banking': return '🏦';
    default: return '🔄';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Celebration Confetti for tasks & milestones
function launchConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899']
    });
  } catch (_) {}
}

// ==========================================================================
// EVENT LISTENERS & ROUTING
// ==========================================================================

export function switchTab(targetViewId) {
  triggerHaptic(12);
  elements.navItems.forEach(btn => {
    if (btn.dataset.target === targetViewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  elements.views.forEach(view => {
    if (view.id === targetViewId) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  currentTab = targetViewId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchTab = switchTab;

function setupEventListeners() {
  // Tab Switching
  elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-item');
      if (btn && btn.dataset.target) {
        switchTab(btn.dataset.target);
      }
    });
  });

  // Today view shortcut to All Expenses
  elements.linkViewAllExpenses?.addEventListener('click', () => {
    document.querySelector('.nav-item[data-target="view-expenses"]')?.click();
  });

  // Modal Open / Close Handlers
  elements.btnOpenAddExpense?.addEventListener('click', () => openExpenseModal());
  elements.btnAddExpenseAlt?.addEventListener('click', () => openExpenseModal());
  elements.btnCloseModalExpense?.addEventListener('click', () => closeExpenseModal());
  elements.backdropExpense?.addEventListener('click', () => closeExpenseModal());
  elements.btnCancelExpense?.addEventListener('click', () => closeExpenseModal());

  elements.btnOpenAddTask?.addEventListener('click', () => openTaskModal());
  elements.btnAddTaskAlt?.addEventListener('click', () => openTaskModal());
  elements.btnCloseModalTask?.addEventListener('click', () => closeTaskModal());
  elements.backdropTask?.addEventListener('click', () => closeTaskModal());
  elements.btnCancelTask?.addEventListener('click', () => closeTaskModal());

  elements.btnApkInfo?.addEventListener('click', () => elements.modalApkInfo.classList.add('open'));
  elements.btnCloseApkInfo?.addEventListener('click', () => elements.modalApkInfo.classList.remove('open'));
  elements.backdropApkInfo?.addEventListener('click', () => elements.modalApkInfo.classList.remove('open'));

  // Quick Amount Increment Chips (+50, +100, etc.)
  elements.amtChips.forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic(10);
      const addVal = parseFloat(chip.dataset.amt) || 0;
      const currentVal = parseFloat(elements.expenseAmount.value) || 0;
      elements.expenseAmount.value = currentVal + addVal;
    });
  });

  // Expense Form Submit
  elements.formExpense.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerHaptic(20);

    const checkedMethod = document.querySelector('input[name="paymentMethod"]:checked');

    store.addExpense({
      title: elements.expenseTitle.value,
      amount: elements.expenseAmount.value,
      category: elements.expenseCategory.value,
      paymentMethod: checkedMethod ? checkedMethod.value : 'UPI',
      date: elements.expenseDate.value,
      notes: elements.expenseNotes.value
    });

    closeExpenseModal();
    renderAll();
  });

  // Task Form Submit
  elements.formTask.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerHaptic(20);

    const checkedPriority = document.querySelector('input[name="taskPriority"]:checked');

    store.addTask({
      title: elements.taskTitle.value,
      notes: elements.taskNotes.value,
      priority: checkedPriority ? checkedPriority.value : 'medium',
      category: elements.taskCategory.value,
      isRecurring: elements.taskIsRecurring.checked,
      dueDate: elements.taskDueDate.value
    });

    closeTaskModal();
    renderAll();
  });

  // Global Click delegation for Delete Expense, Toggle Task, Delete Task
  document.addEventListener('click', (e) => {
    // Delete Expense
    const delExpBtn = e.target.closest('.btn-delete-expense');
    if (delExpBtn) {
      e.stopPropagation();
      const id = delExpBtn.dataset.id;
      if (confirm('Delete this expense?')) {
        triggerHaptic(15);
        store.deleteExpense(id);
        renderAll();
      }
      return;
    }

    // Toggle Task
    const toggleBtn = e.target.closest('.btn-toggle-task');
    if (toggleBtn) {
      e.stopPropagation();
      triggerHaptic(25);
      const id = toggleBtn.dataset.id;
      const task = store.toggleTask(id);
      if (task && task.isCompleted) {
        launchConfetti();
      }
      renderAll();
      return;
    }

    // Delete Task
    const delTaskBtn = e.target.closest('.btn-delete-task');
    if (delTaskBtn) {
      e.stopPropagation();
      const id = delTaskBtn.dataset.id;
      if (confirm('Delete this task?')) {
        triggerHaptic(15);
        store.deleteTask(id);
        renderAll();
      }
      return;
    }
  });

  // Payment Filter Chips in Expenses Tab
  elements.paymentFilterChips?.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    triggerHaptic(10);
    elements.paymentFilterChips.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    expenseFilterMethod = chip.dataset.method;
    renderExpensesView();
  });

  // Category & Date Select Filters
  elements.selectCategoryFilter?.addEventListener('change', (e) => {
    expenseFilterCategory = e.target.value;
    renderExpensesView();
  });

  elements.selectDateFilter?.addEventListener('change', (e) => {
    expenseFilterDate = e.target.value;
    renderExpensesView();
  });

  // Task Segment Filter Tabs
  elements.taskFilterSegments.forEach(seg => {
    seg.addEventListener('click', () => {
      triggerHaptic(10);
      elements.taskFilterSegments.forEach(s => s.classList.remove('active'));
      seg.classList.add('active');
      taskFilter = seg.dataset.taskFilter;
      renderTasksView();
    });
  });

  // Budget Settings Save
  elements.btnSaveBudgetSettings?.addEventListener('click', () => {
    triggerHaptic(20);
    const daily = parseFloat(elements.inputDailyBudget.value) || 1000;
    const monthly = parseFloat(elements.inputMonthlyBudget.value) || 25000;
    const curr = elements.selectCurrency.value || '₹';
    store.saveBudget(daily, monthly, curr);
    alert('Budget limits & currency updated successfully!');
    renderAll();
  });

  // Data Export
  elements.btnExportData?.addEventListener('click', () => {
    triggerHaptic(15);
    const dataStr = store.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackwise_backup_${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Data Import
  elements.inputImportData?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = store.importAllData(event.target.result);
      if (ok) {
        alert('Data successfully imported!');
        renderAll();
      } else {
        alert('Failed to import file. Please check the JSON format.');
      }
    };
    reader.readAsText(file);
  });

  // Reset Sample Data
  elements.btnResetDemo?.addEventListener('click', () => {
    if (confirm('Reset to initial sample expenses and tasks? Current data will be replaced.')) {
      triggerHaptic(20);
      store.resetToSampleData();
      renderAll();
    }
  });

  // Clear All Data
  elements.btnClearAll?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      triggerHaptic(30);
      store.clearAllData();
      renderAll();
    }
  });

  // PWA Install prompt listener
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    elements.btnPwaInstall.style.display = 'block';
  });

  elements.btnPwaInstall?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        elements.modalApkInfo.classList.remove('open');
      }
      deferredInstallPrompt = null;
    } else {
      alert('To install on Android: Open in Google Chrome, tap the 3-dot menu at top-right, and select "Install app" or "Add to Home screen".');
    }
  });
}

function openExpenseModal() {
  triggerHaptic(12);
  elements.formExpense.reset();
  elements.expenseDate.value = getTodayDateString();
  elements.modalExpense.classList.add('open');
  setTimeout(() => elements.expenseAmount.focus(), 200);
}

function closeExpenseModal() {
  elements.modalExpense.classList.remove('open');
}

function openTaskModal() {
  triggerHaptic(12);
  elements.formTask.reset();
  elements.taskDueDate.value = getTodayDateString();
  elements.modalTask.classList.add('open');
  setTimeout(() => elements.taskTitle.focus(), 200);
}

function closeTaskModal() {
  elements.modalTask.classList.remove('open');
}

// Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  }
}

// Subscribe to store updates
store.subscribe(() => {
  renderAll();
});

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderAll();
  registerServiceWorker();
});
