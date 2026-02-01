const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const escpos = require('escpos');
// Install USB adapter
escpos.USB = require('escpos-usb');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Security best practice
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // In dev, load localhost. In prod, load index.html
    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);

    // Open DevTools in dev mode
    if (process.env.ELECTRON_START_URL) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

// --- Printing Logic ---

ipcMain.handle('print-bill', async (event, billData) => {
    return new Promise((resolve, reject) => {
        try {
            // Attempt to auto-detect USB device
            // If you know specific VIP/PID you can pass them: new escpos.USB(0xVID, 0xPID);
            const device = new escpos.USB();

            if (!device) {
                console.error("No USB Printer found");
                // For development/demo without printer, we resolve 'mock-success' or reject.
                // Rejecting allows the UI to show an alert.
                return reject("Printer not found. Please connect the RP3169 via USB.");
            }

            const options = { encoding: "GB18030" /* Default for many thermal printers */ };
            const printer = new escpos.Printer(device, options);

            device.open(function (error) {
                if (error) {
                    console.error("Printer Open Error:", error);
                    return reject("Could not open connection to printer.");
                }

                printer
                    .font('a')
                    .align('ct')
                    .style('b')
                    .size(1, 1)
                    .text(billData.salonName)
                    .size(0, 0)
                    .style('n')
                    .text(billData.address);

                if (billData.gstNumber) {
                    printer.text(`GSTIN: ${billData.gstNumber}`);
                }

                printer
                    .text('--------------------------------')
                    .align('lt')
                    .text(`Bill No: ${billData.billNumber}`)
                    .text(`Date:    ${billData.date}`)
                    .text('--------------------------------')
                    .align('ct')
                    .text('CUSTOMER COPY')
                    .align('lt')
                    .text('Item             Qty    Price')
                    .text('--------------------------------');

                billData.items.forEach(item => {
                    // Simple column alignment formatting
                    const name = item.name.padEnd(16).substring(0, 16);
                    const qty = item.qty.toString().padStart(3);
                    const price = item.total.toFixed(2).padStart(9);
                    printer.text(`${name} ${qty} ${price}`);
                });

                printer.text('--------------------------------')
                    .align('rt')
                    .text(`Subtotal: ${billData.subtotal}`)
                    .text(`Tax: ${billData.tax}`)
                    .text(`Discount: ${billData.discount}`)
                    .size(1, 1)
                    .style('b')
                    .text(`TOTAL: ${billData.grandTotal}`)
                    .style('n')
                    .size(0, 0)
                    .align('ct')
                    .text('--------------------------------')
                    .text(`Date: ${billData.date.split(',')[0].trim()}`)
                    .text(`Time: ${billData.date.split(',')[1]?.trim() || ''}`)
                    .feed(1)
                    .style('b')
                    .text('Thank You 🙏');

                if (billData.googleReviewLink) {
                    printer
                        .style('n')
                        .size(0, 0)
                        .feed(1)
                        .text(`Review us: ${billData.googleReviewLink.replace('https://', '')}`);
                }

                if (billData.instagramLink) {
                    printer
                        .style('n')
                        .size(0, 0)
                        .feed(1)
                        .text(`Insta: @${billData.instagramLink.split('/').filter(Boolean).pop()}`);
                }

                printer
                    .feed(3)
                    .cut()
                    .close();

                resolve("Print success");
            });

        } catch (err) {
            console.error("Printing Exception:", err);
            // Fallback for dev: If usb throws because no driver, log it.
            resolve("Mock Print: Printer not detected (Dev Mode)");
        }
    });
});
