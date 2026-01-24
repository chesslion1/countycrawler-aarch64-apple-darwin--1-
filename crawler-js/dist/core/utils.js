import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
export function tsStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (d.getFullYear().toString() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) + '-' +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds()));
}
export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
export function jitter(baseMs, factor = 0.3) {
    const amount = Math.floor(baseMs * factor);
    return baseMs + Math.floor(Math.random() * (amount + 1));
}
export async function ensureDataDir(dir) {
    const target = dir ?? 'data';
    if (!existsSync(target)) {
        await mkdir(target, { recursive: true });
    }
    return target;
}
