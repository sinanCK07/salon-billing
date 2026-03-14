import React, { useState } from 'react';
import { useBillHistory } from '../context/BillHistoryContext';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { TrendingUp, Banknote, CreditCard, Smartphone, Users, Scissors, Share2, X } from 'lucide-react';
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
    const { settings, updateSettings } = useSalonSettings();

    const [showDailyReport, setShowDailyReport] = useState(false);

    // Calculate Today's Stats
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Use lastResetTime if available for the daily report
    const lastReset = settings.lastResetTime ? new Date(settings.lastResetTime) : null;
    
    const todayBills = bills.filter(b => {
        const billDate = new Date(b.date);
        // Start of day check
        const isToday = b.date.startsWith(todayStr);
        // Reset check (must be after reset time)
        const isAfterReset = lastReset ? billDate > lastReset : true;
        return isToday && isAfterReset;
    });

    const todayRevenue = todayBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const todayCash = todayBills.filter(b => b.paymentMethod === 'cash').reduce((sum, b) => sum + b.grandTotal, 0);
    const todayCard = todayBills.filter(b => b.paymentMethod === 'card').reduce((sum, b) => sum + b.grandTotal, 0);
    const todayUpi = todayBills.filter(b => b.paymentMethod === 'upi').reduce((sum, b) => sum + b.grandTotal, 0);

    // Employee Performance & Service Popularity (ALL TIME OR MONTHLY)
    const monthlyBills = bills.filter(b => {
        const d = new Date(b.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const employeeRevenueMap: { [key: string]: number } = {};
    const servicePopularityMap: { [key: string]: number } = {};
    const monthlyDataMap: { [key: string]: { total: number, count: number } } = {};
    const paymentMethodMap = { cash: 0, card: 0, upi: 0 };

    // Fill all days of the month with zero initially
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        monthlyDataMap[dayKey] = { total: 0, count: 0 };
    }

    monthlyBills.forEach(b => {
        // Daily total logic
        const d = b.date.split('T')[0];
        if (monthlyDataMap[d]) {
            monthlyDataMap[d].total += b.grandTotal;
            monthlyDataMap[d].count += 1;
        }

        // Payment method logic
        if (Object.prototype.hasOwnProperty.call(paymentMethodMap, b.paymentMethod)) {
            paymentMethodMap[b.paymentMethod as keyof typeof paymentMethodMap] += b.grandTotal;
        }

        // Employee logic
        if (b.employeeName) {
            employeeRevenueMap[b.employeeName] = (employeeRevenueMap[b.employeeName] || 0) + b.grandTotal;
        } else {
            employeeRevenueMap['Unassigned'] = (employeeRevenueMap['Unassigned'] || 0) + b.grandTotal;
        }

        // Services logic
        b.services.forEach(s => {
            servicePopularityMap[s.name] = (servicePopularityMap[s.name] || 0) + s.quantity;
        });
    });

    // Top Employee Today
    const todayEmployeeRevenueMap: { [key: string]: number } = {};
    const todayServiceCountMap: { [key: string]: number } = {};
    todayBills.forEach(b => {
        const emp = b.employeeName || 'Unassigned';
        todayEmployeeRevenueMap[emp] = (todayEmployeeRevenueMap[emp] || 0) + b.grandTotal;
        b.services.forEach(s => {
            todayServiceCountMap[s.name] = (todayServiceCountMap[s.name] || 0) + s.quantity;
        });
    });

    const sortedTodayEmployees = Object.entries(todayEmployeeRevenueMap).sort((a, b) => b[1] - a[1]);
    const topEmployeeToday = sortedTodayEmployees[0];
    const topServiceToday = Object.entries(todayServiceCountMap).sort((a, b) => b[1] - a[1])[0];

    // Reset Logic
    const handleResetToday = () => {
        if (window.confirm("Are you sure you want to reset today's report data? (This will NOT delete your bill history)")) {
            updateSettings({ lastResetTime: new Date().toISOString() });
        }
    };


    const monthlyChartData = Object.entries(monthlyDataMap).map(([date, data]) => ({
        date,
        day: parseInt(date.split('-')[2]),
        total: data.total,
        count: data.count
    })).sort((a, b) => a.day - b.day);

    const monthlyRevenue = monthlyBills.reduce((sum, b) => sum + b.grandTotal, 0);

    // Chart Data Configs
    const barChartData = {
        labels: monthlyChartData.map(d => d.day),
        datasets: [{
            label: 'Daily Sales',
            data: monthlyChartData.map(d => d.total),
            backgroundColor: 'rgba(139, 92, 246, 0.6)',
            borderColor: 'rgb(139, 92, 246)',
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    const employeeSorted = Object.entries(employeeRevenueMap).sort((a, b) => b[1] - a[1]);
    const employeeChartData = {
        labels: employeeSorted.map(e => e[0]),
        datasets: [{
            label: 'Revenue by Employee',
            data: employeeSorted.map(e => e[1]),
            backgroundColor: 'rgba(236, 72, 153, 0.6)',
            borderColor: 'rgb(236, 72, 153)',
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    // Services Chart Data (Pie or Bar)
    const servicesSorted = Object.entries(servicePopularityMap).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5
    const servicesChartData = {
        labels: servicesSorted.map(s => s[0]),
        datasets: [{
            label: 'Most Used Services (Qty)',
            data: servicesSorted.map(s => s[1]),
            backgroundColor: [
                'rgba(245, 158, 11, 0.6)',
                'rgba(14, 165, 233, 0.6)',
                'rgba(16, 185, 129, 0.6)',
                'rgba(139, 92, 246, 0.6)',
                'rgba(244, 63, 94, 0.6)'
            ],
            borderColor: [
                'rgb(245, 158, 11)',
                'rgb(14, 165, 233)',
                'rgb(16, 185, 129)',
                'rgb(139, 92, 246)',
                'rgb(244, 63, 94)'
            ],
            borderWidth: 1,
        }],
    };

    const handleSendDailyReport = () => {
        let msg = `📊 *Salon Daily Report*\n`;
        msg += `Date: ${now.toLocaleDateString()}\n\n`;
        msg += `*Summary*\n`;
        msg += `Total Bills: ${todayBills.length}\n`;
        msg += `Total Sales: ${settings.currencySymbol}${todayRevenue.toFixed(2)}\n\n`;
        msg += `*Payments*\n`;
        msg += `Cash: ${settings.currencySymbol}${todayCash.toFixed(2)}\n`;
        msg += `Card: ${settings.currencySymbol}${todayCard.toFixed(2)}\n`;
        msg += `UPI: ${settings.currencySymbol}${todayUpi.toFixed(2)}\n\n`;
        
        msg += `*Employee Performance Today*\n`;
        sortedTodayEmployees.forEach(([name, rev]) => {
            msg += `- ${name}: ${settings.currencySymbol}${rev.toFixed(2)}\n`;
        });

        if (topServiceToday) {
            msg += `\n*Top Service:* ${topServiceToday[0]} (${topServiceToday[1]} times)\n`;
        }
        
        msg += `\n----------------\n`;
        msg += `Report Generated at: ${now.toLocaleTimeString()}`;

        const message = encodeURIComponent(msg);

        // Remove non-numeric chars from owner whatsapp
        const ownerPhone = settings.ownerWhatsApp ? settings.ownerWhatsApp.replace(/\D/g, '') : '';
        if (!ownerPhone) {
            alert("Please set Owner WhatsApp number in Settings.");
            return;
        }

        const url = `https://wa.me/${ownerPhone}?text=${message}`;
        window.open(url, '_blank');
    };

    return (
        <div className="w-full h-full flex justify-center pb-20 overflow-y-auto">
            <div className="w-full max-w-5xl space-y-6 py-4 px-4">
                <div className="flex flex-wrap gap-4 justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Sales Dashboard</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowDailyReport(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-green-700 transition"
                    >
                        Daily Closing Report
                    </button>
                    <button 
                        onClick={handleResetToday}
                        className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1"
                        title="Reset Today's Report Counters"
                    >
                        <TrendingUp size={16} /> Reset Today
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="text-green-600" size={20} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Today's Total</span>
                    <span className="text-lg font-bold text-gray-800">
                        {settings.currencySymbol}{todayRevenue.toFixed(2)}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="text-purple-600" size={20} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Month Total</span>
                    <span className="text-lg font-bold text-gray-800">
                        {settings.currencySymbol}{monthlyRevenue.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Employee Performance (Monthly) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-gray-400" />
                    <h3 className="text-xs font-bold text-gray-500 uppercase">Employee Performance (Month)</h3>
                </div>
                <div className="h-48">
                    <Bar
                        data={employeeChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: { label: (ctx) => `${settings.currencySymbol}${(ctx.parsed.y ?? 0).toFixed(2)}` }
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Monthly Sales Chart (Bar) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Daily Sales Trend</h3>
                    <div className="h-48">
                        <Bar
                            data={barChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                                    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Service Popularity (Pie) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Scissors size={18} className="text-gray-400" />
                        <h3 className="text-xs font-bold text-gray-500 uppercase">Top Services (Month)</h3>
                    </div>
                    <div className="h-48 flex justify-center">
                        <Pie
                            data={servicesChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9 } } } }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Daily Report Modal */}
            {showDailyReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden max-h-[90vh]">
                        <div className="bg-green-600 text-white p-4 flex justify-between items-center sticky top-0">
                            <h3 className="font-bold text-lg">Daily Closing Report</h3>
                            <button onClick={() => setShowDailyReport(false)} className="hover:bg-green-700 p-1 rounded-full text-green-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto">
                            <div className="text-center pb-4 border-b">
                                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-widest">{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                <p className="text-4xl font-black text-gray-800 tracking-tight">{settings.currencySymbol}{todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs font-bold text-green-600 mt-1 bg-green-50 inline-block px-2 py-0.5 rounded-full uppercase">{todayBills.length} Bills</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Breakup</p>
                                <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="flex items-center gap-2 text-gray-600 font-medium"><Banknote size={16} className="text-green-600"/> Cash</span>
                                    <span className="font-bold text-gray-800">{settings.currencySymbol}{todayCash.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="flex items-center gap-2 text-gray-600 font-medium"><CreditCard size={16} className="text-blue-600"/> Card</span>
                                    <span className="font-bold text-gray-800">{settings.currencySymbol}{todayCard.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="flex items-center gap-2 text-gray-600 font-medium"><Smartphone size={16} className="text-purple-600"/> UPI</span>
                                    <span className="font-bold text-gray-800">{settings.currencySymbol}{todayUpi.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Employee Income Report</p>
                                <div className="space-y-1.5">
                                    {sortedTodayEmployees.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No earnings recorded today</p>
                                    ) : (
                                        sortedTodayEmployees.map(([name, rev]) => (
                                            <div key={name} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
                                                <span className="text-gray-600 font-semibold">{name}</span>
                                                <span className="font-bold text-purple-700">{settings.currencySymbol}{rev.toLocaleString()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Day Highlight</p>
                                <p className="text-xs font-medium text-purple-900">
                                    {topServiceToday ? `Top Service: ${topServiceToday[0]} (${topServiceToday[1]} sales)` : 'No services logged today'}
                                </p>
                            </div>

                            <button
                                onClick={handleSendDailyReport}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg transition-all transform active:scale-[0.98] mt-2"
                            >
                                <Share2 size={18} />
                                Send Report to Owner
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};
