import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// -------------- GENERIC FIRESTORE HELPERS -----------------

// Load entire collection once
export const loadCollection = async (name) => {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Add new item
export const addItem = async (name, data) => {
  return await addDoc(collection(db, name), data);
};

// Update item
export const updateItem = async (name, id, data) => {
  const ref = doc(db, name, id);
  return await updateDoc(ref, data);
};

// Delete item
export const deleteItem = async (name, id) => {
  const ref = doc(db, name, id);
  return await deleteDoc(ref);
};

// Realtime listener
export const listenCollection = (name, callback) => {
  return onSnapshot(collection(db, name), (snapshot) => {
    const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(arr);
  });
};
