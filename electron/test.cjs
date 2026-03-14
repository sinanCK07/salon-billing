const { app } = require('electron');
console.log('TEST: app is', typeof app);
if (app) {
    console.log('TEST: Success! Electron environment detected.');
    app.quit();
} else {
    console.log('TEST: Failure! require("electron") did not return app.');
    process.exit(1);
}
