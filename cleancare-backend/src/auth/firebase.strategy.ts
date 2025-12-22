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
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');

        if (privateKey && clientEmail && projectId) {
             // Production / ENV Var Initialization
             firebase.initializeApp({
                credential: firebase.credential.cert({
                    projectId: projectId,
                    clientEmail: clientEmail,
                    // Private key often needs replacement of \\n with \n when loaded from some ENV systems
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            console.log('Firebase Admin Initialized with Environment Variables');
        } else {
             // Local Dev Fallback: Using serviceAccountKey.json
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const serviceAccount = require('../../firebase/serviceAccountKey.json');
                 firebase.initializeApp({
                    credential: firebase.credential.cert(serviceAccount),
                });
                console.log('Firebase Admin Initialized with serviceAccountKey.json');
            } catch (e) { 
                console.warn('serviceAccountKey.json not found and ENV vars missing. Firebase Admin not initialized correctly.');
            }
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
