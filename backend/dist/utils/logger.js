"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }
    info(message, context) {
        if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOGGING === 'true') {
            console.log(this.formatMessage('info', message, context));
        }
    }
    warn(message, context) {
        console.warn(this.formatMessage('warn', message, context));
    }
    error(message, error, context) {
        const errorContext = {
            ...context,
            error: error instanceof Error
                ? { message: error.message, stack: error.stack, name: error.name }
                : error,
        };
        console.error(this.formatMessage('error', message, errorContext));
    }
    auth(message, context) {
        this.info(`[AUTH] ${message}`, { ...context, category: 'authentication' });
    }
    qrCode(message, context) {
        this.info(`[QR_CODE] ${message}`, { ...context, category: 'qr_code' });
    }
    admin(message, context) {
        this.info(`[ADMIN] ${message}`, { ...context, category: 'admin' });
    }
}
exports.logger = new Logger();
