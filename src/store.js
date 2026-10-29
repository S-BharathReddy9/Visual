// ==========================================================================
// TrackWise - Data Store & LocalStorage Persistence
// ==========================================================================

const STORAGE_KEY_EXPENSES = 'trackwise_expenses_v1';
const STORAGE_KEY_TASKS = 'trackwise_tasks_v1';
const STORAGE_KEY_BUDGET = 'trackwise_budget_v1';
const STORAGE_KEY_LAST_ACTIVE_DATE = 'trackwise_last_date_v1';

// Seed sample data for realistic first impression
const SAMPLE_EXPENSES = [
  {
    id: 'exp-1',
    title: 'Morning Chai & Snacks',
    amount: 60,
    category: 'Food & Dining',
    paymentMethod: 'UPI',
    date: getTodayDateString(),
    time: '09:30 AM',
    notes: 'PhonePe at canteen',
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'exp-2',
    title: 'Auto-Rickshaw to Work/Metro',
    amount: 80,
    category: 'Commute & Travel',
    paymentMethod: 'Cash',
    date: getTodayDateString(),
    time: '10:15 AM',
    notes: 'Paid exact cash',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'exp-3',
    title: 'Supermarket Groceries',
    amount: 540,
    category: 'Groceries',
    paymentMethod: 'Debit Card',
    date: getYesterdayDateString(),
    time: '07:45 PM',
    notes: 'HDFC Debit Card',
    createdAt: Date.now() - 86400000
  },
  {
    id: 'exp-4',
    title: 'Broadband Internet Bill',
    amount: 999,
    category: 'Bills & Utilities',
    paymentMethod: 'UPI',
    date: getYesterdayDateString(),
    time: '02:20 PM',
    notes: 'GPay autopay',
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'exp-5',
    title: 'Study Materials & Notebooks',
    amount: 350,
    category: 'Education',
    paymentMethod: 'Credit Card',
    date: getDateOffsetString(-3),
    time: '05:00 PM',
    notes: 'Book depot',
    createdAt: Date.now() - 86400000 * 3
  }
];

const SAMPLE_TASKS = [
  {
    id: 'task-1',
    title: 'Morning Routine & Daily Plan Review',
    notes: 'Review today agenda & budget',
    priority: 'high',
    category: 'Personal',
    isRecurring: true,
    streak: 5,
    lastCompletedDate: getTodayDateString(),
    isCompleted: true,
    dueDate: getTodayDateString(),
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'task-2',
    title: 'Complete Project Architecture & Code Review',
    notes: 'Merge pull request and verify tests',
    priority: 'high',
    category: 'Work',
    isRecurring: false,
    streak: 0,
    isCompleted: false,
    dueDate: getTodayDateString(),
    createdAt: Date.now() - 3600000 * 4
  },
  {
    id: 'task-3',
    title: '30-Minute Evening Walk or Workout',
    notes: 'Fitness routine',
    priority: 'medium',
    category: 'Personal',
    isRecurring: true,
    streak: 3,
    lastCompletedDate: getYesterdayDateString(),
    isCompleted: false,
    dueDate: getTodayDateString(),
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'task-4',
    title: 'Review weekly expense receipts & verify UPI logs',
    notes: 'Match transaction SMS alerts',
    priority: 'low',
    category: 'Finance',
    isRecurring: false,
    streak: 0,
    isCompleted: false,
    dueDate: getTodayDateString(),
    createdAt: Date.now() - 3600000 * 2
  }
];

export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString() {
  return getDateOffsetString(-1);
}

export function getDateOffsetString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatReadableDate(dateStr) {
  if (!dateStr) return '';
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' });
  }
  return dateStr;
}

// Store Class with Event Subscribers
class AppStore {
  constructor() {
    this.subscribers = [];
    this.expenses = this.loadExpenses();
    this.tasks = this.loadTasks();
    this.budget = this.loadBudget();

    this.checkDailyHabitReset();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    for (const callback of this.subscribers) {
      try {
        callback(this);
      } catch (err) {
        console.error('Error in store subscriber:', err);
      }
    }
  }

  // --- Expenses ---
  loadExpenses() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed loading expenses from localStorage', e);
    }
    // Return sample expenses if first time
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(SAMPLE_EXPENSES));
    return SAMPLE_EXPENSES;
  }

  saveExpenses() {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(this.expenses));
    this.notify();
  }

  addExpense(expenseData) {
    const newExpense = {
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: expenseData.title.trim(),
      amount: parseFloat(expenseData.amount) || 0,
      category: expenseData.category || 'Other',
      paymentMethod: expenseData.paymentMethod || 'UPI',
      date: expenseData.date || getTodayDateString(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      notes: (expenseData.notes || '').trim(),
      createdAt: Date.now()
    };

    this.expenses.unshift(newExpense);
    this.saveExpenses();
    return newExpense;
  }

  deleteExpense(id) {
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.saveExpenses();
  }

  getTodayExpenses() {
    const today = getTodayDateString();
    return this.expenses.filter(e => e.date === today);
  }

  getTodayTotalSpend() {
    return this.getTodayExpenses().reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  getMonthlyExpenses(monthYear) {
    // monthYear: 'YYYY-MM'
    const target = monthYear || getTodayDateString().substring(0, 7);
    return this.expenses.filter(e => (e.date || '').startsWith(target));
  }

  getMonthlyTotalSpend() {
    return this.getMonthlyExpenses().reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  // --- Tasks & Daily Work ---
  loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TASKS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed loading tasks from localStorage', e);
    }
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(SAMPLE_TASKS));
    return SAMPLE_TASKS;
  }

  saveTasks() {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(this.tasks));
    this.notify();
  }

  checkDailyHabitReset() {
    const today = getTodayDateString();
    const lastDate = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE_DATE);

    if (lastDate && lastDate !== today) {
      // It's a new day! Reset recurring daily habits so user can do them today
      let modified = false;
      this.tasks = this.tasks.map(t => {
        if (t.isRecurring) {
          // Check streak: if not completed yesterday, streak broke (reset to 0)
          const yesterday = getYesterdayDateString();
          if (t.lastCompletedDate !== yesterday && t.lastCompletedDate !== today) {
            t.streak = 0;
          }
          t.isCompleted = false;
          modified = true;
        }
        return t;
      });

      if (modified) {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(this.tasks));
      }
    }

    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE_DATE, today);
  }

  addTask(taskData) {
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: taskData.title.trim(),
      notes: (taskData.notes || '').trim(),
      priority: taskData.priority || 'medium',
      category: taskData.category || 'Work',
      isRecurring: Boolean(taskData.isRecurring),
      streak: 0,
      isCompleted: false,
      lastCompletedDate: null,
      dueDate: taskData.dueDate || getTodayDateString(),
      createdAt: Date.now()
    };

    this.tasks.unshift(newTask);
    this.saveTasks();
    return newTask;
  }

  toggleTask(id) {
    const today = getTodayDateString();
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;

    task.isCompleted = !task.isCompleted;

    if (task.isCompleted) {
      task.completedAt = Date.now();
      if (task.isRecurring) {
        // Increment habit streak
        task.streak = (task.streak || 0) + 1;
        task.lastCompletedDate = today;
      }
    } else {
      task.completedAt = null;
      if (task.isRecurring && task.streak > 0) {
        task.streak -= 1;
      }
    }

    this.saveTasks();
    return task;
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
  }

  getTodayHabits() {
    return this.tasks.filter(t => t.isRecurring);
  }

  getPendingTasksCount() {
    return this.tasks.filter(t => !t.isCompleted).length;
  }

  getMaxStreak() {
    const recurring = this.getTodayHabits();
    if (!recurring.length) return 0;
    return Math.max(...recurring.map(t => t.streak || 0), 0);
  }

  // --- Budget Configuration ---
  loadBudget() {
    const defaultBudget = {
      dailyLimit: 1000,
      monthlyLimit: 25000,
      currency: '₹'
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY_BUDGET);
      if (raw) return { ...defaultBudget, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Failed loading budget from localStorage', e);
    }
    return defaultBudget;
  }

  saveBudget(dailyLimit, monthlyLimit, currency) {
    this.budget = {
      dailyLimit: parseFloat(dailyLimit) || 1000,
      monthlyLimit: parseFloat(monthlyLimit) || 25000,
      currency: currency || '₹'
    };
    localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(this.budget));
    this.notify();
  }

  // --- Export & Import ---
  exportAllData() {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      budget: this.budget,
      expenses: this.expenses,
      tasks: this.tasks
    }, null, 2);
  }

  importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.expenses)) {
        this.expenses = data.expenses;
        localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(this.expenses));
      }
      if (Array.isArray(data.tasks)) {
        this.tasks = data.tasks;
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(this.tasks));
      }
      if (data.budget) {
        this.budget = { ...this.budget, ...data.budget };
        localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(this.budget));
      }
      this.notify();
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  resetToSampleData() {
    this.expenses = [...SAMPLE_EXPENSES];
    this.tasks = [...SAMPLE_TASKS];
    this.budget = { dailyLimit: 1000, monthlyLimit: 25000, currency: '₹' };
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(this.expenses));
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(this.tasks));
    localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(this.budget));
    this.notify();
  }

  clearAllData() {
    this.expenses = [];
    this.tasks = [];
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify([]));
    this.notify();
  }
}

export const store = new AppStore();
