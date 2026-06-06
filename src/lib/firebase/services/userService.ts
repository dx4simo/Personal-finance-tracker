import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    currency: string;
    timezone: string;
    createdAt: Timestamp;
}

const DEFAULT_CURRENCY = "EGP";
const DEFAULT_TIMEZONE = "Africa/Cairo";

export const UserService = {
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    },

    async createUserProfile(uid: string, email: string, displayName?: string): Promise<UserProfile> {
        const docRef = doc(db, "users", uid);

        const newProfile: UserProfile = {
            uid,
            email,
            displayName: displayName || "",
            currency: DEFAULT_CURRENCY,
            timezone: DEFAULT_TIMEZONE,
            createdAt: serverTimestamp() as Timestamp,
        };

        await setDoc(docRef, newProfile);
        return newProfile;
    },

    async ensureUserProfile(uid: string, email: string, displayName?: string): Promise<UserProfile> {
        const profile = await this.getUserProfile(uid);
        if (profile) return profile;
        return this.createUserProfile(uid, email, displayName);
    }
};
