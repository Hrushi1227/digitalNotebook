import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "./firebase";

// -------------- GENERIC FIRESTORE HELPERS -----------------

// Load entire collection once
export const loadCollection = async (name) => {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Add new item
export const addItem = async (name, data) => {
  try {
    const docRef = await addDoc(collection(db, name), data);
    return docRef;
  } catch (error) {
    console.error("[DEBUG] Firestore addItem error:", error);
    throw error;
  }
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

// -------------- FIREBASE STORAGE HELPERS -----------------

// List all files from Firestore tracking (avoids CORS issues)
export const listStorageFiles = async () => {
  try {
    // Get all documents that have files (using dataUrl for base64 embedded files)
    const documents = await loadCollection("documents");

    // Get all materials that have bill files
    const materials = await loadCollection("materials");

    const files = [];

    // Add documents (they use dataUrl field for embedded base64)
    documents.forEach((doc) => {
      if (doc.dataUrl) {
        files.push({
          id: doc.id,
          name: doc.name || "Unknown",
          fullPath: doc.dataUrl,
          size: doc.size || 0,
          contentType: doc.type || "application/octet-stream",
          timeCreated: doc.createdAt || doc.date || new Date().toISOString(),
          updated: doc.updatedAt || doc.createdAt || new Date().toISOString(),
          url: doc.dataUrl,
          folder: "documents",
          source: "documents",
          sourceId: doc.id,
          isBase64: true,
        });
      }
    });

    // Add material bills (they also use dataUrl inside billFile object)
    materials.forEach((material) => {
      if (material.billFile && material.billFile.dataUrl) {
        files.push({
          id: material.id + "_bill",
          name:
            material.billFile.name ||
            `Bill_${material.billNumber || material.name}`,
          fullPath: material.billFile.dataUrl,
          size: material.billFile.size || 0,
          contentType: material.billFile.type || "application/octet-stream",
          timeCreated:
            material.createdAt || material.date || new Date().toISOString(),
          updated:
            material.updatedAt ||
            material.createdAt ||
            new Date().toISOString(),
          url: material.billFile.dataUrl,
          folder: "material-bills",
          source: "materials",
          sourceId: material.id,
          isBase64: true,
        });
      }
    });

    // Sort by date (newest first)
    files.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));

    return files;
  } catch (error) {
    console.error("Error listing storage files:", error);
    throw error;
  }
};

// Delete a file from Firestore (base64 embedded files)
export const deleteStorageFile = async (filePath, source, sourceId) => {
  try {
    // For base64 files embedded in Firestore, we just remove the document or field
    // (no separate storage to delete from)
    if (source === "documents") {
      await deleteItem("documents", sourceId);
    } else if (source === "materials") {
      await updateItem("materials", sourceId, {
        billFile: null,
      });
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

// Get storage statistics
export const getStorageStats = async (files) => {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const fileCount = files.length;

  return {
    totalSize,
    fileCount,
  };
};
