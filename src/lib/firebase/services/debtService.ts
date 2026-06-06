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
    runTransaction,
    serverTimestamp,
    Timestamp,
    getDoc
} from "firebase/firestore";
import { db } from "../firebase";

export interface Debt {
    id: string;
    creditorName: string;
    principalAmount: number; // minor units
    remainingAmount: number; // minor units
    status: 'active' | 'paid' | 'overdue' | 'paused';
    startDate: Timestamp;
    dueDate?: Timestamp;
    nextDueDate?: Timestamp;
    notes?: string;
}

export interface DebtPayment {
    id: string;
    amount: number;
    date: Timestamp;
    accountId?: string;
    notes?: string;
    debtId: string;
}

export const DebtService = {
    async getDebts(uid: string, status?: string): Promise<Debt[]> {
        let q = query(collection(db, `users/${uid}/debts`));
        if (status && status !== 'all') {
            q = query(q, where('status', '==', status));
        }
        // Simple client side ordering for MVP if complex index needed
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt));
    },

    async getDebt(uid: string, debtId: string): Promise<Debt | null> {
        const docRef = doc(db, `users/${uid}/debts`, debtId);
        const snap = await getDoc(docRef);
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Debt;
        return null;
    },

    async addDebt(uid: string, data: Omit<Debt, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, `users/${uid}/debts`), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async addPayment(uid: string, debtId: string, payment: Omit<DebtPayment, 'id' | 'debtId'>): Promise<void> {
        await runTransaction(db, async (transaction) => {
            const debtRef = doc(db, `users/${uid}/debts`, debtId);
            const debtSnap = await transaction.get(debtRef);

            if (!debtSnap.exists()) throw new Error("Debt does not exist!");

            const debt = debtSnap.data() as Debt;
            const newRemaining = Math.max(0, debt.remainingAmount - payment.amount);
            const newStatus = newRemaining === 0 ? 'paid' : debt.status;

            // 1. Add Payment Record
            const paymentRef = doc(collection(db, `users/${uid}/debts/${debtId}/payments`));
            transaction.set(paymentRef, {
                ...payment,
                debtId,
                createdAt: serverTimestamp()
            });

            // 2. Update Debt
            transaction.update(debtRef, {
                remainingAmount: newRemaining,
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            // 3. Optional: Add a Transaction record in global transactions if accountId exists?
            // For MVP we just keep payment record inside debt. 
            // If user wants it in main transaction list, we should add it there too.
            // Let's stick to debt-specific payments for now to avoid duplications or complexity.
        });
    },

    async getPayments(uid: string, debtId: string): Promise<DebtPayment[]> {
        const q = query(collection(db, `users/${uid}/debts/${debtId}/payments`), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DebtPayment));
    },

    async deleteDebt(uid: string, debtId: string): Promise<void> {
        const docRef = doc(db, `users/${uid}/debts`, debtId);
        await deleteDoc(docRef);
    }
};
