// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Return mock user for tests
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    }
    callback(mockUser)
    return jest.fn() // Return unsubscribe function
  }),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({})),
}))

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}))

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  })),
  usePathname: jest.fn(() => '/'),
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:5000/api'
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIzaSyBvp48A7w4vCai5T3tt29KLylJ9X_ZLubA'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'smart-auth-68b91.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'smart-auth-68b91'

// Global test utilities
global.fetch = jest.fn()

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
