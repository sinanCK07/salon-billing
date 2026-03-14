import React, { useState, useMemo } from 'react';
import { useBillHistory } from '../context/BillHistoryContext';
import { useSalonSettings } from '../context/SalonSettingsContext';
import type { Bill, ServiceItem } from '../context/BillHistoryContext';
import { X, Plus, Trash2, Save, Scissors } from 'lucide-react';

export const EditBillModal: React.FC<{
    bill: Bill;
    onClose: () => void;
}> = ({ bill, onClose }) => {
    const { updateBill } = useBillHistory();
    const { settings } = useSalonSettings();

    const [services, setServices] = useState<ServiceItem[]>(bill.services);
    const [discount, setDiscount] = useState(bill.discount);
    const [discountReason, setDiscountReason] = useState(bill.discountReason || '');
    const [paymentMethod, setPaymentMethod] = useState(bill.paymentMethod);

    const subtotal = useMemo(() => {
        return services.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [services]);

    const taxAmount = useMemo(() => {
        return settings.enableTax ? (subtotal * settings.taxRate) / 100 : 0;
    }, [subtotal, settings]);

    const grandTotal = useMemo(() => {
        return Math.max(0, subtotal + taxAmount - discount);
    }, [subtotal, taxAmount, discount]);

    const handleServiceChange = (id: string, field: keyof ServiceItem, value: string | number) => {
        setServices(prev => prev.map(s => {
            if (s.id !== id) return s;
            const updated = { ...s, [field]: value };
            if (field === 'name') {
                const matched = settings.predefinedServices?.find(ps => ps.name === value);
                if (matched) updated.price = matched.price;
            }
            return updated;
        }));
    };

    const addServiceRow = () => {
        setServices(prev => [...prev, { id: Date.now().toString(), name: '', price: 0, quantity: 1 }]);
    };

    const removeServiceRow = (id: string) => {
        if (services.length > 1) {
            setServices(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleSave = () => {
        const filteredServices = services.filter(s => s.name.trim() !== '');
        
        if (filteredServices.length === 0) {
            alert('Bill must contain at least one service.');
            return;
        }

        updateBill(bill.id, {
            services: filteredServices,
            subtotal,
            taxAmount,
            discount,
            discountReason: discount > 0 ? discountReason : '',
            grandTotal,
            paymentMethod
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-lg flex gap-2 items-center">
                        <Scissors size={20} className="text-blue-500" /> 
                        Edit Bill <span className="text-gray-500 text-sm font-normal">#{bill.billNumber}</span>
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-6">
                    {/* Services Section */}
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-3 text-sm">Services</h4>
                        <div className="space-y-3">
                            {services.map(service => (
                                <div key={service.id} className="flex gap-2 items-start">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            list={`edit-services-${service.id}`}
                                            className="w-full px-3 py-1.5 border rounded-lg text-sm bg-gray-50"
                                            value={service.name}
                                            onChange={e => handleServiceChange(service.id, 'name', e.target.value)}
                                            placeholder="Service Name"
                                        />
                                        <datalist id={`edit-services-${service.id}`}>
                                            {settings.predefinedServices?.map(ps => (
                                                <option key={ps.id} value={ps.name} />
                                            ))}
                                        </datalist>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1.5 text-gray-500 text-xs">{settings.currencySymbol}</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-6 pr-2 py-1.5 border rounded-lg text-sm"
                                                    value={service.price || ''}
                                                    onChange={e => handleServiceChange(service.id, 'price', parseFloat(e.target.value) || 0)}
                                                    placeholder="Price"
                                                />
                                            </div>
                                            <input
                                                type="number"
                                                className="w-16 px-1 py-1.5 border rounded-lg text-sm text-center"
                                                value={service.quantity}
                                                onChange={e => handleServiceChange(service.id, 'quantity', parseFloat(e.target.value) || 1)}
                                                placeholder="Qty"
                                            />
                                        </div>
                                    </div>
                                    {services.length > 1 && (
                                        <button onClick={() => removeServiceRow(service.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addServiceRow}
                            className="mt-3 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-blue-500 hover:border-blue-400 font-medium flex items-center justify-center gap-1 text-sm bg-blue-50/50 transition"
                        >
                            <Plus size={16} /> Add Service
                        </button>
                    </div>

                    {/* Totals Section */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-semibold">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                        </div>
                        {settings.enableTax && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Tax ({settings.taxRate}%)</span>
                                <span className="font-semibold">{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Discount</span>
                            <div className="relative w-24">
                                <span className="absolute left-2 top-1 text-gray-400">{settings.currencySymbol}</span>
                                <input
                                    type="number"
                                    className="w-full pl-6 pr-2 py-1 border rounded text-right text-red-600 font-medium"
                                    value={discount}
                                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        {discount > 0 && (
                            <div className="flex flex-col space-y-2 mt-2">
                                <span className="text-gray-600 text-sm">Discount Reason</span>
                                <input
                                    type="text"
                                    placeholder="Reason"
                                    className="w-full px-3 py-1.5 border rounded text-sm text-purple-600 bg-purple-50"
                                    value={discountReason}
                                    onChange={e => setDiscountReason(e.target.value)}
                                />
                            </div>
                        )}
                        
                        <div className="flex justify-between text-lg font-bold text-gray-800 border-t border-gray-200 pt-3">
                            <span>Grand Total</span>
                            <span className="text-blue-600">{settings.currencySymbol}{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2 text-sm">Payment Method</h4>
                        <div className="flex gap-2">
                            {['cash', 'card', 'upi'].map(method => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method as 'cash' | 'card' | 'upi')}
                                    className={`flex-1 py-1.5 rounded border text-sm font-semibold uppercase ${
                                        paymentMethod === method 
                                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded mr-2 transition">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold shadow-md flex items-center gap-2 transition">
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
