export { };

declare global {
    interface Window {
        electron?: {
            printBill: (data: any) => Promise<string>;
        };
    }
}
