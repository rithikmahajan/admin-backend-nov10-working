import React from 'react';

const SingleProductUpload = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Product Upload Moved
                </h2>
                <p className="text-gray-600 mb-6">
                    Single product upload functionality has been moved to the new item management system.
                </p>
                <a 
                    href="/single-product-upload-new" 
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                    Go to New Product Upload
                </a>
            </div>
        </div>
    );
};

export default SingleProductUpload;
