import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting utility
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};

export const formatPriceWithoutDecimals = (price: number): string => {
  return `₹${Math.round(price)}`;
};
export const getColorHex = (colorName: string) => {
  const colors: { [key: string]: string } = {
    'red': '#ef4444',
    'blue': '#3b82f6',
    'sky blue': '#0ea5e9',
    'navy blue': '#1e3a8a',
    'green': '#22c55e',
    'black': '#000000',
    'white': '#ffffff',
    'pink': '#ec4899',
    'yellow': '#eab308',
    'orange': '#f97316',
    'purple': '#a855f7',
    'grey': '#71717a',
    'gray': '#71717a',
    'brown': '#78350f',
    'beige': '#f5f5dc',
    'maroon': '#800000',
    'teal': '#14b8a6',
    'cyan': '#06b6d4',
    'lavender': '#e6e6fa',
    'mint': '#98ffed',
    'peach': '#ffdab9',
    'ivory': '#fffff0',
    'off white': '#faf9f6',
  };
  return colors[colorName.toLowerCase()] || '#cbd5e1';
};
