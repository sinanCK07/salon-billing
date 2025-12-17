import React, { useState } from 'react';
import { useSalonSettings } from '../context/SalonSettingsContext';
import type { SalonSettings } from '../context/SalonSettingsContext';
import { Save } from 'lucide-react';

export const SettingsForm: React.FC = () => {
    const { settings, updateSettings } = useSalonSettings();
    const [formData, setFormData] = useState<SalonSettings>(settings);
    const [message, setMessage] = useState('');

    // Service Menu State
    const [newService, setNewService] = useState({ name: '', price: '' });

    const handleAddService = () => {
        if (newService.name && newService.price) {
            setFormData(prev => ({
                ...prev,
                predefinedServices: [
                    ...(prev.predefinedServices || []),
                    {
                        id: Date.now().toString(),
                        name: newService.name,
                        price: parseFloat(newService.price)
                    }
                ]
            }));
            setNewService({ name: '', price: '' });
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(formData);
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-6">
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

                {/* Service Menu Management */}
                <div className="bg-white p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-gray-700">Service Menu</h3>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Service Name"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                            value={newService.name}
                            onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                            value={newService.price}
                            onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                        />
                        <button
                            type="button"
                            onClick={handleAddService}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm hover:bg-purple-200"
                        >
                            Add
                        </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {formData.predefinedServices?.map(service => (
                            <div key={service.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-sm font-medium">{service.name}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">{formData.currencySymbol}{service.price}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveService(service.id)}
                                        className="text-red-500 hover:text-red-700 text-xs"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!formData.predefinedServices || formData.predefinedServices.length === 0) && (
                            <p className="text-sm text-gray-400 text-center py-2">No predefined services added.</p>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                    <Save size={20} />
                    <span>Save Settings</span>
                </button>

                {message && (
                    <div className="p-3 bg-green-100 text-green-700 rounded-lg text-center animate-pulse">
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};
