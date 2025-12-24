import React from 'react';
import { useBillHistory } from '../context/BillHistoryContext';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

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

    // Monthly Data Aggregation
    const monthlyBills = bills.filter(b => {
        const d = new Date(b.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyDataMap: { [key: string]: { total: number, count: number } } = {};

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
    });

    const monthlyChartData = Object.entries(monthlyDataMap).map(([date, data]) => ({
        date,
        day: parseInt(date.split('-')[2]),
        total: data.total,
        count: data.count
    })).sort((a, b) => a.day - b.day);

    const monthlyRevenue = monthlyBills.reduce((sum, b) => sum + b.grandTotal, 0);

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

            {/* Monthly Sales Chart */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Sales Trend</h3>
                <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={monthlyChartData}>
                        <defs>
                            <linearGradient id="colorMonthTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="day"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number | string | undefined) => [`${settings.currencySymbol}${Number(value || 0).toFixed(2)}`, 'Sales']}
                            labelFormatter={(label) => `Day ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorMonthTotal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
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
