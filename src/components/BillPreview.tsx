import React, { useRef } from 'react';
import type { Bill } from '../context/BillHistoryContext';
import type { SalonSettings } from '../context/SalonSettingsContext';
import { Share2, Printer, X } from 'lucide-react';

interface BillPreviewProps {
    bill: Bill;
    settings: SalonSettings;
    onClose: () => void;
}

export const BillPreview: React.FC<BillPreviewProps> = ({ bill, settings, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    // Generate WhatsApp Message
    const generateMessage = () => {
        let msg = `🧾 *${settings.salonName}* Bill\n`;
        msg += `Bill No: ${bill.billNumber}\n`;
        msg += `Date: ${new Date(bill.date).toLocaleString()}\n`;
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

        if (settings.instagramLink) msg += `📸 *Follow us on Instagram:* ${settings.instagramLink}\n`;
        if (settings.googleReviewLink) msg += `⭐ *Rate us on Google:* ${settings.googleReviewLink}\n`;

        msg += `\nThank you for visiting! ✨`;
        return encodeURIComponent(msg);
    };

    const handleShare = (number: string) => {
        if (!number) {
            alert("No WhatsApp number provided for this recipient.");
            return;
        }
        const cleanNumber = number.replace(/\D/g, ''); // Remove non-digits
        const url = `https://wa.me/${cleanNumber}?text=${generateMessage()}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header Actions */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-lg">Bill Generated</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Invoice Preview */}
                <div className="p-6 bg-white printable-area" ref={componentRef}>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-purple-700">{settings.salonName}</h2>
                        <p className="text-sm text-gray-500">{settings.address}</p>
                        <div className="mt-2 text-xs text-gray-400">
                            Bill #{bill.billNumber}
                        </div>
                        {settings.gstNumber && (
                            <div className="text-[10px] text-gray-400 mt-1 uppercase">
                                GSTIN: {settings.gstNumber}
                            </div>
                        )}
                        <div className="mt-2 text-xs font-bold text-gray-600 uppercase">
                            Payment: {bill.paymentMethod}
                        </div>
                    </div>

                    <div className="mb-4">
                        {bill.customerName && (
                            <p className="font-semibold text-gray-700">Customer: {bill.customerName}</p>
                        )}
                        {bill.customerWhatsApp && (
                            <p className="text-sm text-gray-500">Ph: {bill.customerWhatsApp}</p>
                        )}
                    </div>

                    <table className="w-full text-sm mb-4">
                        <thead>
                            <tr className="border-b text-left text-gray-500">
                                <th className="py-2">Item</th>
                                <th className="py-2 text-right">Qty</th>
                                <th className="py-2 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.services.map((s, i) => (
                                <tr key={i} className="border-b border-gray-100 last:border-0">
                                    <td className="py-2">{s.name}</td>
                                    <td className="py-2 text-right">{s.quantity}</td>
                                    <td className="py-2 text-right">{settings.currencySymbol}{s.price * s.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="space-y-1 text-sm border-t pt-4">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{settings.currencySymbol}{bill.subtotal.toFixed(2)}</span>
                        </div>
                        {bill.taxAmount > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Tax ({settings.taxRate}%)</span>
                                <span>{settings.currencySymbol}{bill.taxAmount.toFixed(2)}</span>
                            </div>
                        )}
                        {bill.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-{settings.currencySymbol}{bill.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-gray-800 border-t border-dashed mt-2 pt-2">
                            <span>Total</span>
                            <span>{settings.currencySymbol}{bill.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-50 text-center">
                        <div className="text-[10px] text-gray-400 mb-2">
                            {new Date(bill.date).toLocaleDateString()} | {new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <p className="text-gray-800 font-medium">Thank You 🙏</p>
                    </div>

                    {bill.offerImageBase64 && (
                        <div className="mt-4 print:hidden">
                            <p className="text-[10px] uppercase font-bold text-purple-600 mb-1 text-center italic">Special Offer Attached</p>
                            <img src={bill.offerImageBase64} alt="Offer" className="w-full rounded-lg border border-purple-100" />
                        </div>
                    )}

                    {/* Social/Review Links for Print */}
                    <div className="mt-6 pt-4 border-t border-dashed text-center space-y-1">
                        {settings.googleReviewLink && (
                            <div className="text-[10px] text-gray-600">
                                ⭐ Review us: {settings.googleReviewLink.replace('https://', '')}
                            </div>
                        )}
                        {settings.instagramLink && (
                            <div className="text-[10px] text-gray-600">
                                📸 Instagram: @{settings.instagramLink.split('/').filter(Boolean).pop()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-gray-50 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleShare(bill.customerWhatsApp)}
                            className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg flex items-center justify-center space-x-2 font-medium"
                        >
                            <Share2 size={18} />
                            <span>Customer</span>
                        </button>
                        <button
                            onClick={() => handleShare(settings.ownerWhatsApp)}
                            className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg flex items-center justify-center space-x-1 font-medium"
                        >
                            <Share2 size={18} />
                            <span>Owner</span>
                        </button>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="w-full border border-gray-300 bg-white text-gray-700 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 text-sm"
                    >
                        <Printer size={16} />
                        <span>Print Bill</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
