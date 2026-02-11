import { customAlphabet } from 'nanoid';

/**
 * Generates a unique Order ID in the format: HHZ-YYYYMMDD-XXXX
 * - HHZ: Store Prefix
 * - YYYYMMDD: Date string
 * - XXXX: 4-character unique alphanumeric suffix
 */
export const generateOrderId = () => {
    const prefix = 'HHZ';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Custom alphabet for upper case letters and numbers to avoid confusing characters
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4);
    const suffix = nanoid();

    return `${prefix}-${dateStr}-${suffix}`;
};

/**
 * Validates if a status change is allowed or if it's the same status.
 */
export const isStatusTransitionValid = (currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return false;

    // Define logical flows if necessary, otherwise allow admin full control
    // For now, allow any transition except same status
    return true;
};
