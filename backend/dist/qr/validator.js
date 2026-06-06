"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateURL = validateURL;
const zod_1 = require("zod");
const urlSchema = zod_1.z.string().url('Please provide a valid URL');
function validateURL(url) {
    try {
        urlSchema.parse(url);
        return { valid: true };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return { valid: false, error: error.errors[0].message };
        }
        return { valid: false, error: 'Invalid URL format' };
    }
}
