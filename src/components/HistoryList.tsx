import React, { useState } from 'react';
import { useBillHistory } from '../context/BillHistoryContext';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { FileText, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const HistoryList: React.FC = () => {
    const { bills, clearHistory } = useBillHistory();
    const { settings } = useSalonSettings();

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
            'Grand Total': bill.grandTotal
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Billing History");
        XLSX.writeFile(wb, `billing_history_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (bills.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FileText size={48} className="mb-2 opacity-50" />
                <p>No bills generated yet.</p>
            </div>
        );
    }

    // TODO: Add click to view bill details (reuse BillPreview by accepting bill maybe? or simple view)
    // For now just list.

    return (
        <div className="space-y-4 pb-20">
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
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-800">{bill.customerName}</h3>
                                <p className="text-xs text-gray-500">#{bill.billNumber}</p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-purple-700">{settings.currencySymbol}{bill.grandTotal.toFixed(2)}</div>
                                <div className="text-xs text-gray-400">{new Date(bill.date).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                            {bill.services.map(s => s.name).join(', ')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
