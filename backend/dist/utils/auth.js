"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_COOKIE_NAME = void 0;
exports.signSessionToken = signSessionToken;
exports.verifySessionToken = verifySessionToken;
exports.setSessionCookie = setSessionCookie;
exports.clearSessionCookie = clearSessionCookie;
exports.attachSessionUser = attachSessionUser;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.SESSION_COOKIE_NAME = 'qr_session';
function getSessionSecret() {
    return process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'change-this-secret';
}
function signSessionToken(user) {
    const token = { user };
    return jsonwebtoken_1.default.sign(token, getSessionSecret(), { expiresIn: '30d' });
}
function verifySessionToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, getSessionSecret());
        return decoded.user;
    }
    catch {
        return null;
    }
}
function setSessionCookie(res, token) {
    res.cookie(exports.SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
}
function clearSessionCookie(res) {
    res.clearCookie(exports.SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
}
function attachSessionUser(req, _res, next) {
    const token = req.cookies?.[exports.SESSION_COOKIE_NAME];
    if (token) {
        const user = verifySessionToken(token);
        if (user) {
            req.user = user;
        }
    }
    next();
}
function requireAuth(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}
