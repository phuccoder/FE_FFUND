import React from 'react';
import StripeOnboard from '@/components/StripeHandle/StripeOnboard';

/**
 * Page component that wraps the StripeOnboard component
 * This handles the redirect when users return from the Stripe onboarding process
 */
export default function StripeOnboardPage() {
  return <StripeOnboard />;
}