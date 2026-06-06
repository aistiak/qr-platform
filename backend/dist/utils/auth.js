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
exports.requireSessionAuth = requireSessionAuth;
exports.requireApiTokenAuth = requireApiTokenAuth;
exports.requireApiScope = requireApiScope;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repositories/user.repository");
const api_token_service_1 = require("../services/api-token.service");
exports.SESSION_COOKIE_NAME = 'qr_session';
const apiTokenService = new api_token_service_1.ApiTokenService();
const userRepository = new user_repository_1.UserRepository();
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
            req.authType = 'session';
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
function requireSessionAuth(req, res, next) {
    if (!req.user || req.authType !== 'session') {
        res.status(401).json({ error: 'Session authentication required' });
        return;
    }
    next();
}
function getBearerToken(req) {
    const authorization = req.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return null;
    }
    return authorization.slice('Bearer '.length).trim() || null;
}
async function requireApiTokenAuth(req, res, next) {
    try {
        const token = getBearerToken(req);
        if (!token) {
            res.status(401).json({ error: 'Bearer token required' });
            return;
        }
        const authenticated = await apiTokenService.authenticate(token);
        if (!authenticated) {
            res.status(401).json({ error: 'Invalid or expired API token' });
            return;
        }
        const user = await userRepository.findById(authenticated.userId);
        if (!user) {
            res.status(401).json({ error: 'Invalid API token user' });
            return;
        }
        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
        };
        req.apiToken = { id: authenticated.tokenId, scopes: authenticated.scopes };
        req.authType = 'api_token';
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired API token' });
    }
}
function requireApiScope(scope) {
    return (req, res, next) => {
        if (!req.apiToken || req.authType !== 'api_token') {
            res.status(401).json({ error: 'API token authentication required' });
            return;
        }
        if (!req.apiToken.scopes.includes(scope)) {
            res.status(403).json({ error: `Missing required scope: ${scope}` });
            return;
        }
        next();
    };
}
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}
