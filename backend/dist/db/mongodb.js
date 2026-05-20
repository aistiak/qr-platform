"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const cached = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
    global.mongoose = cached;
}
function getMongoUri() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('Please define MONGODB_URI in environment');
    }
    return mongoUri;
}
async function connectDB() {
    const mongoUri = getMongoUri();
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        cached.promise = mongoose_1.default.connect(mongoUri, { bufferCommands: false });
    }
    try {
        cached.conn = await cached.promise;
    }
    catch (error) {
        cached.promise = null;
        throw error;
    }
    return cached.conn;
}
