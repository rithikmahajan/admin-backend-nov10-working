import React, { useState, useEffect } from 'react';

const NetworkDebug = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, result, error = null) => {
    setTestResults(prev => [...prev, { test, result, error, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    // Test 1: Basic API connectivity
    try {
      const response = await fetch('http://localhost:8001/api/health');
      const data = await response.json();
      addResult('API Health Check', `✅ SUCCESS - ${data.message}`);
    } catch (error) {
      addResult('API Health Check', '❌ FAILED', error.message);
    }

    // Test 2: CORS Test
    try {
      const response = await fetch('http://localhost:8001/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      addResult('CORS Test (GET Categories)', `✅ SUCCESS - Found ${data.data?.length || 0} categories`);
    } catch (error) {
      addResult('CORS Test (GET Categories)', '❌ FAILED', error.message);
    }

    // Test 3: Auth Token Test
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await fetch('http://localhost:8001/api/categories', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        addResult('Auth Token Test', `✅ SUCCESS - Token valid, ${data.data?.length || 0} categories`);
      } catch (error) {
        addResult('Auth Token Test', '❌ FAILED', error.message);
      }
    } else {
      addResult('Auth Token Test', '⚠️  NO TOKEN - Please login first');
    }

    // Test 4: Test Login
    try {
      const response = await fetch('http://localhost:8001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phNo: '7006114695',
          password: 'R@2727thik'
        })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        addResult('Login Test', `✅ SUCCESS - Logged in as ${data.data.user.name}`);
      } else {
        addResult('Login Test', '❌ FAILED', data.message);
      }
    } catch (error) {
      addResult('Login Test', '❌ FAILED', error.message);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Network Debug Tool</h1>
      <p className="text-gray-600 mb-6">This tool helps diagnose network connectivity issues with the backend API.</p>
      
      <button 
        onClick={runTests} 
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-6"
      >
        {loading ? 'Running Tests...' : 'Run Network Tests'}
      </button>

      <div className="space-y-3">
        {testResults.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{result.test}</h3>
              <span className="text-sm text-gray-500">{result.timestamp}</span>
            </div>
            <p className="text-sm mb-2">{result.result}</p>
            {result.error && (
              <p className="text-red-600 text-xs bg-red-50 p-2 rounded">
                Error: {result.error}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Current Configuration:</h3>
        <ul className="text-sm space-y-1">
          <li><strong>Frontend URL:</strong> {window.location.origin}</li>
          <li><strong>API Base URL:</strong> http://localhost:8001/api</li>
          <li><strong>Has Auth Token:</strong> {localStorage.getItem('authToken') ? '✅ Yes' : '❌ No'}</li>
          <li><strong>User Data:</strong> {localStorage.getItem('userData') ? '✅ Yes' : '❌ No'}</li>
        </ul>
      </div>
    </div>
  );
};

export default NetworkDebug;
