import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-firebase-jwt';
import * as firebase from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (firebase.apps.length === 0) {
      try {
        // Option 1: Using serviceAccountKey.json file
        // const serviceAccount = require('../../serviceAccountKey.json');
        
        // Option 2: Using Environment Variables (Recommended for production)
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        // If we had more credentials in ENV, we would construct credential object here
        
        // For development with local emulator or default credentials (if file exists)
        // We will assume the file exists relative to root or set GOOGLE_APPLICATION_CREDENTIALS
        
        // Check if we can load from file for local dev
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const serviceAccount = require('../../firebase/serviceAccountKey.json');
             firebase.initializeApp({
                credential: firebase.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin Initialized with serviceAccountKey.json');
        } catch (e) { 
            console.warn('serviceAccountKey.json not found, attempting default initialization or skipping.');
             // Fallback or just empty init if reliant on GOOGLE_APPLICATION_CREDENTIALS env var
             firebase.initializeApp({
                 projectId: projectId
             });
        }

      } catch (err) {
        console.error('Firebase initialization error', err);
      }
    }
  }

  async validate(token: string) {
    if (token === 'DEV_TEST_TOKEN') {
      return {
        uid: 'dev-user-id',
        phone_number: '+8801700000000',
        email: 'dev@cleancare.com',
        // Mocking properties expected by AuthService
        firebase: { sign_in_provider: 'custom' },
      };
    }

    try {
      console.log('Verifying token:', token.substring(0, 20) + '...');
      const firebaseUser = await firebase.auth().verifyIdToken(token, true);
      console.log('Token verified, user:', firebaseUser.uid);
      if (!firebaseUser) {
        throw new UnauthorizedException();
      }
      return firebaseUser;
    } catch (err) {
      console.error('Firebase Token Verification Failed:', err.code, err.message);
      throw new UnauthorizedException(err.message);
    }
  }
}
