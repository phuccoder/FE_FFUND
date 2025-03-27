import React, { useEffect, useState } from 'react';
import { XCircle, RefreshCw, List, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from '@/components/Reuseable/Link';
import Layout from '@/components/Layout/Layout';
import Header from '@/components/Header/Header';
import PageTitle from '@/components/Reuseable/PageTitle';
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap';

const PaymentCancelPage = () => {
    const [previousPaymentUrl, setPreviousPaymentUrl] = useState('/payment');
    const [phaseSelectionUrl, setPhaseSelectionUrl] = useState('/projects');

    // Retrieve payment information from localStorage on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Get stored payment information
            const storedProjectId = localStorage.getItem('paymentProjectId');
            const storedPhaseId = localStorage.getItem('paymentPhaseId');

            // Set the previous payment URL with the stored parameters
            if (storedProjectId && storedPhaseId) {
                setPreviousPaymentUrl(`/payment?projectId=${storedProjectId}&phaseId=${storedPhaseId}`);
            } else if (storedProjectId) {
                setPreviousPaymentUrl(`/payment?projectId=${storedProjectId}`);
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-2 border-red-500 shadow-2xl">
                <div className="relative h-16 bg-gradient-to-r from-red-400 to-red-600">
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-full border-4 border-red-500"
                    >
                        <XCircle className="w-16 h-16 text-red-500" />
                    </motion.div>
                </div>

                <CardHeader className="pt-20 text-center">
                    <CardTitle className="text-2xl font-bold text-red-700">
                        Payment Cancelled
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                        Your payment was not completed
                    </p>
                </CardHeader>

                <CardBody className="space-y-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                        <div className="flex">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                            <div className="ml-3">
                                <p className="text-sm text-yellow-800">
                                    No funds have been deducted from your account. You can try again or select a different milestone or funding amount.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3 pt-2">
                        <Link
                            href={previousPaymentUrl}
                            className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                        >
                            <RefreshCw className="mr-2 w-5 h-5" />
                            Retry Payment
                        </Link>
                        <Link
                            href="/projects"
                            className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
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

export default PaymentCancelPage;