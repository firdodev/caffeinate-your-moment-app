import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Create the loyalty context
const LoyaltyContext = createContext();

// Custom hook to use the loyalty context
export const useLoyalty = () => useContext(LoyaltyContext);

// Collection references
const loyaltyProgramCollection = collection(db, 'loyaltyProgram');
const userCollection = collection(db, 'users');

export const LoyaltyProvider = ({ children }) => {
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [loyaltyProgram, setLoyaltyProgram] = useState(null);
  const [userCheckins, setUserCheckins] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    // Set current month in format "MM-YYYY"
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    setCurrentMonth(`${month}-${year}`);

    // Get the loyalty program configuration
    const unsubscribeLoyalty = onSnapshot(loyaltyProgramCollection, snapshot => {
      const program = snapshot.docs[0]?.data();
      if (program) {
        setLoyaltyProgram(program);
      }
      setLoading(false);
    });

    return () => unsubscribeLoyalty();
  }, []);

  // Listen for changes to the current user's loyalty data
  useEffect(() => {
    if (!auth.currentUser) {
      setUserCheckins([]);
      return;
    }

    const userRef = doc(userCollection, auth.currentUser.uid);

    const unsubscribeUser = onSnapshot(userRef, docSnapshot => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        // Get the checkins for the current month
        const monthlyCheckins = userData.loyaltyCheckins?.[currentMonth] || [];
        setUserCheckins(monthlyCheckins);
      } else {
        setUserCheckins([]);
      }
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, [auth.currentUser, currentMonth]);

  // Get the current day of the month
  const getCurrentDay = () => {
    return new Date().getDate();
  };

  // Check if user has checked in today
  const hasCheckedInToday = () => {
    const today = getCurrentDay();
    return userCheckins.includes(today);
  };

  // Get the percentage completion for the month
  const getCompletionPercentage = () => {
    if (!loyaltyProgram || !loyaltyProgram.daysRequiredForReward) {
      return 0;
    }

    const checkinCount = userCheckins.length;
    return Math.min(100, (checkinCount / loyaltyProgram.daysRequiredForReward) * 100);
  };

  // Get days remaining for reward
  const getDaysRemainingForReward = () => {
    if (!loyaltyProgram || !loyaltyProgram.daysRequiredForReward) {
      return 0;
    }

    const checkinCount = userCheckins.length;
    return Math.max(0, loyaltyProgram.daysRequiredForReward - checkinCount);
  };

  // Has earned reward
  const hasEarnedReward = () => {
    if (!loyaltyProgram || !loyaltyProgram.daysRequiredForReward) {
      return false;
    }

    return userCheckins.length >= loyaltyProgram.daysRequiredForReward;
  };

  // Refresh loyalty data
  const refreshLoyaltyData = async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(userCollection, auth.currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const monthlyCheckins = userData.loyaltyCheckins?.[currentMonth] || [];
        setUserCheckins(monthlyCheckins);
      }
    } catch (error) {
      console.error('Error refreshing loyalty data:', error);
    }
  };

  return (
    <LoyaltyContext.Provider
      value={{
        loading,
        loyaltyProgram,
        userCheckins,
        currentMonth,
        hasCheckedInToday,
        getCompletionPercentage,
        getDaysRemainingForReward,
        hasEarnedReward,
        refreshLoyaltyData
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export default LoyaltyContext;
