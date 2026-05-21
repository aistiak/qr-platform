"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicAppUrl = getPublicAppUrl;
exports.getBaseUrl = getBaseUrl;
exports.getScanUrl = getScanUrl;
function getPublicAppUrl(request) {
    return (process.env.PUBLIC_APP_URL ||
        process.env.FRONTEND_URL ||
        process.env.APP_URL ||
        (request ? `${request.protocol}://${request.get('host')}` : 'http://localhost:3000'));
}
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
    const publicBaseUrl = getPublicAppUrl(request);
    return `${publicBaseUrl}/c/${qrCodeId}`;
}
