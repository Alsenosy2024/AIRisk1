import admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { InsertUser } from '@shared/schema';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as admin.ServiceAccount),
  });
}

// Type definitions
declare global {
  namespace Express {
    interface Request {
      firebaseUser?: admin.auth.DecodedIdToken;
    }
  }
}

// Middleware to verify Firebase token
export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.firebaseUser = decodedToken;
      next();
    } catch (error) {
      console.error('Error verifying Firebase token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error in Firebase auth middleware:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Find or create user from Firebase user data
export const findOrCreateUser = async (
  firebaseUid: string,
  email: string,
  displayName: string
) => {
  try {
    // Try to find a user by firebase_uid
    let user = await storage.getUserByFirebaseUid(firebaseUid);

    // If user doesn't exist, create one
    if (!user) {
      // Check if user with this email already exists
      user = await storage.getUserByEmail(email);

      if (user) {
        // Update existing user with Firebase UID
        user = await storage.updateUserFirebaseUid(user.id, firebaseUid);
      } else {
        // Create new user
        const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);
        
        const newUser: InsertUser = {
          username,
          name: displayName || username,
          email,
          firebase_uid: firebaseUid,
          role: 'Viewer', // Default role for new users
          password: '', // No password for Firebase auth users
        };
        
        user = await storage.createUser(newUser);
      }
    }

    return user;
  } catch (error) {
    console.error('Error finding or creating user:', error);
    throw error;
  }
};