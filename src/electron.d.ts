export interface PrintBillData {
    salonName: string;
    address: string;
    gstNumber?: string;
    billNumber: string;
    date: string;
    items: { name: string; qty: number; total: number }[];
    subtotal: string;
    tax: string;
    discount: string;
    grandTotal: string;
}

declare global {
    interface Window {
        electron?: {
            printBill: (data: PrintBillData) => Promise<string>;
        };
    }
}
