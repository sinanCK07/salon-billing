import React, { useState, useMemo, useEffect } from 'react';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { useBillHistory } from '../context/BillHistoryContext';
import type { Bill, ServiceItem } from '../context/BillHistoryContext';
import { Plus, Trash2, ArrowRight, CreditCard, Banknote, Smartphone, Printer, CheckCircle } from 'lucide-react';
import { BillPreview } from './BillPreview';

const SuccessToast = ({ show }: { show: boolean }) => {
    if (!show) return null;
    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 z-50 animate-bounce">
            <CheckCircle size={20} />
            <span className="font-bold text-sm">Bill sent successfully! Ready for next.</span>
        </div>
    );
};

export const BillingForm: React.FC = () => {
    const { settings } = useSalonSettings();
    const { addBill } = useBillHistory();
    const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);

    // Customer State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [billDate] = useState(new Date().toISOString().split('T')[0]);
    const [billTime] = useState(new Date().toTimeString().slice(0, 5));
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Services State
    const [services, setServices] = useState<ServiceItem[]>([
        { id: '1', name: '', price: 0, quantity: 1 }
    ]);
    const [discount, setDiscount] = useState(0);
    const [discountReason, setDiscountReason] = useState('');

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

    // Refs for auto-focus
    const serviceNameRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Auto-Ready & Return Detection
    useEffect(() => {
        // Check if we just returned from a WhatsApp flow
        const wasWaiting = localStorage.getItem('waiting_for_whatsapp_return');
        if (wasWaiting === 'true') {
            // Push to next tick to avoid synchronous state update warning
            setTimeout(() => {
                setShowSuccessToast(true);
                localStorage.removeItem('waiting_for_whatsapp_return');
                setTimeout(() => setShowSuccessToast(false), 4000);
            }, 0);
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const waiting = localStorage.getItem('waiting_for_whatsapp_return');
                if (waiting === 'true') {
                    setShowSuccessToast(true);
                    localStorage.removeItem('waiting_for_whatsapp_return');
                    setTimeout(() => setShowSuccessToast(false), 4000);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, []);

    // Handlers
    const handleServiceChange = (id: string, field: keyof ServiceItem, value: string | number) => {
        setServices(prev => {
            const index = prev.findIndex(s => s.id === id);
            const updated = prev.map(s => {
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
            });

            // Fast Billing Logic: If this is the last row and name is selected, 
            // or if Price/Qty is entered, and we want to auto-open next row.
            const currentItem = updated[index];
            const isLast = index === updated.length - 1;

            if (isLast && (field === 'name' && currentItem.name.length > 2)) {
                // We add a row automatically
                const nextId = Date.now().toString();
                setTimeout(() => {
                    const nextInput = serviceNameRefs.current[nextId];
                    if (nextInput) nextInput.focus();
                }, 10);
                return [...updated, { id: nextId, name: '', price: 0, quantity: 1 }];
            }

            return updated;
        });
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

    const handleReset = () => {
        setCustomerName('');
        setCustomerPhone('');
        const newId = Date.now().toString();
        setServices([{ id: newId, name: '', price: 0, quantity: 1 }]);
        setDiscount(0);
        setDiscountReason('');
        setGeneratedBill(null);
        setPaymentMethod('cash');

        // Auto-open Add Service (Ensure focus on the new row)
        setTimeout(() => {
            const firstInput = serviceNameRefs.current[newId];
            if (firstInput) firstInput.focus();
        }, 100);
    }

    const handleFinishBill = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation
        if (services.length === 0 || (services.length === 1 && !services[0].name)) {
            alert("Please add at least one service");
            return;
        }

        const billNumber = `BILL-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;

        const newBill: Bill = {
            id: Date.now().toString(),
            billNumber,
            customerName,
            customerWhatsApp: customerPhone,
            date: `${billDate}T${billTime}:00`,
            services: services.filter(s => s.name.trim() !== ''),
            subtotal,
            taxAmount,
            discount,
            discountReason: discount > 0 ? discountReason : '',
            grandTotal,
            paymentMethod,
            offerImageBase64: settings.globalOfferImageBase64
        };

        // 2. Save Bill
        addBill(newBill);

        // 3. Silent Print (if Electron) or just ready
        if (window.electron) {
            window.electron.printBill({
                salonName: settings.salonName,
                address: settings.address,
                gstNumber: settings.gstNumber,
                billNumber: newBill.billNumber,
                date: new Date(newBill.date).toLocaleString(),
                paymentMethod: newBill.paymentMethod.toUpperCase(),
                items: newBill.services.map(s => ({
                    name: s.name,
                    qty: s.quantity,
                    total: s.price * s.quantity
                })),
                subtotal: newBill.subtotal.toFixed(2),
                tax: newBill.taxAmount.toFixed(2),
                discount: newBill.discount.toFixed(2),
                grandTotal: newBill.grandTotal.toFixed(2),
                googleReviewLink: settings.googleReviewLink,
                instagramLink: settings.instagramLink
            }).catch(err => console.error("Print error:", err));
        }

        // 4. Reset Form Immediately (Optimization: Prepared for next customer)
        handleReset();

        // 5. Construct WhatsApp Message & Redirect
        const message = encodeURIComponent(
            `🧾 *${settings.salonName}* Bill\n` +
            `Bill No: ${newBill.billNumber}\n` +
            `Date: ${new Date(newBill.date).toLocaleString()}\n` +
            (newBill.customerName ? `Customer: ${newBill.customerName}\n` : '') +
            `\n*Services:*\n` +
            newBill.services.map(s => `- ${s.name} (x${s.quantity}): ${settings.currencySymbol}${(s.price * s.quantity).toFixed(2)}`).join('\n') +
            `\n\n----------------\n` +
            `Subtotal: ${settings.currencySymbol}${newBill.subtotal.toFixed(2)}\n` +
            (newBill.discount > 0 ? `Discount: -${settings.currencySymbol}${newBill.discount.toFixed(2)}\n` : '') +
            (newBill.taxAmount > 0 ? `Tax (${settings.taxRate}%): ${settings.currencySymbol}${newBill.taxAmount.toFixed(2)}\n` : '') +
            `*Total Amount: ${settings.currencySymbol}${newBill.grandTotal.toFixed(2)}*\n\n` +
            (settings.instagramLink ? `📸 *Follow us on Instagram:* ${settings.instagramLink}\n` : '') +
            (settings.googleReviewLink ? `⭐ *Rate us on Google:* ${settings.googleReviewLink}\n` : '') +
            `\nThank you for visiting! ✨`
        );

        const phone = newBill.customerWhatsApp ? `91${newBill.customerWhatsApp}` : '';
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

        // Set flag for return detection
        localStorage.setItem('waiting_for_whatsapp_return', 'true');

        // Redirect in same tab
        window.location.href = whatsappUrl;
    };


    return (
        <>
            <SuccessToast show={showSuccessToast} />
            <div className="space-y-6 pb-24">
                <h2 className="text-xl font-bold text-gray-800">New Bill</h2>

                <form onSubmit={handleFinishBill} className="space-y-6">
                    {/* Date and Time (Read-only) */}
                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Bill Date</label>
                            <input
                                type="date"
                                readOnly
                                className="w-full px-4 py-2 border rounded-lg bg-white text-gray-500 cursor-not-allowed focus:outline-none text-sm"
                                value={billDate}
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Bill Time</label>
                            <input
                                type="time"
                                readOnly
                                className="w-full px-4 py-2 border rounded-lg bg-white text-gray-500 cursor-not-allowed focus:outline-none text-sm"
                                value={billTime}
                            />
                        </div>
                    </div>

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
                        </div>
                    </div>

                    {/* Services */}
                    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                        <h3 className="font-semibold text-gray-700">Services</h3>
                        {services.map((service) => (
                            <div key={service.id} className="flex gap-2 items-center">
                                <div className="flex-1 space-y-2">
                                    <input
                                        ref={el => { serviceNameRefs.current[service.id] = el; }}
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

                        {discount > 0 && (
                            <div className="flex flex-col space-y-2 border-t pt-2">
                                <label className="text-xs font-semibold text-purple-600">Discount Reason (Internal only)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Regular customer, Festival offer"
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-400"
                                    value={discountReason}
                                    onChange={e => setDiscountReason(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2">
                            <span>Total</span>
                            <span>{settings.currencySymbol}{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                        <h3 className="font-semibold text-gray-700">Payment Method</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'cash', label: 'Cash', icon: Banknote },
                                { id: 'card', label: 'Card', icon: CreditCard },
                                { id: 'upi', label: 'UPI', icon: Smartphone },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setPaymentMethod(method.id as 'cash' | 'card' | 'upi')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === method.id
                                        ? 'border-purple-600 bg-purple-50 text-purple-600'
                                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                        }`}
                                >
                                    <method.icon size={20} className="mb-1" />
                                    <span className="text-xs font-bold">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Printer size={20} />
                        <span>Print & Finish Bill</span>
                        <ArrowRight size={20} className="ml-2 opacity-50" />
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
