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
    const { settings } = useSalonSettings();

    const [showDailyReport, setShowDailyReport] = useState(false);

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

    const topEmployeeToday = Object.entries(todayEmployeeRevenueMap).sort((a, b) => b[1] - a[1])[0];
    const topServiceToday = Object.entries(todayServiceCountMap).sort((a, b) => b[1] - a[1])[0];


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
        const message = encodeURIComponent(
            `📊 *Salon Daily Report*\n` +
            `Date: ${now.toLocaleDateString()}\n\n` +
            `*Summary*\n` +
            `Total Bills: ${todayBills.length}\n` +
            `Total Sales: ${settings.currencySymbol}${todayRevenue.toFixed(2)}\n\n` +
            `*Payments*\n` +
            `Cash: ${settings.currencySymbol}${todayCash.toFixed(2)}\n` +
            `Card: ${settings.currencySymbol}${todayCard.toFixed(2)}\n` +
            `UPI: ${settings.currencySymbol}${todayUpi.toFixed(2)}\n\n` +
            `*Highlights*\n` +
            `Top Employee: ${topEmployeeToday ? topEmployeeToday[0] : 'N/A'}\n` +
            `Top Service: ${topServiceToday ? topServiceToday[0] : 'N/A'}`
        );

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
        <div className="w-full flex justify-center pb-20 overflow-y-auto">
            <div className="w-full max-w-5xl space-y-6 py-4">
                <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Sales Dashboard</h2>
                <button 
                    onClick={() => setShowDailyReport(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-green-700 transition"
                >
                    Daily Closing Report
                </button>
            </div>

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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
                        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Daily Closing Report</h3>
                            <button onClick={() => setShowDailyReport(false)} className="hover:bg-green-700 p-1 rounded-full text-green-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="text-center pb-4 border-b">
                                <p className="text-xs text-gray-500 font-semibold mb-1">{now.toLocaleDateString()}</p>
                                <p className="text-3xl font-bold text-gray-800">{settings.currencySymbol}{todayRevenue.toFixed(2)}</p>
                                <p className="text-sm text-gray-500 mt-1">{todayBills.length} Bills Generated</p>
                            </div>

                            <div className="space-y-2 text-sm border-b pb-4">
                                <div className="flex justify-between items-center p-2 bg-green-50 rounded text-green-800">
                                    <span className="flex items-center gap-2"><Banknote size={16}/> Cash</span>
                                    <span className="font-bold">{settings.currencySymbol}{todayCash.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-blue-50 rounded text-blue-800">
                                    <span className="flex items-center gap-2"><CreditCard size={16}/> Card</span>
                                    <span className="font-bold">{settings.currencySymbol}{todayCard.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-purple-50 rounded text-purple-800">
                                    <span className="flex items-center gap-2"><Smartphone size={16}/> UPI</span>
                                    <span className="font-bold">{settings.currencySymbol}{todayUpi.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-3 pb-2">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Top Employee</p>
                                    <p className="text-gray-800 font-medium">{topEmployeeToday ? `${topEmployeeToday[0]} (${settings.currencySymbol}${topEmployeeToday[1]})` : 'None'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Most Popular Service</p>
                                    <p className="text-gray-800 font-medium">{topServiceToday ? `${topServiceToday[0]} (${topServiceToday[1]} times)` : 'None'}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleSendDailyReport}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md transition-colors"
                            >
                                <Share2 size={18} />
                                Send to Owner WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};
