import React, { useState, useMemo, useRef } from 'react';
import { useBillHistory } from '../context/BillHistoryContext';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { sendWhatsAppMessage } from '../utils/whatsappApi';
import { Megaphone, Users, Image as ImageIcon, Send, AlertCircle, CheckCircle, Video, X, Upload, FileImage } from 'lucide-react';

export const MarketingDashboard: React.FC = () => {
    const { bills } = useBillHistory();
    const { settings } = useSalonSettings();
    
    const [messageText, setMessageText] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState(0);
    const [sendResults, setSendResults] = useState<{number: string, success: boolean, error?: string}[]>([]);

    // Get unique customers with valid WhatsApp numbers
    const customers = useMemo(() => {
        const unique = new Map<string, { name: string, number: string, lastVisit: string }>();
        bills.forEach(b => {
            if (b.customerWhatsApp && b.customerWhatsApp.trim() !== '') {
                if (!unique.has(b.customerWhatsApp)) {
                    unique.set(b.customerWhatsApp, { name: b.customerName || 'Customer', number: b.customerWhatsApp, lastVisit: b.date });
                }
            }
        });
        return Array.from(unique.values()).sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    }, [bills]);

    const handleSelectAll = () => {
        if (selectedCustomers.length === customers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(customers.map(c => c.number));
        }
    };

    const toggleCustomer = (number: string) => {
        setSelectedCustomers(prev =>
            prev.includes(number) ? prev.filter(n => n !== number) : [...prev, number]
        );
    };

    // Handle file selection from device
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Only keep up to 5 files
        const newFiles = [...mediaFiles, ...files].slice(0, 5);
        setMediaFiles(newFiles);

        // Generate previews
        newFiles.forEach((file, index) => {
            if (mediaPreviews[index]) return; // already previewed
            const reader = new FileReader();
            reader.onload = (ev) => {
                setMediaPreviews(prev => {
                    const updated = [...prev];
                    updated[index] = ev.target?.result as string;
                    return updated;
                });
            };
            reader.readAsDataURL(file);
        });

        // Reset so same file can be re-selected
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (selectedCustomers.length === 0) return alert('Please select at least one customer.');
        if (!messageText.trim() && mediaFiles.length === 0 && !mediaUrl.trim()) return alert('Please enter a message or attach media.');
        
        setIsSending(true);
        setSendProgress(0);
        setSendResults([]);

        const results: {number: string, success: boolean, error?: string}[] = [];

        // Manual mode — open wa.me links
        if (settings.whatsappApiProvider === 'none') {
            alert('API is disabled. The app will now open WhatsApp Web for each customer. Please send manually in each tab. Note: You cannot auto-attach files in manual mode — please share the file manually in WhatsApp.');
            for (let i = 0; i < selectedCustomers.length; i++) {
                const number = selectedCustomers[i];
                const cleanNum = number.replace(/\D/g, '');
                const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(messageText)}`;
                window.open(url, '_blank');
                await new Promise(r => setTimeout(r, 1200));
                results.push({ number, success: true });
                setSendProgress(((i + 1) / selectedCustomers.length) * 100);
            }
        } else {
            // Cloud API — send with media if provided
            // Use first file if multiple are attached (WhatsApp API sends one media per message)
            const fileToSend = mediaFiles.length > 0 ? mediaFiles[0] : undefined;

            for (let i = 0; i < selectedCustomers.length; i++) {
                const number = selectedCustomers[i];

                const response = await sendWhatsAppMessage(settings, {
                    to: number,
                    text: messageText,
                    mediaFile: fileToSend,
                    mediaUrl: !fileToSend && mediaUrl.trim() !== '' ? mediaUrl : undefined,
                });
                
                results.push({ number, success: response.success, error: response.error });
                setSendProgress(((i + 1) / selectedCustomers.length) * 100);

                // Small delay to prevent rate limiting
                await new Promise(r => setTimeout(r, 600));
            }

            // If multiple files, send remaining as separate messages
            if (mediaFiles.length > 1) {
                for (let fi = 1; fi < mediaFiles.length; fi++) {
                    for (let i = 0; i < selectedCustomers.length; i++) {
                        await sendWhatsAppMessage(settings, {
                            to: selectedCustomers[i],
                            mediaFile: mediaFiles[fi],
                        });
                        await new Promise(r => setTimeout(r, 600));
                    }
                }
            }
        }

        setSendResults(results);
        setIsSending(false);
    };

    return (
        <div className="w-full flex justify-center pb-20 overflow-y-auto pt-4">
            <div className="w-full max-w-6xl flex gap-6 px-4">
                
                {/* Left Panel: Campaign Composition */}
                <div className="w-1/2 flex flex-col gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center gap-2 mb-6 border-b pb-4">
                            <Megaphone className="text-purple-600" size={24} />
                            <h2 className="text-xl font-bold text-gray-800">New Campaign</h2>
                        </div>

                        <div className="space-y-4 flex-1">
                            {/* Message text */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Message Text</label>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none h-28 text-sm"
                                    placeholder="Write your promotional message here..."
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                ></textarea>
                                <p className="text-[10px] text-gray-400 mt-1 text-right">{messageText.length} characters</p>
                            </div>

                            {/* Media Attach Section */}
                            <div className="border border-dashed border-purple-200 rounded-xl p-4 bg-purple-50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm font-bold text-purple-700">
                                        <FileImage size={16} /> Attach Images / Videos
                                    </label>
                                    <span className="text-[10px] text-purple-400">{mediaFiles.length}/5 files</span>
                                </div>

                                {/* File previews */}
                                {mediaPreviews.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {mediaFiles.map((file, index) => (
                                            <div key={index} className="relative group w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-200 bg-white shadow-sm">
                                                {file.type.startsWith('video') ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white">
                                                        <Video size={24} />
                                                        <span className="text-[8px] mt-1 text-center px-1 truncate w-full text-center">{file.name}</span>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={mediaPreviews[index]}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5 truncate px-1">
                                                    {(file.size / 1024).toFixed(0)} KB
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload button */}
                                {mediaFiles.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 text-sm font-bold hover:bg-purple-100 transition-colors"
                                    >
                                        <Upload size={16} />
                                        {mediaFiles.length === 0 ? 'Choose Images or Videos' : 'Add More Files'}
                                    </button>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {settings.whatsappApiProvider !== 'none' && (
                                    <>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                            <div className="flex-1 h-px bg-gray-200" />
                                            <span>or paste a public URL</span>
                                            <div className="flex-1 h-px bg-gray-200" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ImageIcon size={14} className="text-gray-400 shrink-0" />
                                            <input
                                                type="url"
                                                placeholder="https://example.com/promo.jpg"
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                                                value={mediaUrl}
                                                onChange={e => setMediaUrl(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                {settings.whatsappApiProvider !== 'none' ? (
                                    <p className="text-[10px] text-purple-500">
                                        Files will be automatically uploaded to Meta API and sent to all selected customers.
                                        {mediaFiles.length > 1 && " Multiple files will be sent as separate messages."}
                                    </p>
                                ) : (
                                    <div className="flex items-start gap-2 text-orange-700 bg-orange-50 rounded-lg p-2">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <p className="text-[10px]">
                                            <strong>Manual mode:</strong> WhatsApp Web links will be opened. You must attach the file manually in each chat window.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <button
                                onClick={handleSend}
                                disabled={isSending || selectedCustomers.length === 0 || (!messageText.trim() && mediaFiles.length === 0 && !mediaUrl.trim())}
                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                {isSending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending... {Math.round(sendProgress)}%
                                    </>
                                ) : (
                                    <><Send size={18} /> Send to {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? 's' : ''}</>
                                )}
                            </button>
                            {isSending && (
                                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                                        style={{ width: `${sendProgress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Customer Selection & Results */}
                <div className="w-1/2 flex flex-col gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
                        
                        <div className="flex items-center justify-between mb-4 border-b pb-4">
                            <div className="flex items-center gap-2">
                                <Users className="text-purple-600" size={24} />
                                <h2 className="text-xl font-bold text-gray-800">Audience</h2>
                            </div>
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                                {customers.length} Contacts
                            </span>
                        </div>

                        {sendResults.length > 0 ? (
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                <div className="flex items-center justify-between sticky top-0 bg-white py-2">
                                    <h3 className="font-bold text-gray-700">Campaign Results</h3>
                                    <span className="text-xs text-green-600 font-bold">
                                        {sendResults.filter(r => r.success).length}/{sendResults.length} sent
                                    </span>
                                </div>
                                {sendResults.map((res, i) => (
                                    <div key={i} className={`p-3 rounded-lg border flex items-center justify-between text-sm ${res.success ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                        <span className="font-medium">{res.number}</span>
                                        {res.success ? (
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle size={14}/> Sent</span>
                                        ) : (
                                            <span className="text-red-500 text-xs truncate max-w-[200px]" title={res.error}>{res.error || 'Failed'}</span>
                                        )}
                                    </div>
                                ))}
                                <button onClick={() => setSendResults([])} className="mt-4 w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200">
                                    New Campaign
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-2 px-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-purple-600 rounded"
                                            checked={selectedCustomers.length === customers.length && customers.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                        Select All
                                    </label>
                                    <span className="text-xs text-gray-500">{selectedCustomers.length} selected</span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-1 border rounded-lg p-1 bg-gray-50">
                                    {customers.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic gap-2 py-10">
                                            <Users size={32} className="opacity-30" />
                                            <p>No customers found in bill history.</p>
                                            <p className="text-[10px] text-gray-300">Add customer WhatsApp numbers when creating bills.</p>
                                        </div>
                                    ) : (
                                        customers.map(c => (
                                            <label key={c.number} className="flex items-center justify-between p-3 bg-white rounded border border-gray-100 hover:border-purple-200 cursor-pointer transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-purple-600 rounded"
                                                        checked={selectedCustomers.includes(c.number)}
                                                        onChange={() => toggleCustomer(c.number)}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{c.name}</p>
                                                        <p className="text-xs text-gray-500">{c.number}</p>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-gray-400 text-right">
                                                    <p>Last Visit</p>
                                                    <p>{new Date(c.lastVisit).toLocaleDateString()}</p>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
