import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts various date formats from Firestore to a JavaScript Date object
 * @param dateValue - The date value from Firestore (can be Timestamp, seconds, string, or Date)
 * @returns A valid Date object
 */
export function safeToDate(dateValue: any): Date {
  try {
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue
    }
    
    // If it's a Firestore Timestamp
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate()
    }
    
    // If it's a Timestamp-like object with seconds
    if (dateValue?.seconds && typeof dateValue.seconds === 'number') {
      return new Date(dateValue.seconds * 1000)
    }
    
    // If it's a string or number, try to parse it
    if (dateValue) {
      const parsed = new Date(dateValue)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
    }
    
    // Fallback to current date
    console.warn('Could not parse date value:', dateValue)
    return new Date()
  } catch (error) {
    console.warn('Error converting date:', error, dateValue)
    return new Date()
  }
}

/**
 * Safely formats a date value to a locale string
 * @param dateValue - The date value to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function safeDateFormat(dateValue: any, options?: Intl.DateTimeFormatOptions): string {
  try {
    const date = safeToDate(dateValue)
    return date.toLocaleDateString(undefined, options)
  } catch (error) {
    console.warn('Error formatting date:', error, dateValue)
    return 'Invalid Date'
  }
}
