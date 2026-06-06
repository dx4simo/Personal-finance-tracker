import {
    collection,
    doc,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    getDoc,
    updateDoc,
    QueryDocumentSnapshot,
    DocumentData
} from "firebase/firestore";
import { db } from "../firebase";

export type BeneficiaryPriority = 'high' | 'medium' | 'low';

export interface Beneficiary {
    id: string;
    name: string;
    totalAmount: number; // minor units
    priority: BeneficiaryPriority; // Default: 'medium'
    createdAt: Timestamp;
}

export interface BeneficiaryRecord {
    id: string;
    amount: number; // minor units
    date: Timestamp;
    notes?: string;
    beneficiaryId: string;
}

export const BeneficiaryService = {
    async getBeneficiaries(uid: string): Promise<Beneficiary[]> {
        const q = query(collection(db, `users/${uid}/beneficiaries`), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as Omit<Beneficiary, 'id'>;
            return {
                id: doc.id,
                ...data,
                priority: data.priority || 'medium' // Backwards compatibility
            };
        });
    },

    async getBeneficiary(uid: string, id: string): Promise<Beneficiary | null> {
        const docRef = doc(db, `users/${uid}/beneficiaries`, id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        const data = snap.data() as Omit<Beneficiary, 'id'>;
        return {
            id: snap.id,
            ...data,
            priority: data.priority || 'medium'
        };
    },

    async addBeneficiary(uid: string, name: string, priority: BeneficiaryPriority = 'medium'): Promise<string> {
        const docRef = await addDoc(collection(db, `users/${uid}/beneficiaries`), {
            name,
            totalAmount: 0,
            priority,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async addRecord(uid: string, beneficiaryId: string, amount: number, date: Date, notes?: string): Promise<void> {
        // 1. Add Record
        await addDoc(collection(db, `users/${uid}/beneficiaries/${beneficiaryId}/records`), {
            amount,
            date: Timestamp.fromDate(date),
            notes,
            beneficiaryId,
            createdAt: serverTimestamp()
        });

        // 2. Update Total (Client-side recalc or increment? Firestore increment is better but simple read/write for MVP)
        // Getting current total
        const bDoc = await getDoc(doc(db, `users/${uid}/beneficiaries`, beneficiaryId));
        if (bDoc.exists()) {
            const data = bDoc.data() as Beneficiary;
            const current = data.totalAmount || 0;
            await updateDoc(doc(db, `users/${uid}/beneficiaries`, beneficiaryId), {
                totalAmount: current + amount
            });
        }
    },

    async updateBeneficiary(uid: string, id: string, data: { name?: string; priority?: BeneficiaryPriority }): Promise<void> {
        const docRef = doc(db, `users/${uid}/beneficiaries`, id);
        await updateDoc(docRef, data);
    },

    async getRecords(uid: string, beneficiaryId: string): Promise<BeneficiaryRecord[]> {
        const q = query(collection(db, `users/${uid}/beneficiaries/${beneficiaryId}/records`), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as BeneficiaryRecord));
    },

    async updateRecord(uid: string, beneficiaryId: string, recordId: string, data: { amount: number; date: Date; notes?: string }): Promise<void> {
        const recordRef = doc(db, `users/${uid}/beneficiaries/${beneficiaryId}/records`, recordId);
        const recordSnap = await getDoc(recordRef);

        if (!recordSnap.exists()) throw new Error("Record not found");

        const recordData = recordSnap.data() as BeneficiaryRecord;
        const oldAmount = recordData.amount || 0;
        const diff = data.amount - oldAmount;

        // 1. Update Record
        await updateDoc(recordRef, {
            amount: data.amount,
            date: Timestamp.fromDate(data.date),
            notes: data.notes
        });

        // 2. Update Total if amount changed
        if (diff !== 0) {
            const bDoc = await getDoc(doc(db, `users/${uid}/beneficiaries`, beneficiaryId));
            if (bDoc.exists()) {
                const bData = bDoc.data() as Beneficiary;
                const currentTotal = bData.totalAmount || 0;
                await updateDoc(doc(db, `users/${uid}/beneficiaries`, beneficiaryId), {
                    totalAmount: currentTotal + diff
                });
            }
        }
    },

    async getMonthlyTotal(uid: string, year: number, month: number): Promise<number> {
        // Note: This is an expensive operation as it queries all records across all subcollections.
        // A better approach for scale would be a top-level 'transactions' collection or a monthly_aggregates collection.
        // For now, we will use a Collection Group Query if possible, or iterate beneficiaries (safer for hierarchy security without index setup).

        // Iterating beneficiaries approach (safer for now to avoid needing new indexes deployed):
        const beneficiaries = await this.getBeneficiaries(uid);
        let total = 0;

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        // We'll fetch records for each beneficiary. 
        // Ideally we'd use `Promise.all` but let's be careful with connection limits if there are many.
        const promises = beneficiaries.map(async (b: Beneficiary) => {
            const q = query(
                collection(db, `users/${uid}/beneficiaries/${b.id}/records`),
                where("date", ">=", startDate),
                where("date", "<=", endDate)
            );
            const snap = await getDocs(q);
            snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
                const data = d.data() as BeneficiaryRecord;
                total += (data.amount || 0);
            });
        });

        await Promise.all(promises);
        return total;
    }
};
