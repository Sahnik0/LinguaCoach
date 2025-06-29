import { Timestamp } from "firebase/firestore"

export function serializeForFirestore(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Date) {
    return Timestamp.fromDate(data)
  }

  if (Array.isArray(data)) {
    return data.map(serializeForFirestore)
  }

  if (typeof data === "object") {
    const serialized: any = {}
    for (const [key, value] of Object.entries(data)) {
      // Skip functions and symbols
      if (typeof value === "function" || typeof value === "symbol") {
        continue
      }
      serialized[key] = serializeForFirestore(value)
    }
    return serialized
  }

  return data
}

export function deserializeFromFirestore(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Timestamp) {
    return data.toDate()
  }

  if (Array.isArray(data)) {
    return data.map(deserializeFromFirestore)
  }

  if (typeof data === "object") {
    const deserialized: any = {}
    for (const [key, value] of Object.entries(data)) {
      deserialized[key] = deserializeFromFirestore(value)
    }
    return deserialized
  }

  return data
}
