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
  Legend,

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

interface OverviewChartProps {
  transactions: never[];
}

function getMonthlyData(transactions: any[]) {
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

const OverviewChart: React.FC<OverviewChartProps> = ({ transactions }) => {
  const { labels, revenue, expenses } = getMonthlyData(transactions);
  const chartRef = useRef<any>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Extract year from last label (or current year if none)
  const year = labels.length > 0 ? labels[labels.length - 1].split(' ')[1] : new Date().getFullYear();
  const monthLabels = labels.map(l => l.split(' ')[0]);

  const chartData = {
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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toFixed(2)}`,
        },
        external: (context: any) => {
          if (context.tooltip && context.tooltip.dataPoints && context.tooltip.dataPoints.length > 0) {
            setHoverIndex(context.tooltip.dataPoints[0].dataIndex);
          } else {
            setHoverIndex(null);
          }
        }
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
          callback: (value: number) => `$${value}`,
          color: '#fff',
          stepSize: undefined, // Let chart.js auto-calculate
        },
        grid: {
          color: 'rgba(255,255,255,0.1)'
        }
      },
      x: {
        ticks: {
          color: '#fff',
          autoSkip: false, // Show all months
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          color: 'rgba(255,255,255,0.05)'
        }
      }
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
        <strong>{labels[hoverIndex]}</strong>:&nbsp;
        Income: <span style={{ color: '#10b981' }}>${revenue[hoverIndex].toFixed(2)}</span>
        &nbsp;|&nbsp;
        Expenses: <span style={{ color: '#fbbf24' }}>${expenses[hoverIndex].toFixed(2)}</span>
      </div>
  ) : null;

  // Responsive width: fit parent, min 700px, max 100% (no horizontal scroll)
  return (
    <div style={{height: '80%', width: '100%', paddingBottom: 0, position: 'relative'}}>
      {/* Year display at top right */}
      <div style={{position: 'absolute', top: 0, right: 0, color: '#fff', fontWeight: 600, fontSize: 18, zIndex: 2, padding: '8px 16px'}}>
        {year}
      </div>
      {hoverDisplay}
      <Line ref={chartRef} data={{...chartData, labels: monthLabels}} options={options} />
    </div>
  );
};

export default OverviewChart;
