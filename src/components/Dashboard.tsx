import React from 'react';
import { useBillHistory } from '../context/BillHistoryContext';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Receipt } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { bills } = useBillHistory();
    const { settings } = useSalonSettings();

    // Calculate Today's Stats
    const today = new Date().toISOString().split('T')[0];
    const todayBills = bills.filter(b => b.date.startsWith(today));
    const todayRevenue = todayBills.reduce((sum, b) => sum + b.grandTotal, 0);

    // Prepare Chart Data (last 7 bills or grouped by hour today)
    // For simplicity, let's show the last 10 bills' totals sequentially
    const chartData = todayBills.length > 0
        ? todayBills.reverse().map((b, i) => ({
            name: new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            total: b.grandTotal
        }))
        : [];

    return (
        <div className="space-y-6 pb-10">
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
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                        <Receipt className="text-blue-600" size={20} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Bills Count</span>
                    <span className="text-lg font-bold text-gray-800">{todayBills.length}</span>
                </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Today's Sales Trend</h3>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Area type="monotone" dataKey="total" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTotal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                        No sales today yet
                    </div>
                )}
            </div>

            {/* Recent Activity Mini-List */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Sales</h3>
                <div className="space-y-3">
                    {todayBills.slice(0, 5).map(bill => (
                        <div key={bill.id} className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-medium text-gray-800">{bill.customerName}</p>
                                <p className="text-[10px] text-gray-400">{new Date(bill.date).toLocaleTimeString()}</p>
                            </div>
                            <span className="font-bold text-purple-600">{settings.currencySymbol}{bill.grandTotal.toFixed(2)}</span>
                        </div>
                    ))}
                    {todayBills.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">No activity today.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
