import React from 'react';
import { useBillHistory } from '../context/BillHistoryContext';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { TrendingUp, Banknote, CreditCard, Smartphone } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

export const Dashboard: React.FC = () => {
    const { bills } = useBillHistory();
    const { settings } = useSalonSettings();

    // Calculate Today's Stats
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const todayBills = bills.filter(b => b.date.startsWith(todayStr));
    const todayRevenue = todayBills.reduce((sum, b) => sum + b.grandTotal, 0);

    const todayCash = todayBills.filter(b => b.paymentMethod === 'cash').reduce((sum, b) => sum + b.grandTotal, 0);
    const todayCard = todayBills.filter(b => b.paymentMethod === 'card').reduce((sum, b) => sum + b.grandTotal, 0);
    const todayUpi = todayBills.filter(b => b.paymentMethod === 'upi').reduce((sum, b) => sum + b.grandTotal, 0);

    // Monthly Data Aggregation
    const monthlyBills = bills.filter(b => {
        const d = new Date(b.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyDataMap: { [key: string]: { total: number, count: number } } = {};
    const paymentMethodMap = { cash: 0, card: 0, upi: 0 };

    // Fill all days of the month with zero initially
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        monthlyDataMap[dayKey] = { total: 0, count: 0 };
    }

    monthlyBills.forEach(b => {
        const d = b.date.split('T')[0];
        if (monthlyDataMap[d]) {
            monthlyDataMap[d].total += b.grandTotal;
            monthlyDataMap[d].count += 1;
        }
        if (Object.prototype.hasOwnProperty.call(paymentMethodMap, b.paymentMethod)) {
            paymentMethodMap[b.paymentMethod as keyof typeof paymentMethodMap] += b.grandTotal;
        }
    });

    const monthlyChartData = Object.entries(monthlyDataMap).map(([date, data]) => ({
        date,
        day: parseInt(date.split('-')[2]),
        total: data.total,
        count: data.count
    })).sort((a, b) => a.day - b.day);

    const monthlyRevenue = monthlyBills.reduce((sum, b) => sum + b.grandTotal, 0);

    const barChartData = {
        labels: monthlyChartData.map(d => d.day),
        datasets: [
            {
                label: 'Daily Sales',
                data: monthlyChartData.map(d => d.total),
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const pieChartData = {
        labels: ['Cash', 'Card', 'UPI'],
        datasets: [
            {
                data: [paymentMethodMap.cash, paymentMethodMap.card, paymentMethodMap.upi],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.6)',
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(168, 85, 247, 0.6)',
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(59, 130, 246)',
                    'rgb(168, 85, 247)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="space-y-6 pb-20">
            <h2 className="text-xl font-bold text-gray-800">Sales Dashboard</h2>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="text-green-600" size={20} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Today's Total</span>
                    <span className="text-lg font-bold text-gray-800">
                        {settings.currencySymbol}{todayRevenue.toFixed(2)}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="text-purple-600" size={20} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Month Total</span>
                    <span className="text-lg font-bold text-gray-800">
                        {settings.currencySymbol}{monthlyRevenue.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Today's Payment Method Totals */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <Banknote className="text-green-500 mb-1" size={18} />
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Cash</span>
                    <span className="text-sm font-bold text-gray-700">{settings.currencySymbol}{todayCash.toFixed(0)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <CreditCard className="text-blue-500 mb-1" size={18} />
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Card</span>
                    <span className="text-sm font-bold text-gray-700">{settings.currencySymbol}{todayCard.toFixed(0)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <Smartphone className="text-purple-500 mb-1" size={18} />
                    <span className="text-[10px] text-gray-400 font-bold uppercase">UPI</span>
                    <span className="text-sm font-bold text-gray-700">{settings.currencySymbol}{todayUpi.toFixed(0)}</span>
                </div>
            </div>

            {/* Monthly Sales Chart (Bar) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Daily Sales Trend</h3>
                <div className="h-48">
                    <Bar
                        data={barChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `${settings.currencySymbol}${(context.parsed.y ?? 0).toFixed(2)}`
                                    }
                                }
                            },
                            scales: {
                                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                                y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Payment Method Distribution (Pie) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Payment Methods (Monthly)</h3>
                <div className="h-48 flex justify-center">
                    <Pie
                        data={pieChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Day by Day Sales Report */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Day by Day Sales Report</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2 text-right">Bills</th>
                                <th className="px-3 py-2 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthlyChartData.slice().reverse().filter(d => d.count > 0).map((row) => (
                                <tr key={row.date} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-2 text-gray-700 font-medium">
                                        {new Date(row.date).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-600">{row.count}</td>
                                    <td className="px-3 py-2 text-right text-purple-600 font-bold">
                                        {settings.currencySymbol}{row.total.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {monthlyBills.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-3 py-4 text-center text-gray-400 italic">No sales this month</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Activity Mini-List */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Sales</h3>
                <div className="space-y-3">
                    {bills.slice(0, 5).map(bill => (
                        <div key={bill.id} className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-medium text-gray-800">{bill.customerName}</p>
                                <p className="text-[10px] text-gray-400">
                                    {new Date(bill.date).toLocaleDateString()} {new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <span className="font-bold text-purple-600">{settings.currencySymbol}{bill.grandTotal.toFixed(2)}</span>
                        </div>
                    ))}
                    {bills.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">No activity recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
