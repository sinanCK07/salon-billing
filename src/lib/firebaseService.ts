import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Bill } from '../context/BillHistoryContext';
import type { SalonSettings } from '../context/SalonSettingsContext';

type PredefinedService = SalonSettings['predefinedServices'][number];

export const firebaseService = {
    // Bills sync
    subscribeToBills: (callback: (bills: Bill[]) => void) => {
        const q = query(collection(db, 'bills'), orderBy('date', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
            callback(bills);
        });
    },

    saveBill: async (bill: Bill) => {
        await setDoc(doc(db, 'bills', bill.id), bill);
    },

    // Predefined Services sync
    subscribeToServices: (callback: (services: PredefinedService[]) => void) => {
        const q = collection(db, 'services');
        return onSnapshot(q, (snapshot) => {
            const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PredefinedService));
            callback(services);
        });
    },

    saveService: async (service: PredefinedService) => {
        await setDoc(doc(db, 'services', service.id), service);
    },

    deleteService: async (id: string) => {
        await deleteDoc(doc(db, 'services', id));
    }
};
