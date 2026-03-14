import React, { useState } from 'react';
import { useSalonSettings } from '../context/SalonSettingsContext';
import type { SalonSettings } from '../context/SalonSettingsContext';
import { useBillHistory } from '../context/BillHistoryContext';
import { Save, Lock, Trash2, AlertTriangle, Camera } from 'lucide-react';
import { hashPassword } from '../utils/crypto';

export const SettingsForm: React.FC = () => {
    const { settings, updateSettings } = useSalonSettings();
    const { clearHistory } = useBillHistory();
    const [formData, setFormData] = useState<SalonSettings>(settings);
    const [message, setMessage] = useState('');
    const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(settings);

    // Service Menu State
    const [newService, setNewService] = useState({ name: '', price: '', category: settings.categories?.[0] || 'Grooming' });
    const [newCategory, setNewCategory] = useState('');
    const [editingService, setEditingService] = useState<{ id: string, name: string, price: string } | null>(null);
    const [isAddingService, setIsAddingService] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const handleAddService = () => {
        if (newService.name && newService.price) {
            setFormData(prev => ({
                ...prev,
                predefinedServices: [
                    ...(prev.predefinedServices || []),
                    {
                        id: Date.now().toString(),
                        name: newService.name,
                        price: parseFloat(newService.price),
                        category: newService.category || 'General'
                    }
                ]
            }));
            setNewService({ name: '', price: '', category: formData.categories?.[0] || 'Grooming' });
            setIsAddingService(false);
        }
    };

    const handleAddCategory = () => {
        if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
            setFormData(prev => ({
                ...prev,
                categories: [...prev.categories, newCategory.trim()]
            }));
            setNewCategory('');
            setIsAddingCategory(false);
        }
    };

    const handleUpdatePrice = () => {
        if (editingService && editingService.price !== '') {
            setFormData(prev => ({
                ...prev,
                predefinedServices: prev.predefinedServices.map(s => 
                    s.id === editingService.id ? { ...s, price: parseFloat(editingService.price) } : s
                )
            }));
            setEditingService(null);
        }
    };

    const handleRemoveService = (id: string) => {
        setFormData(prev => ({
            ...prev,
            predefinedServices: prev.predefinedServices.filter(s => s.id !== id)
        }));
    };

    // Update effect to sync local state with context if needed (though usually form state drives itself)
    // Here we just initialize.

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, globalOfferImageBase64: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(formData);
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="w-full flex justify-center pb-20 overflow-y-auto">
            <div className="w-full max-w-5xl space-y-6 py-4">
                <h2 className="text-xl font-bold text-gray-800">Salon Details</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Salon Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salon Name</label>
                    <input
                        type="text"
                        name="salonName"
                        value={formData.salonName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        placeholder="e.g. Luxe Beauty"
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        placeholder="Address line"
                    />
                </div>

                {/* Owner Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                    <input
                        type="text"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                    />
                </div>

                {/* Owner WhatsApp */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner WhatsApp Number</label>
                    <div className="text-xs text-gray-500 mb-1">Include country code (e.g. 919876543210)</div>
                    <input
                        type="tel"
                        name="ownerWhatsApp"
                        value={formData.ownerWhatsApp}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        placeholder="919999999999"
                    />
                </div>

                {/* GST Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        placeholder="GSTIN..."
                    />
                </div>

                {/* Social Links */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Review Link</label>
                    <input
                        type="url"
                        name="googleReviewLink"
                        value={formData.googleReviewLink || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        placeholder="https://g.page/..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Profile Link</label>
                    <input
                        type="url"
                        name="instagramLink"
                        value={formData.instagramLink || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                        placeholder="https://instagram.com/..."
                    />
                </div>

                {/* Tax Settings */}
                <div className="bg-gray-100 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Enable Tax Calculation</label>
                        <input
                            type="checkbox"
                            name="enableTax"
                            checked={formData.enableTax}
                            onChange={handleChange}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                    </div>

                    {formData.enableTax && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                            <input
                                type="number"
                                name="taxRate"
                                value={formData.taxRate}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="0"
                                step="0.1"
                            />
                        </div>
                    )}
                </div>

                {/* Currency Symbol */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                    <input
                        type="text"
                        name="currencySymbol"
                        value={formData.currencySymbol}
                        onChange={handleChange}
                        className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                </div>

                {/* Service & Category Management */}
                <div className="bg-white p-6 border rounded-xl shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="font-bold text-gray-800 text-lg">Service Management</h3>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAddingCategory(true)}
                                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-bold text-xs hover:bg-purple-100 transition border border-purple-100"
                            >
                                Add Category
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAddingService(true)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 transition shadow-lg shadow-purple-100"
                            >
                                Add New Service
                            </button>
                        </div>
                    </div>

                    {/* Category List */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-400 uppercase">Categories</label>
                        <div className="flex flex-wrap gap-2">
                            {formData.categories?.map(cat => (
                                <span key={cat} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-100 flex items-center gap-2">
                                    {cat}
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (confirm(`Remove category "${cat}"? Services in this category will stay but lose their label.`)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    categories: prev.categories.filter(c => c !== cat)
                                                }));
                                            }
                                        }}
                                        className="hover:text-red-500"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Services List Table */}
                    <div className="overflow-x-auto rounded-xl border border-gray-100 mt-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Service Name</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Price</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.predefinedServices?.map(service => (
                                    <tr key={service.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{service.name}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-gray-200">
                                                {service.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-purple-600">{formData.currencySymbol}{service.price}</td>
                                        <td className="px-4 py-3 text-right space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setEditingService({ id: service.id, name: service.name, price: service.price.toString() })}
                                                className="text-blue-500 hover:text-blue-700 text-[11px] font-bold border-b border-transparent hover:border-blue-700"
                                            >
                                                EDIT PRICE
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveService(service.id)}
                                                className="text-red-500 hover:text-red-700 text-[11px] font-bold border-b border-transparent hover:border-red-700"
                                            >
                                                DELETE
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!formData.predefinedServices || formData.predefinedServices.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-sm text-gray-400 text-center italic">No predefined services added.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Price Modal */}
                {editingService && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                            <div className="bg-purple-600 p-4 text-center">
                                <h3 className="text-white font-bold">Edit Service Price</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Service Name</label>
                                    <input type="text" readOnly className="w-full px-4 py-2 bg-gray-50 border rounded-lg text-sm text-gray-500 outline-none" value={editingService.name} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Price ({formData.currencySymbol})</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        className="w-full px-4 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={editingService.price}
                                        onChange={(e) => setEditingService(prev => prev ? { ...prev, price: e.target.value } : null)}
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingService(null)}
                                        className="flex-1 py-2 border rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleUpdatePrice}
                                        className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Category Modal */}
                {isAddingCategory && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                            <div className="bg-purple-600 p-4 text-center">
                                <h3 className="text-white font-bold">Add New Category</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Skin Care, Spa..."
                                        className="w-full px-4 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCategory(false)}
                                        className="flex-1 py-2 border rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                                    >
                                        Add Category
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Service Modal */}
                {isAddingService && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                                <div className="bg-purple-600 p-4 text-center">
                                    <h3 className="text-white font-bold">Add New Service</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Service Name</label>
                                        <input
                                            type="text"
                                            placeholder="Service Name"
                                            className="w-full px-4 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            value={newService.name}
                                            onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Price ({formData.currencySymbol})</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                value={newService.price}
                                                onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                                            <select
                                                className="w-full px-4 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white font-bold"
                                                value={newService.category}
                                                onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                                            >
                                                {formData.categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                {!formData.categories.length && <option value="General">General</option>}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingService(false)}
                                            className="flex-1 py-2 border rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddService}
                                            className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                                        >
                                            Add Service
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                )}

                {/* Global Offer Image Attachment */}
                <div className="bg-white p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Global Offer/Deal Banner</h3>
                        {formData.globalOfferImageBase64 && (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, globalOfferImageBase64: '' }))}
                                className="text-[10px] text-red-500 font-bold uppercase"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    {!formData.globalOfferImageBase64 ? (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Camera className="w-8 h-8 text-gray-300 mb-2" />
                                <p className="text-xs text-gray-400">Click to upload global banner</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden border border-gray-100">
                            <img src={formData.globalOfferImageBase64} alt="Global Offer" className="w-full h-32 object-contain bg-gray-50" />
                        </div>
                    )}
                    <p className="text-[10px] text-gray-400 italic">This image will be automatically attached to every new bill sharing message.</p>
                </div>

                {/* Password Protection */}
                <div className="bg-purple-50 p-4 rounded-lg space-y-3 border border-purple-100">
                    <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                        <Lock size={18} />
                        <span>Security</span>
                    </h3>
                    <p className="text-xs text-purple-600">
                        {formData.settingsPassword
                            ? "Settings are protected by a password."
                            : "Set a password to protect your settings from unauthorized access."}
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            placeholder={formData.settingsPassword ? "Change Password" : "Set Password"}
                            className="flex-1 px-4 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            id="new-password"
                        />
                        <button
                            type="button"
                            onClick={async () => {
                                const input = document.getElementById('new-password') as HTMLInputElement;
                                if (input.value) {
                                    const hashed = await hashPassword(input.value);
                                    setFormData(prev => ({ ...prev, settingsPassword: hashed }));
                                    input.value = '';
                                    alert('Password applied! Remember to click "Save Settings" below.');
                                }
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                    {formData.settingsPassword && (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('Are you sure you want to remove the password?')) {
                                    setFormData(prev => ({ ...prev, settingsPassword: '' }));
                                }
                            }}
                            className="text-red-500 text-[10px] hover:underline"
                        >
                            Remove Password Protection
                        </button>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                    <Save size={20} />
                    <span>Save Settings</span>
                </button>

                {hasUnsavedChanges && (
                    <p className="text-[10px] text-orange-500 text-center font-bold uppercase animate-pulse">
                        ⚠️ You have unsaved changes
                    </p>
                )}

                {message && (
                    <div className="p-3 bg-green-100 text-green-700 rounded-lg text-center animate-pulse mt-4">
                        {message}
                    </div>
                )}

                {/* Reset Data Section */}
                <div className="bg-red-50 p-4 rounded-lg space-y-3 border border-red-100 mt-6">
                    <h3 className="font-semibold text-red-800 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        <span>Danger Zone</span>
                    </h3>
                    <p className="text-xs text-red-600">
                        This action will permanently delete all bill history. This cannot be undone.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm('CRITICAL: Are you sure you want to PERMANENTLY CLEAR all bill history? This action is irreversible.')) {
                                clearHistory();
                                alert('All history has been cleared.');
                            }
                        }}
                        className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Trash2 size={14} />
                        <span>Reset All Bill History</span>
                    </button>
                </div>

                {message && (
                    <div className="p-3 bg-green-100 text-green-700 rounded-lg text-center animate-pulse mt-4">
                        {message}
                    </div>
                )}
            </form>
            </div>
        </div>
    );
};
