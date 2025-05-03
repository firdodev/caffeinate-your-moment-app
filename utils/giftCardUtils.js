import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Gift card collection reference
const giftCardsCollection = collection(db, 'giftCards');

// Create a new gift card
export const createGiftCard = async data => {
  try {
    await addDoc(giftCardsCollection, {
      ...data,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    throw error;
  }
};

// Listen for real-time updates to all gift cards
export const getGiftCards = callback => {
  return onSnapshot(giftCardsCollection, snapshot => {
    const giftCards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(giftCards);
  });
};

// Update a gift card (e.g., mark as redeemed)
export const updateGiftCard = async (id, data) => {
  try {
    await updateDoc(doc(db, 'giftCards', id), data);
  } catch (error) {
    throw error;
  }
};

// Delete a gift card
export const deleteGiftCard = async id => {
  try {
    await deleteDoc(doc(db, 'giftCards', id));
  } catch (error) {
    throw error;
  }
};

// Redeem a gift card and update user balance
export const redeemGiftCard = async code => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    // Find gift card by code
    const giftCardsSnapshot = await getDocs(
      query(giftCardsCollection, where('code', '==', code), where('isActive', '==', true))
    );

    if (giftCardsSnapshot.empty) {
      throw new Error('Invalid or already redeemed gift card');
    }

    const giftCard = giftCardsSnapshot.docs[0];
    const amount = giftCard.data().amount;

    // Update gift card status
    await updateGiftCard(giftCard.id, { isActive: false });

    // Update user balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, { balance: amount });
    } else {
      const currentBalance = userDoc.data().balance || 0;
      await updateDoc(userRef, { balance: currentBalance + amount });
    }

    return { success: true, amount };
  } catch (error) {
    throw error;
  }
};

// Get user balance
export const getUserBalance = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return 0;
    }

    return userDoc.data().balance || 0;
  } catch (error) {
    throw error;
  }
};

// Update user balance
export const updateUserBalance = async amount => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, { balance: amount });
    } else {
      await updateDoc(userRef, { balance: amount });
    }
  } catch (error) {
    throw error;
  }
};
