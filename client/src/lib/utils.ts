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
