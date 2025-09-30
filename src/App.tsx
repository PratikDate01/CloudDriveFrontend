import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import RealtimeEventsBinder from './components/RealtimeEventsBinder';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load pages for better performance
const Drive = lazy(() => import('./pages/Drive'));
const Profile = lazy(() => import('./pages/Profile'));
const Shared = lazy(() => import('./pages/Shared'));
const Starred = lazy(() => import('./pages/Starred'));
const Trash = lazy(() => import('./pages/Trash'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center mx-auto mb-4">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RealtimeEventsBinder />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                {/* Drive routes with lazy loading */}
                <Route
                  path="/drive"
                  element={
                    <ProtectedRoute>
                      <Drive />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shared"
                  element={
                    <ProtectedRoute>
                      <Shared />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/starred"
                  element={
                    <ProtectedRoute>
                      <Starred />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/trash"
                  element={
                    <ProtectedRoute>
                      <Trash />
                    </ProtectedRoute>
                  }
                />

              </Routes>
            </Suspense>
          </ErrorBoundary>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
