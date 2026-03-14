const electron = require('electron');
console.log('Final Test - type:', typeof electron);
console.log('Final Test - keys:', Object.keys(electron));
try {
    const { app } = electron;
    console.log('Final Test - app:', typeof app);
} catch (e) {
    console.log('Final Test - Error accessing app:', e.message);
}
process.exit(0);
