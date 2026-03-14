import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Query,
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";

export { serverTimestamp };

export const colRef = (path: string) => collection(db, path);
export const docRef = (path: string, id: string) => doc(db, path, id);

export async function addDocument(path: string, data: DocumentData) {
  return await addDoc(collection(db, path), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDocument(path: string, id: string, data: Partial<DocumentData>) {
  await updateDoc(doc(db, path, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(path: string, id: string) {
  await deleteDoc(doc(db, path, id));
}

export async function getDocument(path: string, id: string) {
  const snap = await getDoc(doc(db, path, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getCollection(path: string) {
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export { query, where, orderBy, onSnapshot };
