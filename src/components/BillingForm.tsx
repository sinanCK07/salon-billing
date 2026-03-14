import React, { useState, useMemo, useEffect } from 'react';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { useBillHistory } from '../context/BillHistoryContext';
import { useEmployees } from '../hooks/useEmployees';
import type { Bill, ServiceItem } from '../context/BillHistoryContext';
import { Trash2, CreditCard, Banknote, Smartphone, CheckCircle, UserPlus, Scissors } from 'lucide-react';
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

// --- PREDEFINED SERVICES BY CATEGORY ---
const CATEGORIZED_SERVICES = {
    FACIAL: [
        { name: 'ADVANCED PEARL', price: 1800, editable: false },
        { name: 'ADVANCED GOLD', price: 2000, editable: false },
        { name: 'PAPAYA', price: 1300, editable: false },
        { name: 'O3+ DTAN', price: 1100, editable: false },
        { name: 'O3+ FACIAL', price: 3500, editable: false },
        { name: 'BRIDAL GLOW NATURES', price: 3500, editable: false },
        { name: 'DTAN NATURES', price: 600, editable: false },
        { name: 'RAAGA DETAN', price: 800, editable: false },
        { name: 'AROMA MAGIC SKIN GLOW FACIAL', price: 3500, editable: false },
        { name: 'BLEACH', price: 500, editable: false },
        { name: 'CLEAN UP', price: 600, editable: false },
    ],
    HAIR: [
        { name: 'HAIR SPA', price: 1000, editable: false },
        { name: 'STRAIGHTENING', price: 0, editable: true },
        { name: 'SMOOTHENING', price: 0, editable: true },
        { name: 'HAIR', price: 200, editable: false },
        { name: 'HAIR (CHILD)', price: 150, editable: false },
        { name: 'HAIR WASHING', price: 50, editable: false },
    ],
    GROOMING: [
        { name: 'BEARD', price: 100, editable: false },
        { name: 'HEAD MASSAGE', price: 400, editable: false },
    ]
};

export const BillingForm: React.FC = () => {
    const { settings } = useSalonSettings();
    const { addBill } = useBillHistory();
    const { employees, addEmployee } = useEmployees();
    
    const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);

    // Selected Employee
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [newEmployeeName, setNewEmployeeName] = useState('');
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);

    // Customer State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [billDate] = useState(new Date().toISOString().split('T')[0]);
    const [billTime] = useState(new Date().toTimeString().slice(0, 5));
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Services State
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [discountReason, setDiscountReason] = useState('');

    // Custom Service State
    const [isAddingCustomService, setIsAddingCustomService] = useState(false);
    const [customServiceName, setCustomServiceName] = useState('');
    const [customServicePrice, setCustomServicePrice] = useState<number | ''>('');

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

    // Auto-Ready & Return Detection & Keyboard Shortcuts
    useEffect(() => {
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

        const handleKeyDown = (e: KeyboardEvent) => {
            // ALT + C for Custom Service
            if (e.altKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                setIsAddingCustomService(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Handlers
    const handleServiceChange = (id: string, field: keyof ServiceItem, value: string | number) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeServiceRow = (id: string) => {
        setServices(prev => prev.filter(s => s.id !== id));
    };

    const handleAddPredefinedService = (service: { name: string, price: number, editable?: boolean }) => {
        // If editable prompt for price
        let finalPrice = service.price;
        if (service.editable) {
            const entered = window.prompt(`Enter price for ${service.name}:`, '0');
            if (entered === null) return; // Cancelled
            finalPrice = parseFloat(entered) || 0;
        }

        // Check if already in bill, if so increase quantity
        setServices(prev => {
            const ext = prev.find(s => s.name === service.name && s.price === finalPrice);
            if (ext) {
                return prev.map(s => s.id === ext.id ? { ...s, quantity: s.quantity + 1 } : s);
            }
            return [...prev, { id: Date.now().toString() + Math.random(), name: service.name, price: finalPrice, quantity: 1 }];
        });
    };

    const handleAddEmployeeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newEmployeeName.trim()) {
            addEmployee(newEmployeeName.trim());
            setNewEmployeeName('');
            setIsAddingEmployee(false);
        }
    };

    const handleAddCustomServiceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customServiceName.trim() && customServicePrice !== '' && Number(customServicePrice) >= 0) {
            setServices(prev => [
                ...prev, 
                { 
                    id: Date.now().toString() + Math.random(), 
                    name: customServiceName.trim().toUpperCase(), 
                    price: Number(customServicePrice), 
                    quantity: 1 
                }
            ]);
            setCustomServiceName('');
            setCustomServicePrice('');
            setIsAddingCustomService(false);
        }
    };

    const handleReset = () => {
        setCustomerName('');
        setCustomerPhone('');
        setServices([]);
        setDiscount(0);
        setDiscountReason('');
        setGeneratedBill(null);
        setPaymentMethod('cash');
        setSelectedEmployee('');
    }

    const handleFinishBill = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation
        if (!selectedEmployee) {
            alert("Please select an employee.");
            return;
        }

        if (services.length === 0) {
            alert("Please add at least one service.");
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
            offerImageBase64: settings.globalOfferImageBase64,
            employeeName: selectedEmployee,
            sharedStatus: false
        };

        // 2. Save Bill
        addBill(newBill);

        // 4. Reset Form Immediately (Optimization: Prepared for next customer)
        handleReset();

        // 5. Open Bill Preview Modal
        setGeneratedBill(newBill);
    };


    return (
        <div className="w-full h-full overflow-hidden flex flex-col pt-2 bg-gray-50">
            <SuccessToast show={showSuccessToast} />
            
            {/* Main 3-Panel Layout Container */}
            <div className="flex-1 w-full h-full flex flex-row gap-4 overflow-hidden">
                
                {/* LEFT PANEL: EMPLOYEE SELECTION (20%) */}
                <div className="w-[20%] flex flex-col gap-4 overflow-y-auto pr-1">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <UserPlus size={18} className="text-purple-600"/> Employees
                            </h3>
                            <button 
                                onClick={() => setIsAddingEmployee(!isAddingEmployee)}
                                className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 transition"
                            >
                                {isAddingEmployee ? 'Cancel' : 'Add New'}
                            </button>
                        </div>

                        {isAddingEmployee && (
                            <form onSubmit={handleAddEmployeeSubmit} className="mb-4 flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Employee Name" 
                                    className="flex-1 px-3 py-1.5 border rounded text-sm focus:ring-1 focus:ring-purple-500 outline-none uppercase"
                                    value={newEmployeeName}
                                    onChange={e => setNewEmployeeName(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm font-medium">Add</button>
                            </form>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            {employees.map(emp => (
                                <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => setSelectedEmployee(selectedEmployee === emp.name ? '' : emp.name)}
                                    className={`p-3 rounded-lg border-2 text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                                        selectedEmployee === emp.name 
                                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm scale-[1.02]' 
                                        : 'border-gray-100 hover:border-purple-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="truncate w-full text-center">{emp.name}</span>
                                    {selectedEmployee === emp.name && (
                                        <div className="h-1 w-8 bg-purple-600 rounded-full mt-1"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER PANEL: BILL AREA (45%) */}
                <div className="w-[45%] flex flex-col gap-4 overflow-y-auto pr-1">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-lg font-bold text-gray-800">Current Bill</h2>
                            {selectedEmployee ? (
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                    {selectedEmployee}
                                </span>
                            ) : (
                                <span className="text-xs font-bold bg-red-50 text-red-500 px-2 py-1 rounded-full border border-red-100 animate-pulse">
                                    Select Employee
                                </span>
                            )}
                        </div>

                        <form id="billing-form" onSubmit={handleFinishBill} className="flex-1 flex flex-col gap-4">
                            {/* Customer Details */}
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Customer Name"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                />
                                <input
                                    type="tel"
                                    placeholder="WhatsApp Num"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                />
                            </div>

                            <div className="flex-1 border rounded-lg bg-gray-50 p-2 overflow-y-auto min-h-[150px]">
                                {services.length === 0 ? (
                                    <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 opacity-60">
                                        <Scissors size={32} className="mb-2" />
                                        <p className="text-sm font-medium mb-1">No services added</p>
                                        <button 
                                            type="button"
                                            onClick={() => setIsAddingCustomService(true)}
                                            className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition font-bold"
                                        >
                                            + Add Custom
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {services.map((service) => (
                                            <div key={service.id} className="bg-white p-2 border rounded shadow-sm flex items-center justify-between gap-2">
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{service.name}</p>
                                                    <p className="text-xs text-purple-600 font-medium">{settings.currencySymbol}{service.price}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-12 px-1 py-1 border rounded text-center text-sm"
                                                        value={service.quantity}
                                                        onChange={e => handleServiceChange(service.id, 'quantity', parseFloat(e.target.value) || 1)}
                                                        min={1}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeServiceRow(service.id)}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Totals & Payments */}
                            <div className="mt-auto space-y-3 pt-2">
                                <div className="space-y-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex justify-between text-gray-600">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span className="text-xs">Discount</span>
                                        <div className="relative w-20">
                                            <span className="absolute left-2 top-1.5 text-gray-500 text-xs">{settings.currencySymbol}</span>
                                            <input
                                                type="number"
                                                className="w-full pl-5 pr-1 py-1 border rounded text-right focus:outline-none bg-white text-sm"
                                                value={discount}
                                                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between items-center text-gray-600 mt-1">
                                            <span className="text-xs">Reason</span>
                                            <input
                                                type="text"
                                                placeholder="e.g. Employee Request"
                                                className="w-32 px-2 py-1 border rounded text-right focus:outline-none bg-white text-xs"
                                                value={discountReason}
                                                onChange={e => setDiscountReason(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-gray-800 border-t border-gray-200 mt-2 pt-2">
                                        <span>Total</span>
                                        <span className="text-purple-700">{settings.currencySymbol}{grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>

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
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentMethod === method.id
                                                ? 'border-purple-600 bg-purple-50 text-purple-600 shadow-sm'
                                                : 'border-gray-200 bg-white text-gray-500'
                                                }`}
                                        >
                                            <span className="text-xs font-bold pt-1">{method.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!selectedEmployee || services.length === 0}
                                >
                                    <CheckCircle size={18} />
                                    <span>Complete Bill</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT PANEL: SERVICE CATALOG (35%) */}
                <div className="w-[35%] flex-1 flex flex-col gap-4 overflow-y-auto">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col">
                        <div className="sticky top-0 bg-white z-10 pb-2 border-b mb-4 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">
                                Services Catalog
                            </h3>
                            <button 
                                onClick={() => setIsAddingCustomService(!isAddingCustomService)}
                                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition font-bold"
                            >
                                {isAddingCustomService ? 'Cancel' : '+ Custom'}
                            </button>
                        </div>
                        
                        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                            {/* CATEGORY LIST */}
                            {Object.entries(CATEGORIZED_SERVICES).map(([category, items]) => (
                                <div key={category}>
                                    <h4 className="text-xs font-bold text-purple-600 uppercase mb-2 bg-purple-50 inline-block px-2 py-1 rounded">
                                        {category}
                                    </h4>
                                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                                        {items.map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleAddPredefinedService(item)}
                                                className="text-left p-2 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm transition-all flex flex-col h-full bg-white active:scale-95 group"
                                            >
                                                <span className="text-[11px] font-bold text-gray-800 leading-tight flex-1">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs font-bold text-purple-600 mt-1">
                                                    {item.editable ? 'Variable' : `${settings.currencySymbol}${item.price}`}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* CUSTOM SERVICE MODAL */}
            {isAddingCustomService && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-fadeIn">
                        <div className="bg-purple-600 text-white p-4 text-center">
                            <h3 className="font-bold text-lg">Add Custom Service</h3>
                        </div>
                        <form onSubmit={handleAddCustomServiceSubmit} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Service Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. SPECIAL BRIDAL MAKEUP" 
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none uppercase bg-gray-50"
                                    value={customServiceName}
                                    onChange={e => setCustomServiceName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Price ({settings.currencySymbol})</label>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    required
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50"
                                    value={customServicePrice}
                                    onChange={e => setCustomServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                            </div>
                            
                            <div className="flex gap-3 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setIsAddingCustomService(false);
                                        setCustomServiceName('');
                                        setCustomServicePrice('');
                                    }}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={!customServiceName.trim() || customServicePrice === ''}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-purple-600 text-white shadow-md shadow-purple-200 hover:bg-purple-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Service
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {generatedBill && (
                <BillPreview
                    bill={generatedBill}
                    settings={settings}
                    onClose={handleReset}
                />
            )}
        </div>
    );
};
