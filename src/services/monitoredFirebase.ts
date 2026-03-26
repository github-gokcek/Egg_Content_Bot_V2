import { db } from './firebase';
import { firebaseMonitor } from './firebaseMonitor';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  DocumentReference,
  CollectionReference,
  Query
} from 'firebase/firestore';

// Caller'ı otomatik tespit et
function getCaller(): string {
  const stack = new Error().stack;
  if (!stack) return 'unknown';
  
  const lines = stack.split('\n');
  // 3. satır genellikle asıl caller'dır (0: Error, 1: getCaller, 2: wrapper, 3: actual caller)
  if (lines.length > 3) {
    const line = lines[3];
    // Dosya adını ve fonksiyon adını çıkar
    const match = line.match(/at\s+(.+?)\s+\(/);
    if (match) {
      return match[1].trim();
    }
  }
  return 'unknown';
}

// Monitored getDoc
export async function monitoredGetDoc(reference: DocumentReference) {
  const caller = getCaller();
  const collectionName = reference.path.split('/')[0];
  firebaseMonitor.trackRead(collectionName, caller);
  return getDoc(reference);
}

// Monitored getDocs
export async function monitoredGetDocs(query: Query | CollectionReference) {
  const caller = getCaller();
  const collectionName = query instanceof CollectionReference 
    ? query.path 
    : (query as any)._query?.path?.segments?.[0] || 'unknown';
  firebaseMonitor.trackRead(collectionName, caller);
  return getDocs(query);
}

// Monitored setDoc
export async function monitoredSetDoc(reference: DocumentReference, data: any) {
  const caller = getCaller();
  const collectionName = reference.path.split('/')[0];
  firebaseMonitor.trackWrite(collectionName, caller);
  return setDoc(reference, data);
}

// Monitored updateDoc
export async function monitoredUpdateDoc(reference: DocumentReference, data: any) {
  const caller = getCaller();
  const collectionName = reference.path.split('/')[0];
  firebaseMonitor.trackWrite(collectionName, caller);
  return updateDoc(reference, data);
}

// Monitored deleteDoc
export async function monitoredDeleteDoc(reference: DocumentReference) {
  const caller = getCaller();
  const collectionName = reference.path.split('/')[0];
  firebaseMonitor.trackDelete(collectionName, caller);
  return deleteDoc(reference);
}

// Export orijinal fonksiyonlar da (geçiş için)
export { doc, collection, query, where, db };
