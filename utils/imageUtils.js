import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Compress and resize an image for profile but preserve aspect ratio
 * @param {string} uri - The image URI
 * @returns {Promise<string>} - The manipulated image URI
 */
export const processProfileImage = async uri => {
  try {
    // Process image with compression but preserve aspect ratio
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 500 } }], // Only resize width, height will adjust automatically to preserve ratio
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    return manipResult.uri;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

/**
 * Pick an image from the device's library
 * @returns {Promise<string|null>} - The selected image URI or null if canceled
 */
export const pickImage = async () => {
  try {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('We need access to your media library to update your profile picture');
      return null;
    }

    // Launch image picker without forcing 1:1 aspect ratio
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Delete old profile image from Firebase Storage
 * @param {string} photoURL - The URL of the image to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteOldProfileImage = async photoURL => {
  if (!photoURL || !photoURL.includes('firebasestorage.googleapis.com')) {
    return false; // Not a Firebase Storage URL or no image to delete
  }

  try {
    // Extract the path from the URL
    const path = decodeURIComponent(photoURL.split('/o/')[1]?.split('?')[0]);
    if (!path) return false;

    // Create a reference to the file
    const imageRef = ref(storage, path);

    // Delete the file
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    console.error('Error deleting old profile image:', error);
    return false; // Continue with the process even if deletion fails
  }
};

/**
 * Upload an image to Firebase Storage
 * @param {string} uri - The local image URI
 * @param {string} userId - User ID for the file path
 * @returns {Promise<string>} - The download URL
 */
export const uploadImageToFirebase = async (uri, userId) => {
  try {
    // Convert URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create storage reference
    const storageRef = ref(storage, `profileImages/${userId}/${Date.now()}.jpg`);

    // Upload image
    const snapshot = await uploadBytes(storageRef, blob);

    // Get and return download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Update user profile with new image URL
 * @param {string} photoURL - The new profile image URL
 * @returns {Promise<boolean>} - Success status
 */
export const updateUserProfileImage = async photoURL => {
  try {
    if (!auth.currentUser) return false;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { photoURL });

    // Also update auth profile if needed
    // await updateProfile(auth.currentUser, { photoURL });

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Complete profile image update process
 * @returns {Promise<{success: boolean, photoURL?: string, error?: string}>} - Result object
 */
export const updateProfileImage = async () => {
  try {
    // 1. Pick image from gallery
    const imageUri = await pickImage();
    if (!imageUri) return { success: false };

    // 2. Process and compress the image
    const processedUri = await processProfileImage(imageUri);

    // 3. Get current user and user data
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, error: 'User not authenticated' };

    // Get user data to access current photoURL
    const userDoc = await getDoc(doc(db, 'users', userId));
    const currentPhotoURL = userDoc.exists() ? userDoc.data().photoURL : null;

    // 4. Upload new image to Firebase Storage
    const downloadURL = await uploadImageToFirebase(processedUri, userId);

    // 5. Update user profile with new URL
    await updateUserProfileImage(downloadURL);

    // 6. Delete old image if it exists
    if (currentPhotoURL) {
      await deleteOldProfileImage(currentPhotoURL);
    }

    return { success: true, photoURL: downloadURL };
  } catch (error) {
    console.error('Profile image update failed:', error);
    return { success: false, error: error.message };
  }
};
