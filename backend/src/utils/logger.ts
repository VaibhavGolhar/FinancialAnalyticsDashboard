import fs from 'fs';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');
const logFilePath = path.join(logDir, 'app.log');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function getTimeStamp() {
    return new Date().toISOString();
}

export function logInfo(message: string, data?: any) {
    const logMessage = `[INFO] [${getTimeStamp()}] ${message}${data ? ' | ' + JSON.stringify(data) : ''}\n`;
    fs.appendFileSync(logFilePath, logMessage);
}

export function logError(message: string, error?: any) {
    const logMessage = `[ERROR] [${getTimeStamp()}] ${message}${error ? ' | ' + JSON.stringify(error) : ''}\n`;
    fs.appendFileSync(logFilePath, logMessage);
}
