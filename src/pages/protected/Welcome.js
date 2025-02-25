import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../features/common/headerSlice';
import { Link } from 'react-router-dom';
import TemplatePointers from '../../features/user/components/TemplatePointers';

function InternalPage() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle({ title: "Welcome" }));
    }, [dispatch]);

    return (
        <div className="min-h-screen flex justify-center items-start mt-6">
            <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 flex flex-col items-center text-center">
                <TemplatePointers />
                <Link to="/app/dashboard">
                    <button className="mt-4 px-5 py-2.5 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition duration-300 transform hover:scale-105">
                        Get Started 🚀
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default InternalPage;
