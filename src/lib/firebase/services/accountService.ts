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

export interface Account {
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'credit';
    balance: number; // minor units
    isDefault?: boolean;
}

export const AccountService = {
    async getAccounts(uid: string): Promise<Account[]> {
        const q = query(collection(db, `users/${uid}/accounts`));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as Omit<Account, 'id'>;
            return { id: doc.id, ...data };
        });
    },

    async addAccount(uid: string, account: Omit<Account, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, `users/${uid}/accounts`), {
            ...account,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateAccount(uid: string, accountId: string, updates: Partial<Account>): Promise<void> {
        const docRef = doc(db, `users/${uid}/accounts`, accountId);
        await updateDoc(docRef, updates);
    },

    async deleteAccount(uid: string, accountId: string): Promise<void> {
        const docRef = doc(db, `users/${uid}/accounts`, accountId);
        await deleteDoc(docRef);
    }
};
