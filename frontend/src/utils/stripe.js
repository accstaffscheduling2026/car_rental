import { loadStripe } from '@stripe/stripe-js';

// Single shared Stripe instance — imported by any component that needs it.
// Defined here (not in App.jsx) to avoid circular imports.
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
