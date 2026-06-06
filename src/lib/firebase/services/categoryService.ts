import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    QueryDocumentSnapshot,
    DocumentData
} from "firebase/firestore";
import { db } from "../firebase";

export interface Category {
    id: string;
    name: string;
    type: 'expense' | 'income';
    color: string;
    icon: string;
}

export const CategoryService = {
    async getCategories(uid: string): Promise<Category[]> {
        const q = query(collection(db, `users/${uid}/categories`));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as Omit<Category, 'id'>;
            return { id: doc.id, ...data };
        });
    },

    async addCategory(uid: string, category: Omit<Category, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, `users/${uid}/categories`), {
            ...category,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateCategory(uid: string, categoryId: string, updates: Partial<Category>): Promise<void> {
        const docRef = doc(db, `users/${uid}/categories`, categoryId);
        await updateDoc(docRef, updates);
    },

    async deleteCategory(uid: string, categoryId: string): Promise<void> {
        const docRef = doc(db, `users/${uid}/categories`, categoryId);
        await deleteDoc(docRef);
    }
};
