import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, getDocs } from 'firebase/firestore';

// Collection references
const loyaltyProgramCollection = collection(db, 'loyaltyProgram');
const userCollection = collection(db, 'users');

// Get the loyalty program configuration
export const getLoyaltyProgram = async () => {
  try {
    const snapshot = await getDocs(loyaltyProgramCollection);
    return snapshot.docs[0]?.data() || null;
  } catch (error) {
    console.error('Error getting loyalty program:', error);
    return null;
  }
};

// Update the loyalty program configuration
export const updateLoyaltyProgram = async data => {
  try {
    const programDocs = await getDocs(loyaltyProgramCollection);
    if (programDocs.empty) {
      await addDoc(loyaltyProgramCollection, data);
    } else {
      await updateDoc(doc(db, 'loyaltyProgram', programDocs.docs[0].id), data);
    }
    return true;
  } catch (error) {
    console.error('Error updating loyalty program:', error);
    throw error;
  }
};

// Get a user's loyalty checkins
export const getUserLoyaltyCheckins = async userId => {
  try {
    const userRef = doc(userCollection, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {};
    }

    const userData = userDoc.data();
    return userData.loyaltyCheckins || {};
  } catch (error) {
    console.error('Error getting user loyalty checkins:', error);
    return {};
  }
};

// Check in a user for today
export const checkInUser = async userId => {
  try {
    // Get current month in format MM-YYYY
    const now = new Date();
    const currentDay = now.getDate();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const currentMonth = `${month}-${year}`;

    // Get user's current checkins
    const userRef = doc(userCollection, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return false;
    }

    // Update user's checkins
    const userData = userDoc.data();
    const loyaltyCheckins = userData.loyaltyCheckins || {};
    const monthlyCheckins = loyaltyCheckins[currentMonth] || [];

    // Check if already checked in today
    if (monthlyCheckins.includes(currentDay)) {
      return true; // Already checked in
    }

    // Add today's check-in
    const updatedCheckins = [...monthlyCheckins, currentDay];

    await updateDoc(userRef, {
      [`loyaltyCheckins.${currentMonth}`]: updatedCheckins
    });

    return true;
  } catch (error) {
    console.error('Error checking in user:', error);
    return false;
  }
};

// Automatically check in a user when they complete an order
export const checkInUserWithOrder = async orderId => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) return false;

    return await checkInUser(auth.currentUser.uid);
  } catch (error) {
    console.error('Error checking in user with order:', error);
    return false;
  }
};

// Check if a user has completed the loyalty program for the current month
export const hasCompletedLoyaltyProgram = async userId => {
  try {
    // Get loyalty program requirements
    const program = await getLoyaltyProgram();
    if (!program || !program.daysRequiredForReward) {
      return false;
    }

    // Get current month in format MM-YYYY
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const currentMonth = `${month}-${year}`;

    // Get user's checkins
    const checkins = await getUserLoyaltyCheckins(userId);
    const monthlyCheckins = checkins[currentMonth] || [];

    return monthlyCheckins.length >= program.daysRequiredForReward;
  } catch (error) {
    console.error('Error checking if user completed loyalty program:', error);
    return false;
  }
};

// Get the current user's reward status
export const getUserRewardStatus = async () => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) return null;

    const userId = auth.currentUser.uid;
    const program = await getLoyaltyProgram();

    if (!program) {
      return {
        completed: false,
        progress: 0,
        daysRemaining: 0,
        reward: null
      };
    }

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const currentMonth = `${month}-${year}`;

    const checkins = await getUserLoyaltyCheckins(userId);
    const monthlyCheckins = checkins[currentMonth] || [];

    const completed = monthlyCheckins.length >= program.daysRequiredForReward;
    const progress = Math.min(100, (monthlyCheckins.length / program.daysRequiredForReward) * 100);
    const daysRemaining = Math.max(0, program.daysRequiredForReward - monthlyCheckins.length);

    return {
      completed,
      progress,
      daysRemaining,
      reward: program.reward,
      checkins: monthlyCheckins,
      daysRequired: program.daysRequiredForReward
    };
  } catch (error) {
    console.error('Error getting user reward status:', error);
    return null;
  }
};

// Generate an array of days in the current month
export const getDaysInMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: lastDay }, (_, i) => i + 1);
};
