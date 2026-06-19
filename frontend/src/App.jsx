import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
 
import SplashPage       from "./pages/SplashPage";
import LoginPage        from "./pages/LoginPage";
import SignupPage       from "./pages/SignupPage";
import VerifyPage       from "./pages/VerifyPage";
import PendingPage      from "./pages/PendingPage";
import HomePage         from "./pages/HomePage";
import RideDetailPage   from "./pages/RideDetailPage";
import PostRidePage     from "./pages/PostRidePage";
import RideRequestsPage from "./pages/RideRequestsPage";
import MyRequestsPage   from "./pages/MyRequestsPage";
import MessagesPage     from "./pages/MessagesPage";
import ChatPage         from "./pages/ChatPage";
import ActiveRidePage   from "./pages/ActiveRidePage";
import RatePage         from "./pages/RatePage";
import ProfilePage      from "./pages/ProfilePage";
 
// Requires the user to be logged in (token exists).
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
 
// PROTOTYPE: verification check removed — any logged-in user can access.
// In production, restore: if (!user.is_verified) return <Navigate to="/pending" replace />
function RequireVerified({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
 
// PROTOTYPE: verification check removed for drivers too.
// In production, restore the is_verified check before the role check.
function RequireDriver({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "driver") return <Navigate to="/home" replace />;
  return children;
}
 
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"        element={<SplashPage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/signup"  element={<SignupPage />} />
      <Route path="/verify"  element={<RequireAuth><VerifyPage /></RequireAuth>} />
      <Route path="/pending" element={<RequireAuth><PendingPage /></RequireAuth>} />
 
      {/* Any logged-in user */}
      <Route path="/home"                    element={<RequireVerified><HomePage /></RequireVerified>} />
      <Route path="/rides/:rideId"           element={<RequireVerified><RideDetailPage /></RequireVerified>} />
      <Route path="/messages"                element={<RequireVerified><MessagesPage /></RequireVerified>} />
      <Route path="/messages/:threadId"      element={<RequireVerified><ChatPage /></RequireVerified>} />
      <Route path="/requests"                element={<RequireVerified><MyRequestsPage /></RequireVerified>} />
      <Route path="/active-ride/:requestId"  element={<RequireVerified><ActiveRidePage /></RequireVerified>} />
      <Route path="/rate/:requestId"         element={<RequireVerified><RatePage /></RequireVerified>} />
      <Route path="/profile"                 element={<RequireVerified><ProfilePage /></RequireVerified>} />
 
      {/* Driver only */}
      <Route path="/post-ride"               element={<RequireDriver><PostRidePage /></RequireDriver>} />
      <Route path="/rides/:rideId/requests"  element={<RequireDriver><RideRequestsPage /></RequireDriver>} />
      <Route path="/my-rides"                element={<RequireDriver><HomePage /></RequireDriver>} />
 
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
 
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
