"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCodeBuffer = generateQRCodeBuffer;
exports.generateQRCodeSVG = generateQRCodeSVG;
const qrcode_1 = __importDefault(require("qrcode"));
const DEFAULT_OPTIONS = {
    size: 512,
    margin: 2,
    errorCorrectionLevel: 'H',
};
async function generateQRCodeBuffer(data, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    return qrcode_1.default.toBuffer(data, {
        width: opts.size,
        margin: opts.margin,
        errorCorrectionLevel: opts.errorCorrectionLevel,
    });
}
async function generateQRCodeSVG(data, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    return qrcode_1.default.toString(data, {
        type: 'svg',
        width: opts.size,
        margin: opts.margin,
        errorCorrectionLevel: opts.errorCorrectionLevel,
    });
}
