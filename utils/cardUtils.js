import { collection, addDoc, doc, updateDoc, deleteDoc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Get user's saved cards
export const getSavedCards = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Check if user document exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return [];
    }

    // Return saved cards if they exist, otherwise return empty array
    return userDoc.data().savedCards || [];
  } catch (error) {
    console.error('Error getting saved cards:', error);
    throw error;
  }
};

// Save a new card
export const saveCard = async cardData => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Mask card number for security - only keep last 4 digits
    const maskedCardNumber = maskCardNumber(cardData.cardNumber);

    const newCard = {
      id: Date.now().toString(),
      cardNumber: maskedCardNumber,
      cardholderName: cardData.cardholderName,
      expiryDate: cardData.expiryDate,
      lastFourDigits: cardData.cardNumber.slice(-4),
      cardType: getCardType(cardData.cardNumber),
      createdAt: new Date().toISOString()
    };

    // Check if user document exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user document with the card
      await setDoc(userRef, {
        savedCards: [newCard]
      });
    } else {
      // Get existing saved cards
      const existingCards = userDoc.data().savedCards || [];

      // Update user document with new card
      await updateDoc(userRef, {
        savedCards: [...existingCards, newCard]
      });
    }

    return newCard;
  } catch (error) {
    console.error('Error saving card:', error);
    throw error;
  }
};

// Delete a saved card
export const deleteCard = async cardId => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    // Get existing saved cards
    const existingCards = userDoc.data().savedCards || [];

    // Filter out the card to delete
    const updatedCards = existingCards.filter(card => card.id !== cardId);

    // Update user document
    await updateDoc(userRef, {
      savedCards: updatedCards
    });

    return true;
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
};

// Helpers for card validation and formatting

// Mask card number (for security)
const maskCardNumber = cardNumber => {
  // Keep only last 4 digits visible
  const lastFour = cardNumber.slice(-4);
  const masked = '•'.repeat(cardNumber.length - 4) + lastFour;
  return masked;
};

// Format card number with spaces
export const formatCardNumber = cardNumber => {
  const digits = cardNumber.replace(/\D/g, '');
  const groups = [];

  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.substring(i, i + 4));
  }

  return groups.join(' ');
};

// Determine card type based on number
export const getCardType = cardNumber => {
  const number = cardNumber.replace(/\D/g, '');

  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(?:011|5)/.test(number)) return 'Discover';

  return 'Card';
};

// Validate card number (basic Luhn algorithm)
export const validateCardNumber = cardNumber => {
  const digits = cardNumber.replace(/\D/g, '');

  // Check if card number has valid length
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

// Validate expiry date
export const validateExpiryDate = expiryDate => {
  // Expected format: MM/YY
  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return false;
  }

  const [month, year] = expiryDate.split('/');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const cardMonth = parseInt(month, 10);
  const cardYear = parseInt(year, 10);

  // Check if month is valid
  if (cardMonth < 1 || cardMonth > 12) {
    return false;
  }

  // Check if card is expired
  if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
    return false;
  }

  return true;
};
