import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  
  // Check localStorage for admin tokens as fallback
  const localAdminToken = localStorage.getItem('adminToken');
  const localUserData = localStorage.getItem('userData');
  let localUser = null;
  
  try {
    if (localUserData) {
      localUser = JSON.parse(localUserData);
    }
  } catch (error) {
    console.error('Error parsing userData from localStorage:', error);
  }
  
  // Determine if user has admin access through Redux or localStorage
  const hasReduxAuth = isAuthenticated && user?.isAdmin;
  const hasLocalAdminAuth = localAdminToken && localUser?.isAdmin;
  const isAdminAuthenticated = hasReduxAuth || hasLocalAdminAuth;
  
  console.log('🛡️ ProtectedRoute - Auth check:', { 
    reduxAuth: { isAuthenticated, userIsAdmin: user?.isAdmin },
    localAuth: { hasToken: !!localAdminToken, userIsAdmin: localUser?.isAdmin },
    finalResult: isAdminAuthenticated
  });
  
  // If not authenticated through either method, redirect to auth page
  if (!isAdminAuthenticated) {
    console.log('🛡️ ProtectedRoute - Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }
  
  // Additional check for non-admin users (only if we have valid auth)
  if (isAdminAuthenticated && !hasReduxAuth && !localUser?.isAdmin) {
    console.log('🛡️ ProtectedRoute - Not admin, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }
  
  console.log('🛡️ ProtectedRoute - Authenticated admin, rendering children');
  // If authenticated and admin, render the protected component
  return children;
};

export default ProtectedRoute;
