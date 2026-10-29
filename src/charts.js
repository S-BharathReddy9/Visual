// ==========================================================================
// TrackWise - SVG Chart Engine (Donut & Bar Visualizations)
// ==========================================================================

export const PAYMENT_COLORS = {
  'UPI': '#6366f1',
  'Cash': '#10b981',
  'Debit Card': '#0ea5e9',
  'Credit Card': '#ec4899',
  'Net Banking': '#f59e0b',
  'Other': '#8b5cf6'
};

export const CATEGORY_COLORS = {
  'Food & Dining': '#f59e0b',
  'Commute & Travel': '#06b6d4',
  'Groceries': '#10b981',
  'Shopping': '#ec4899',
  'Bills & Utilities': '#ef4444',
  'Entertainment': '#8b5cf6',
  'Healthcare': '#14b8a6',
  'Education': '#3b82f6',
  'Other': '#94a3b8'
};

// Generates an interactive SVG Donut Chart
export function renderDonutChart(containerEl, dataMap, colorPalette, currency = '₹') {
  if (!containerEl) return;

  const entries = Object.entries(dataMap).filter(([, val]) => val > 0);
  const total = entries.reduce((sum, [, val]) => sum + val, 0);

  if (total === 0 || entries.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-title">No expense data yet</div>
        <div class="empty-state-sub">Add expenses to see visual breakdown</div>
      </div>
    `;
    return;
  }

  // Sort descending by amount
  entries.sort((a, b) => b[1] - a[1]);

  const size = 200;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;
  const slicesSvg = entries.map(([name, val]) => {
    const fraction = val / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += fraction * circumference;
    const color = colorPalette[name] || '#94a3b8';

    return `
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="transparent"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${strokeDasharray}"
        stroke-dashoffset="${strokeDashoffset}"
        stroke-linecap="butt"
        style="transition: stroke-dasharray 0.5s ease;"
      />
    `;
  }).join('');

  // Legend
  const legendHtml = entries.map(([name, val]) => {
    const pct = Math.round((val / total) * 100);
    const color = colorPalette[name] || '#94a3b8';
    return `
      <div class="legend-item">
        <div class="legend-left">
          <span class="legend-dot" style="background: ${color};"></span>
          <span class="legend-name" title="${name}">${name}</span>
        </div>
        <span class="legend-val">${currency}${Math.round(val).toLocaleString()} <span style="color: var(--text-muted); font-size: 0.68rem;">(${pct}%)</span></span>
      </div>
    `;
  }).join('');

  containerEl.innerHTML = `
    <div style="position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;">
      <svg class="chart-svg" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
        ${slicesSvg}
      </svg>
      <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Total</span>
        <span style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">${currency}${Math.round(total).toLocaleString()}</span>
      </div>
    </div>
    <div class="chart-legend-grid">
      ${legendHtml}
    </div>
  `;
}

// Generates a 7-day spending trend Bar Chart
export function renderTrendBarChart(containerEl, expensesList, currency = '₹', dailyLimit = 1000) {
  if (!containerEl) return;

  // Build the last 7 days array
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'narrow' });
    days.push({ key, label: dayLabel, total: 0 });
  }

  // Populate totals
  for (const exp of expensesList) {
    const match = days.find(d => d.key === exp.date);
    if (match) {
      match.total += (exp.amount || 0);
    }
  }

  const maxSpend = Math.max(...days.map(d => d.total), dailyLimit, 100);
  const chartHeight = 130;

  const barsSvg = days.map((day, idx) => {
    const heightPercent = Math.min((day.total / maxSpend), 1) * 100;
    const barHeight = Math.max((heightPercent / 100) * (chartHeight - 35), 4);
    const isOver = day.total > dailyLimit;
    const barColor = isOver ? '#ef4444' : (day.label === 'Today' ? '#6366f1' : '#10b981');
    const x = 20 + idx * 36;
    const y = (chartHeight - 20) - barHeight;

    return `
      <g class="chart-bar-group">
        <rect
          x="${x}"
          y="${y}"
          width="20"
          height="${barHeight}"
          rx="5"
          fill="${barColor}"
          opacity="${day.total === 0 ? 0.25 : 1}"
        />
        <text
          x="${x + 10}"
          y="${chartHeight - 4}"
          font-size="10"
          font-weight="${day.label === 'Today' ? '800' : '600'}"
          fill="${day.label === 'Today' ? '#ffffff' : '#94a3b8'}"
          text-anchor="middle"
        >${day.label}</text>
        ${day.total > 0 ? `
          <text
            x="${x + 10}"
            y="${Math.max(y - 5, 12)}"
            font-size="8.5"
            font-weight="700"
            fill="#e2e8f0"
            text-anchor="middle"
          >${Math.round(day.total)}</text>
        ` : ''}
      </g>
    `;
  }).join('');

  // Daily limit dashed guide line
  const limitY = (chartHeight - 20) - Math.min((dailyLimit / maxSpend), 1) * (chartHeight - 35);

  containerEl.innerHTML = `
    <div style="width: 100%; overflow-x: auto; padding-top: 10px;">
      <svg viewBox="0 0 280 ${chartHeight}" style="width: 100%; height: auto; max-width: 380px; display: block; margin: 0 auto;">
        <!-- Daily Limit Reference Line -->
        <line
          x1="10"
          y1="${limitY}"
          x2="270"
          y2="${limitY}"
          stroke="rgba(245, 158, 11, 0.45)"
          stroke-dasharray="4 3"
          stroke-width="1.5"
        />
        <text
          x="270"
          y="${limitY - 4}"
          font-size="8"
          font-weight="700"
          fill="#fbbf24"
          text-anchor="end"
        >Limit (${currency}${dailyLimit})</text>
        
        ${barsSvg}
      </svg>
    </div>
  `;
}
