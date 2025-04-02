import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap';
import { CheckCircle2, CreditCard, AlertTriangle, ArrowLeft, Gift, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from '@/components/Reuseable/Link';
import Layout from '@/components/Layout/Layout';
import PageTitle from '@/components/Reuseable/PageTitle';
import Header from '@/components/Header/Header';
import { useRouter } from 'next/router';

const PaymentSuccessPage = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Log the session ID when available and set page as loaded
    if (router.isReady) {
      if (session_id) {
        console.log("Payment session ID:", session_id);
        // Here you would typically call an API to verify the payment
        // For now, we're just logging it
      }
      setIsLoaded(true);
    }
  }, [router.isReady, session_id]);

  if (!isLoaded) {
    return (
      <Layout>
        <Header />
        <PageTitle title="Success" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying your payment...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-green-500 shadow-2xl">
        <div className="relative h-16 bg-gradient-to-r from-green-400 to-green-600">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-full border-4 border-green-500"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </motion.div>
        </div>

        <CardHeader className="pt-20 text-center">
          <CardTitle className="text-2xl font-bold text-green-700">
            Payment Successful
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Thank you for supporting this project!
          </p>
        </CardHeader>

        <CardBody className="space-y-6">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="text-center text-green-800">
              <p className="font-medium">Your transaction was completed successfully</p>
            </div>
          </div>

          {/* Milestone shipping information note */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <div className="flex">
              <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-800 ml-3">
                <span className="font-medium">Important:</span> If you invested in a milestone with physical rewards, 
                please visit the Rewards page to add your shipping address for delivery.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-yellow-800 ml-3">
                Please note: Stripe processing fees (2.9% + $0.30) and platform maintenance costs (2%)
                are included in this transaction and are non-refundable as per our terms of service.
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            {/* Rewards button */}
            <Link
              href="/reward"
              className="w-full bg-purple-600 text-white font-medium py-2 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <Gift className="mr-2 w-5 h-5" />
              Manage Rewards & Shipping
            </Link>
            
            <Link
              href="/transaction"
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <CreditCard className="mr-2 w-5 h-5" />
              Manage Transactions
            </Link>

            <Link
              href="/projects-1"
              className="w-full border border-gray-300 bg-white text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="mr-2 w-5 h-5" />
              Back to Projects
            </Link>
          </div>
          <Link
            href="/contact"
            className="text-center text-gray-500 text-sm">
            Need assistance? Contact our support team for help.
          </Link>
        </CardBody>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;