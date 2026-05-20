"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateQRCodeAccess = aggregateQRCodeAccess;
exports.getTotalAccessCount = getTotalAccessCount;
const mongoose_1 = __importDefault(require("mongoose"));
const QRCodeAccess_1 = __importDefault(require("../models/QRCodeAccess"));
function getStartDate(period) {
    const now = new Date();
    const start = new Date(now);
    if (period === 'day') {
        start.setHours(0, 0, 0, 0);
    }
    else if (period === 'week') {
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
    }
    else {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }
    return start;
}
function formatDateForGrouping(date, period) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekNumber = Math.ceil((weekStart.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        return `${year}-W${weekNumber}`;
    }
    if (period === 'month') {
        return `${year}-${month}`;
    }
    return `${year}-${month}-${day}`;
}
async function aggregateQRCodeAccess(qrCodeId, period = 'day') {
    const startDate = getStartDate(period);
    const endDate = new Date();
    const accesses = await QRCodeAccess_1.default.find({
        qrCodeId: new mongoose_1.default.Types.ObjectId(qrCodeId),
        timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: 1 });
    const aggregatedData = new Map();
    accesses.forEach((access) => {
        const key = formatDateForGrouping(access.timestamp, period);
        aggregatedData.set(key, (aggregatedData.get(key) || 0) + 1);
    });
    const dataPoints = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
        const key = formatDateForGrouping(cursor, period);
        dataPoints.push({ date: key, count: aggregatedData.get(key) || 0 });
        if (period === 'day')
            cursor.setDate(cursor.getDate() + 1);
        else if (period === 'week')
            cursor.setDate(cursor.getDate() + 7);
        else
            cursor.setMonth(cursor.getMonth() + 1);
    }
    return {
        total: accesses.length,
        period,
        dataPoints,
        startDate,
        endDate,
    };
}
async function getTotalAccessCount(qrCodeId) {
    try {
        return await QRCodeAccess_1.default.countDocuments({ qrCodeId: new mongoose_1.default.Types.ObjectId(qrCodeId) });
    }
    catch {
        return 0;
    }
}
