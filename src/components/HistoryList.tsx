import React, { useState } from 'react';
import { useBillHistory } from '../context/BillHistoryContext';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { FileText, Trash2, Download, CreditCard, Banknote, Smartphone, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BillPreview } from './BillPreview';
import type { Bill } from '../context/BillHistoryContext';

export const HistoryList: React.FC = () => {
    const { bills, clearHistory } = useBillHistory();
    const { settings } = useSalonSettings();

    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const downloadExcel = () => {
        if (bills.length === 0) return;

        const data = bills.map(bill => ({
            'Bill Number': bill.billNumber,
            'Date': new Date(bill.date).toLocaleString(),
            'Customer Name': bill.customerName,
            'Phone': bill.customerWhatsApp,
            'Services': bill.services.map(s => `${s.name} (${s.quantity})`).join('; '),
            'Subtotal': bill.subtotal,
            'Tax': bill.taxAmount,
            'Discount': bill.discount,
            'Discount Reason': bill.discountReason || '',
            'Grand Total': bill.grandTotal
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Billing History");
        XLSX.writeFile(wb, `billing_history_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const totalRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);

    if (bills.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FileText size={48} className="mb-2 opacity-50" />
                <p>No bills generated yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            {/* Total Business Summary Card */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-5 text-white shadow-lg mb-6">
                <p className="text-purple-100 text-sm font-medium mb-1">Total Business</p>
                <h2 className="text-3xl font-bold">
                    {settings.currencySymbol}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="text-xs text-purple-200 mt-2 opacity-80">
                    Across {bills.length} bills
                </p>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">History</h2>
                <div className="flex gap-2">
                    <button
                        onClick={downloadExcel}
                        className="text-purple-600 text-xs flex items-center gap-1 hover:bg-purple-50 px-2 py-1 rounded"
                    >
                        <Download size={12} /> Export Excel
                    </button>
                    {!showClearConfirm ? (
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            className="text-red-500 text-xs flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded"
                        >
                            <Trash2 size={12} /> Clear All
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded">
                            <span className="text-red-600 text-[10px] font-medium">Are you sure?</span>
                            <button
                                onClick={() => {
                                    clearHistory();
                                    setShowClearConfirm(false);
                                }}
                                className="text-red-600 font-bold hover:underline text-xs"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="text-gray-500 hover:text-gray-700 text-xs"
                            >
                                No
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {bills.map((bill) => (
                    <div key={bill.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        {/* Header: Customer & Amount */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-800">{bill.customerName || 'Walk-in Customer'}</h3>
                                <p className="text-xs text-gray-500">#{bill.billNumber}</p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-purple-700">{settings.currencySymbol}{bill.grandTotal.toFixed(2)}</div>
                                <div className="text-xs text-gray-400">
                                    {new Date(bill.date).toLocaleDateString()}
                                    <span className="ml-1 opacity-75">{new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Services List */}
                        <div className="text-sm text-gray-600 truncate mb-2">
                            {bill.services.map(s => s.name).join(', ')}
                        </div>

                        {/* Footer: Payment Method */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                {bill.paymentMethod === 'cash' && <Banknote size={14} className="text-green-600" />}
                                {bill.paymentMethod === 'card' && <CreditCard size={14} className="text-blue-600" />}
                                {bill.paymentMethod === 'upi' && <Smartphone size={14} className="text-purple-600" />}
                                <span className="uppercase">{bill.paymentMethod}</span>
                            </div>

                            <button
                                onClick={() => setSelectedBill(bill)}
                                className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-full transition-colors"
                                title="View Full Bill"
                            >
                                <Eye size={16} />
                            </button>
                        </div>

                        {bill.discountReason && (
                            <div className="mt-2 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded inline-block">
                                Reason: {bill.discountReason}
                            </div>
                        )}
                    </div>
                ))}
                {selectedBill && (
                    <BillPreview
                        bill={selectedBill}
                        settings={settings}
                        onClose={() => setSelectedBill(null)}
                    />
                )}
            </div>
        </div>
    );
};
