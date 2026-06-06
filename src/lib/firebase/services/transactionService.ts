import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    QueryConstraint
} from "firebase/firestore";
import { db } from "../firebase";

export interface Transaction {
    id: string;
    type: 'expense' | 'income' | 'transfer';
    amount: number; // minor units
    currency: string;
    date: Timestamp;
    yearMonth: string; // "YYYY-MM"
    categoryId?: string;
    accountId: string;
    toAccountId?: string;
    merchant?: string;
    notes?: string;
    searchKeywords?: string[]; // for basic search
}

export type TransactionFilter = {
    month?: string; // YYYY-MM
    type?: string;
    categoryId?: string;
    accountId?: string;
    limit?: number;
}

export const TransactionService = {
    async getTransactions(uid: string, filter: TransactionFilter): Promise<Transaction[]> {
        const constraints: QueryConstraint[] = [];

        // Basic filtering
        if (filter.month) constraints.push(where("yearMonth", "==", filter.month));
        if (filter.type) constraints.push(where("type", "==", filter.type));
        if (filter.categoryId) constraints.push(where("categoryId", "==", filter.categoryId));
        if (filter.accountId) constraints.push(where("accountId", "==", filter.accountId));

        // Ordering
        // Note: requires composite indexes if multiple filters are used with sorting
        constraints.push(orderBy("date", "desc"));

        if (filter.limit) constraints.push(limit(filter.limit));

        const q = query(collection(db, `users/${uid}/transactions`), ...constraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    },

    async addTransaction(uid: string, data: Omit<Transaction, 'id'>): Promise<string> {
        // Helper to generate keywords if needed
        const searchKeywords = [
            ...(data.merchant?.toLowerCase().split(" ") || []),
            ...(data.notes?.toLowerCase().split(" ") || [])
        ].filter(Boolean);

        const docRef = await addDoc(collection(db, `users/${uid}/transactions`), {
            ...data,
            searchKeywords,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateTransaction(uid: string, id: string, data: Partial<Transaction>): Promise<void> {
        const docRef = doc(db, `users/${uid}/transactions`, id);
        await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    },

    async deleteTransaction(uid: string, id: string): Promise<void> {
        const docRef = doc(db, `users/${uid}/transactions`, id);
        await deleteDoc(docRef);
    },

    async getMonthlyStats(uid: string, month: string): Promise<{ income: number; expense: number; net: number }> {
        const txs = await this.getTransactions(uid, { month });
        let income = 0;
        let expense = 0;
        txs.forEach(t => {
            if (t.type === 'income') income += t.amount;
            if (t.type === 'expense') expense += t.amount;
        });
        return { income, expense, net: income - expense };
    }
};
