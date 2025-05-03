import React, { createContext, useState, useContext, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { getUserBalance } from './giftCardUtils';

// Create context
const BalanceContext = createContext({
  balance: 0,
  loading: true,
  refreshBalance: () => {}
});

// Custom hook to use balance
export const useBalance = () => useContext(BalanceContext);

// Provider component
export const BalanceProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Function to refresh balance on demand
  const refreshBalance = async () => {
    try {
      if (auth.currentUser) {
        const userBalance = await getUserBalance();
        setBalance(userBalance);
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  // Set up real-time listener for balance updates
  useEffect(() => {
    let unsubscribe = () => {};

    const setupBalanceListener = async () => {
      setLoading(true);

      if (auth.currentUser) {
        try {
          // Initial balance fetch
          const initialBalance = await getUserBalance();
          setBalance(initialBalance);

          // Set up listener for real-time updates
          const userRef = doc(db, 'users', auth.currentUser.uid);
          unsubscribe = onSnapshot(
            userRef,
            doc => {
              if (doc.exists()) {
                const userData = doc.data();
                setBalance(userData.balance || 0);
              } else {
                setBalance(0);
              }
              setLoading(false);
            },
            error => {
              console.error('Error listening to balance updates:', error);
              setLoading(false);
            }
          );
        } catch (error) {
          console.error('Error setting up balance listener:', error);
          setLoading(false);
        }
      } else {
        setBalance(0);
        setLoading(false);
      }
    };

    setupBalanceListener();

    // Set up auth state listener
    const authUnsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setupBalanceListener();
      } else {
        unsubscribe(); // Stop listening to previous user
        setBalance(0);
        setLoading(false);
      }
    });

    // Clean up
    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  return <BalanceContext.Provider value={{ balance, loading, refreshBalance }}>{children}</BalanceContext.Provider>;
};
