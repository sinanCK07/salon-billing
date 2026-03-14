import React, { useState } from 'react';
import { useBillHistory } from '../context/BillHistoryContext';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { FileText, Trash2, Download, CreditCard, Banknote, Smartphone, Eye, Share2, CheckCircle2, Edit } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BillPreview } from './BillPreview';
import { EditBillModal } from './EditBillModal';
import type { Bill } from '../context/BillHistoryContext';

export const HistoryList: React.FC = () => {
    const { bills, clearHistory, updateBill } = useBillHistory();
    const { settings } = useSalonSettings();

    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const downloadExcel = () => {
        if (bills.length === 0) return;

        const data = bills.map(bill => ({
            'Bill Number': bill.billNumber,
            'Date': new Date(bill.date).toLocaleString(),
            'Customer Name': bill.customerName,
            'Phone': bill.customerWhatsApp,
            'Employee Name': bill.employeeName || 'Unassigned',
            'Services': bill.services.map(s => `${s.name} (${s.quantity})`).join('; '),
            'Subtotal': bill.subtotal,
            'Tax': bill.taxAmount,
            'Discount': bill.discount,
            'Discount Reason': bill.discountReason || '',
            'Grand Total': bill.grandTotal,
            'Payment Method': bill.paymentMethod.toUpperCase(),
            'Shared via WA': bill.sharedStatus ? 'Yes' : 'No'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Billing History");
        XLSX.writeFile(wb, `billing_history_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleShare = (bill: Bill, to: 'customer' | 'owner') => {
        const number = to === 'customer' ? bill.customerWhatsApp : settings.ownerWhatsApp;
        
        if (!number) {
            alert(`No WhatsApp number provided for ${to}.`);
            return;
        }

        let msg = `🧾 *${settings.salonName}* Bill\n`;
        msg += `Bill No: ${bill.billNumber}\n`;
        msg += `Date: ${new Date(bill.date).toLocaleString()}\n`;
        if (bill.employeeName) msg += `Employee: ${bill.employeeName}\n`;
        if (bill.customerName) msg += `Customer: ${bill.customerName}\n`;
        msg += `\n*Services:*\n`;

        bill.services.forEach(s => {
            msg += `- ${s.name} (x${s.quantity}): ${settings.currencySymbol}${(s.price * s.quantity).toFixed(2)}\n`;
        });

        msg += `\n----------------\n`;
        msg += `Subtotal: ${settings.currencySymbol}${bill.subtotal.toFixed(2)}\n`;
        if (bill.discount > 0) msg += `Discount: -${settings.currencySymbol}${bill.discount.toFixed(2)}\n`;
        if (bill.taxAmount > 0) msg += `Tax (${settings.taxRate}%): ${settings.currencySymbol}${bill.taxAmount.toFixed(2)}\n`;
        msg += `*Total Amount: ${settings.currencySymbol}${bill.grandTotal.toFixed(2)}*\n\n`;
        msg += `\nThank you for visiting! ✨`;

        const cleanNumber = number.replace(/\D/g, '');
        const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
        
        // Mark as shared
        updateBill(bill.id, { sharedStatus: true });

        window.open(url, '_blank');
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
        <div className="w-full flex justify-center pb-20 overflow-y-auto">
            <div className="w-full max-w-5xl space-y-4 py-4">
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
                        className="bg-green-50 text-green-700 text-xs flex items-center gap-1 hover:bg-green-100 px-3 py-1.5 rounded-full font-bold transition-colors"
                    >
                        <Download size={14} /> Export Excel
                    </button>
                    {!showClearConfirm ? (
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            className="bg-red-50 text-red-600 text-xs flex items-center gap-1 hover:bg-red-100 px-3 py-1.5 rounded-full font-bold transition-colors"
                        >
                            <Trash2 size={14} /> Clear All
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
                            <span className="text-red-600 text-[10px] font-bold uppercase">Sure?</span>
                            <button
                                onClick={() => {
                                    clearHistory();
                                    setShowClearConfirm(false);
                                }}
                                className="text-red-700 font-bold hover:underline text-xs"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="text-gray-500 hover:text-gray-700 text-xs font-semibold"
                            >
                                No
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {bills.map((bill) => (
                    <div key={bill.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                        {/* Header: Customer & Amount */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    {bill.customerName || 'Walk-in Customer'}
                                    {bill.sharedStatus && (
                                        <span title="Shared on WhatsApp"><CheckCircle2 size={14} className="text-green-500" /></span>
                                    )}
                                </h3>
                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                    <span>#{bill.billNumber}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-purple-600">{bill.employeeName || 'No Emp'}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-xl text-purple-700">{settings.currencySymbol}{bill.grandTotal.toFixed(2)}</div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">
                                    {new Date(bill.date).toLocaleDateString()} {new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>

                        {/* Services List */}
                        <div className="text-sm text-gray-600 truncate mb-3 bg-gray-50 px-2 py-1 rounded">
                            {bill.services.map(s => s.name).join(', ')}
                        </div>

                        {/* Footer: Payment Method & Actions */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                {bill.paymentMethod === 'cash' && <Banknote size={14} className="text-green-600" />}
                                {bill.paymentMethod === 'card' && <CreditCard size={14} className="text-blue-600" />}
                                {bill.paymentMethod === 'upi' && <Smartphone size={14} className="text-purple-600" />}
                                <span className="uppercase tracking-wider">{bill.paymentMethod}</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleShare(bill, 'customer')}
                                    className="text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors flex items-center gap-1 text-xs font-bold"
                                    title="Share to Customer"
                                >
                                    <Share2 size={14} /> <span className="hidden sm:inline">WA</span>
                                </button>
                                <button
                                    onClick={() => setEditingBill(bill)}
                                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors flex items-center gap-1 text-xs font-bold"
                                    title="Edit Bill"
                                >
                                    <Edit size={14} /> <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                    onClick={() => setSelectedBill(bill)}
                                    className="text-purple-600 hover:bg-purple-50 p-2 rounded-full transition-colors flex items-center gap-1 text-xs font-bold"
                                    title="View Full Bill"
                                >
                                    <Eye size={14} /> <span className="hidden sm:inline">View</span>
                                </button>
                            </div>
                        </div>

                        {bill.discountReason && (
                            <div className="mt-2 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-md inline-block font-medium">
                                Discount Reason: {bill.discountReason}
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

                {editingBill && (
                    <EditBillModal
                        bill={editingBill}
                        onClose={() => setEditingBill(null)}
                    />
                )}
            </div>
            </div>
        </div>
    );
};
