"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseUrl = getBaseUrl;
exports.getScanUrl = getScanUrl;
function getBaseUrl(request) {
    if (request) {
        const host = request.get('host');
        const protocol = request.get('x-forwarded-proto') || request.protocol || 'http';
        if (host) {
            return `${protocol}://${host}`;
        }
    }
    return process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
}
function getScanUrl(qrCodeId, request) {
    return `${getBaseUrl(request)}/api/scan/${qrCodeId}`;
}
