import React, { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend, type TooltipItem, type TooltipModel,

} from 'chart.js';

// ✅ Register ChartJS Components and Plugin
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface Transaction {
  id: number;
  date: string;
  amount: number;
  category: 'Revenue' | 'Expense' | string;
  status: 'Paid' | 'Pending' | 'Failed' | string;
  user_id: string;
  user_profile: string;
}

interface OverviewChartProps {
  transactions: Transaction[];
  view: 'Yearly' | 'Monthly';
  selectedMonthYear?: string;
  monthYearOptions?: string[];
  onMonthYearChange?: (monthYear: string) => void;
}

function getMonthlyData(transactions: Transaction[]) {
  const monthlyRevenue: { [key: string]: number } = {};
  const monthlyExpenses: { [key: string]: number } = {};

  transactions.forEach(t => {
    const date = new Date(t.date);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    if (t.category && t.category.toLowerCase() === 'revenue') {
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Math.abs(t.amount);
    } else if (t.category && t.category.toLowerCase() === 'expense') {
      monthlyExpenses[key] = (monthlyExpenses[key] || 0) + Math.abs(t.amount);
    }
  });

  const allKeys = Array.from(new Set([...Object.keys(monthlyRevenue), ...Object.keys(monthlyExpenses)]));
  const sortedKeys = allKeys.sort((a, b) => {
    const [ma, ya] = a.split(' ');
    const [mb, yb] = b.split(' ');
    const da = new Date(`${ma} 1, ${ya}`);
    const db = new Date(`${mb} 1, ${yb}`);
    return da.getTime() - db.getTime();
  });

  return {
    labels: sortedKeys,
    revenue: sortedKeys.map(k => monthlyRevenue[k] || 0),
    expenses: sortedKeys.map(k => monthlyExpenses[k] || 0),
  };
}

function getDailyData(transactions: Transaction[], monthYear: string) {
  const dailyRevenue: { [key: string]: number } = {};
  const dailyExpenses: { [key: string]: number } = {};
  transactions.forEach(t => {
    const date = new Date(t.date);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    if (key !== monthYear) return;
    const day = date.getDate();
    const dayKey = `${day.toString().padStart(2, '0')}`;
    if (t.category && t.category.toLowerCase() === 'revenue') {
      dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + Math.abs(t.amount);
    } else if (t.category && t.category.toLowerCase() === 'expense') {
      dailyExpenses[dayKey] = (dailyExpenses[dayKey] || 0) + Math.abs(t.amount);
    }
  });
  // Find number of days in the selected month
  const [monthStr, yearStr] = monthYear.split(' ');
  const monthIdx = new Date(`${monthStr} 1, ${yearStr}`).getMonth();
  const yearNum = parseInt(yearStr, 10);
  const daysInMonth = new Date(yearNum, monthIdx + 1, 0).getDate();
  const dayLabels = Array.from({length: daysInMonth}, (_, i) => (i+1).toString().padStart(2, '0'));
  return {
    labels: dayLabels,
    revenue: dayLabels.map(k => dailyRevenue[k] || 0),
    expenses: dayLabels.map(k => dailyExpenses[k] || 0),
  };
}

const OverviewChart: React.FC<OverviewChartProps> = ({ transactions, view, selectedMonthYear, monthYearOptions, onMonthYearChange }) => {
  let chartData, labels, revenue, expenses;
  if (view === 'Monthly' && selectedMonthYear) {
    const daily = getDailyData(transactions, selectedMonthYear);
    labels = daily.labels;
    revenue = daily.revenue;
    expenses = daily.expenses;
    chartData = {
      labels,
      datasets: [
        {
          label: 'Income',
          data: revenue,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.2)',
          tension: 0.4,
          fill: false,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Expenses',
          data: expenses,
          borderColor: '#fbbf24',
          backgroundColor: 'rgba(251,191,36,0.2)',
          tension: 0.4,
          fill: false,
          pointBackgroundColor: '#fbbf24',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  } else {
    const monthly = getMonthlyData(transactions);
    labels = monthly.labels;
    revenue = monthly.revenue;
    expenses = monthly.expenses;
    chartData = {
      labels: labels.map(l => l.split(' ')[0]),
      datasets: [
        {
          label: 'Income',
          data: revenue,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.2)',
          tension: 0.4,
          fill: false,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Expenses',
          data: expenses,
          borderColor: '#fbbf24',
          backgroundColor: 'rgba(251,191,36,0.2)',
          tension: 0.4,
          fill: false,
          pointBackgroundColor: '#fbbf24',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }
  type ChartRefType = ChartJS<'line'> | null;
  const chartRef = useRef<ChartRefType>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Extract year from last label (or current year if none)
  const year = (view === 'Monthly' && selectedMonthYear)
    ? selectedMonthYear.split(' ')[1]
    : (labels && labels.length > 0 ? labels[labels.length - 1].split(' ')[1] : new Date().getFullYear());

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<'line'>) => `$${context.parsed.y.toFixed(2)}`,        },
          external: (context: { tooltip: TooltipModel<'line'> }) => {
          if (context.tooltip?.dataPoints?.length > 0) {
            setHoverIndex(context.tooltip.dataPoints[0].dataIndex);
          } else {
            setHoverIndex(null);
          }
        },
      },
    },
    hover: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        grace: '10%',
        ticks: {
          callback: (tickValue: string | number): string => {
            return `$${tickValue}`;
          },
          color: '#fff',
        },
        grid: {
          color: 'rgba(255,255,255,0.1)',
        },
      },
      x: {
        ticks: {
          color: '#fff',
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          color: 'rgba(255,255,255,0.05)',
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  const hoverDisplay = hoverIndex !== null && labels[hoverIndex] ? (
      <div style={{
        color: '#fff',
        background: '#222',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
        display: 'inline-block',
      }}>
        <strong>{view === 'Monthly' ? `${selectedMonthYear} ${labels[hoverIndex]}` : labels[hoverIndex]}</strong>:&nbsp;
        Income: <span style={{ color: '#10b981' }}>${revenue[hoverIndex].toFixed(2)}</span>
        &nbsp;|&nbsp;
        Expenses: <span style={{ color: '#fbbf24' }}>${expenses[hoverIndex].toFixed(2)}</span>
      </div>
  ) : null;

  // Hide hoverDisplay when mouse leaves chart area
  const handleMouseLeave = () => setHoverIndex(null);

  return (
    <div style={{height: '80%', width: '100%', paddingBottom: 0, position: 'relative'}}>
      {/* Year display at top right, month dropdown at the left if Monthly */}
      <div style={{position: 'absolute', top: 0, right: 0, color: '#fff', fontWeight: 600, fontSize: 18, zIndex: 2, padding: '8px 16px'}}>
        {year}
      </div>
      {view === 'Monthly' && monthYearOptions && onMonthYearChange && (
        <div style={{position: 'absolute', top: 0, left: 0, zIndex: 2, padding: '8px 16px'}}>
          <select
            style={{background: '#334155', border: '1px solid #475569', color: 'white', padding: '4px 8px', borderRadius: '4px'}}
            value={selectedMonthYear}
            onChange={e => onMonthYearChange(e.target.value)}
          >
            {monthYearOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      {/* Only show hoverDisplay if inside chart area */}
      {hoverDisplay}
      <div onMouseLeave={handleMouseLeave}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
};

export default OverviewChart;
