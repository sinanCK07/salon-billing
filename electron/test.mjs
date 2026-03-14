import { app } from 'electron';
console.log('ESM TEST: app is', typeof app);
if (app) {
    console.log('ESM TEST: Success!');
    app.quit();
} else {
    console.log('ESM TEST: Failure!');
    process.exit(1);
}
