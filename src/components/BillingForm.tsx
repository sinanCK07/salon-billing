import React, { useState, useMemo } from 'react';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { useBillHistory } from '../context/BillHistoryContext';
import type { Bill, ServiceItem } from '../context/BillHistoryContext';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { BillPreview } from './BillPreview';

export const BillingForm: React.FC = () => {
    const { settings } = useSalonSettings();
    const { addBill } = useBillHistory();
    const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);

    // Customer State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
    const [billTime, setBillTime] = useState(new Date().toTimeString().slice(0, 5));

    // Services State
    const [services, setServices] = useState<ServiceItem[]>([
        { id: '1', name: '', price: 0, quantity: 1 }
    ]);
    const [discount, setDiscount] = useState(0);

    // Computed Totals
    const subtotal = useMemo(() => {
        return services.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [services]);

    const taxAmount = useMemo(() => {
        return settings.enableTax ? (subtotal * settings.taxRate) / 100 : 0;
    }, [subtotal, settings]);

    const grandTotal = useMemo(() => {
        return Math.max(0, subtotal + taxAmount - discount);
    }, [subtotal, taxAmount, discount]);

    // Handlers
    const handleServiceChange = (id: string, field: keyof ServiceItem, value: string | number) => {
        setServices(prev => prev.map(s => {
            if (s.id !== id) return s;

            const updatedService = { ...s, [field]: value };

            // Auto-fill price if name matches a predefined service
            if (field === 'name') {
                const matchedService = settings.predefinedServices?.find(ps => ps.name === value);
                if (matchedService) {
                    updatedService.price = matchedService.price;
                }
            }

            return updatedService;
        }));
    };

    const addServiceRow = () => {
        setServices(prev => [
            ...prev,
            { id: Date.now().toString(), name: '', price: 0, quantity: 1 }
        ]);
    };

    const removeServiceRow = (id: string) => {
        if (services.length > 1) {
            setServices(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerName) {
            alert("Please enter customer name");
            return;
        }

        const billNumber = `BILL-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;

        const newBill: Bill = {
            id: Date.now().toString(),
            billNumber,
            customerName,
            customerWhatsApp: customerPhone,
            date: `${billDate}T${billTime}:00`,
            services: services.filter(s => s.name.trim() !== ''), // Filter  empty rows
            subtotal,
            taxAmount,
            discount,
            grandTotal
        };

        if (newBill.services.length === 0) {
            alert("Please add at least one service");
            return;
        }

        addBill(newBill);
        setGeneratedBill(newBill);
    };

    const handleReset = () => {
        setCustomerName('');
        setCustomerPhone('');
        setServices([{ id: Date.now().toString(), name: '', price: 0, quantity: 1 }]);
        setDiscount(0);
        setGeneratedBill(null);
    }

    return (
        <>
            <div className="space-y-6 pb-24">
                <h2 className="text-xl font-bold text-gray-800">New Bill</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Details */}
                    <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                        <h3 className="font-semibold text-gray-700">Customer Details</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <input
                                type="text"
                                placeholder="Customer Name"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                            />
                            <input
                                type="tel"
                                placeholder="WhatsApp Number"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={billDate}
                                    onChange={e => setBillDate(e.target.value)}
                                />
                                <input
                                    type="time"
                                    className="w-32 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={billTime}
                                    onChange={e => setBillTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                        <h3 className="font-semibold text-gray-700">Services</h3>
                        {services.map((service) => (
                            <div key={service.id} className="flex gap-2 items-center">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        list={`services-${service.id}`}
                                        placeholder="Service Name"
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        value={service.name}
                                        onChange={e => handleServiceChange(service.id, 'name', e.target.value)}
                                    />
                                    <datalist id={`services-${service.id}`}>
                                        {settings.predefinedServices?.map(ps => (
                                            <option key={ps.id} value={ps.name} />
                                        ))}
                                    </datalist>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2 text-gray-500 text-sm">{settings.currencySymbol}</span>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm"
                                                value={service.price || ''}
                                                onChange={e => handleServiceChange(service.id, 'price', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            className="w-16 px-2 py-2 border rounded-lg text-sm text-center"
                                            value={service.quantity}
                                            onChange={e => handleServiceChange(service.id, 'quantity', parseFloat(e.target.value) || 1)}
                                        />
                                    </div>
                                </div>

                                {services.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeServiceRow(service.id)}
                                        className="text-red-500 p-2 hover:bg-red-50 rounded-full"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addServiceRow}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-600 font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <Plus size={18} /> Add Service
                        </button>
                    </div>

                    {/* Totals */}
                    <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span>Subtotal</span>
                            <span>{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                        </div>
                        {settings.enableTax && (
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Tax ({settings.taxRate}%)</span>
                                <span>{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Discount</span>
                            <div className="relative w-24">
                                <span className="absolute left-2 top-1.5 text-gray-500">{settings.currencySymbol}</span>
                                <input
                                    type="number"
                                    className="w-full pl-6 pr-2 py-1 border rounded text-right"
                                    value={discount}
                                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2">
                            <span>Total</span>
                            <span>{settings.currencySymbol}{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Generate Bill</span>
                        <ArrowRight size={20} />
                    </button>
                </form>
            </div>

            {generatedBill && (
                <BillPreview
                    bill={generatedBill}
                    settings={settings}
                    onClose={handleReset}
                />
            )}
        </>
    );
};
