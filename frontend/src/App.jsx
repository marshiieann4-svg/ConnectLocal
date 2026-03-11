import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateService from './pages/CreateService';
import Verification from './pages/Verification';
import Profile from './pages/Profile';
import SearchHelpers from './pages/SearchHelpers';
import AdminDashboard from './pages/adminDashboard';
import ServiceDetails from './pages/ServiceDetails';
import OrgDashboard from './pages/OrgDashboard';
import Clients from './pages/Clients';
import AddClient from './pages/AddClient';
import ClientDetail from './pages/ClientDetail';
import Assignments from './pages/Assignments';
import AssignmentDetail from './pages/AssignmentDetail';
import Leaderboard from './pages/Leaderboard';
import ConversationsList from './components/chat/ConversationsList';
import ChatWindow from './components/chat/ChatWindow';
import TransactionHistory from './pages/TransactionHistory';
import PaymentResult from './pages/PaymentResult';
import { getDefaultRouteForUser, getStoredUser } from './utils/auth';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const rootDestination = getDefaultRouteForUser(getStoredUser());

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes with Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-service"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateService />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute>
              <Layout>
                <Verification />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
          }
 />
        <Route
          path="/search-helpers"
          element={
            <ProtectedRoute>
              <Layout>
                <SearchHelpers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/service/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ServiceDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/org-dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <OrgDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Layout>
                <Clients />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <ProtectedRoute>
              <Layout>
                <AddClient />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ClientDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Layout>
                <Assignments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <AssignmentDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Leaderboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Chat routes – protected and inside Layout */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <ConversationsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatWindow />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Payment routes */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Layout>
                <TransactionHistory />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/:id/success"
          element={
            <ProtectedRoute>
              <Layout>
                <PaymentResult />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/:id/cancel"
          element={
            <ProtectedRoute>
              <Layout>
                <PaymentResult />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            localStorage.getItem('token') ? (
              <Navigate to={rootDestination} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;