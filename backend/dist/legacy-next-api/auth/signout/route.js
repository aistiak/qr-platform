"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
async function POST(request) {
    // Sign out is handled client-side via NextAuth
    // This endpoint just confirms the request and clears cookies
    const response = server_1.NextResponse.json({ message: 'Sign out successful' });
    // Clear all possible NextAuth cookies
    const cookies = request.cookies.getAll();
    cookies.forEach((cookie) => {
        if (cookie.name.includes('authjs') || cookie.name.includes('next-auth')) {
            response.cookies.set(cookie.name, '', {
                expires: new Date(0),
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });
        }
    });
    return response;
}
