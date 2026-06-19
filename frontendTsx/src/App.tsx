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
 
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
 
function RequireVerified({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_verified) return <Navigate to="/pending" replace />;
  return children;
}
 
function RequireDriver({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_verified) return <Navigate to="/pending" replace />;
  if (user.role !== "driver") return <Navigate to="/home" replace />;
  return children;
}
 
function AppRoutes() {
  return (
    <Routes>
      <Route path="/"        element={<SplashPage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/signup"  element={<SignupPage />} />
      <Route path="/verify"  element={<RequireAuth><VerifyPage /></RequireAuth>} />
      <Route path="/pending" element={<RequireAuth><PendingPage /></RequireAuth>} />
      <Route path="/home"    element={<RequireVerified><HomePage /></RequireVerified>} />
      <Route path="/rides/:rideId"  element={<RequireVerified><RideDetailPage /></RequireVerified>} />
      <Route path="/messages"       element={<RequireVerified><MessagesPage /></RequireVerified>} />
      <Route path="/messages/:threadId" element={<RequireVerified><ChatPage /></RequireVerified>} />
      <Route path="/requests"       element={<RequireVerified><MyRequestsPage /></RequireVerified>} />
      <Route path="/active-ride/:requestId" element={<RequireVerified><ActiveRidePage /></RequireVerified>} />
      <Route path="/rate/:requestId" element={<RequireVerified><RatePage /></RequireVerified>} />
      <Route path="/profile" element={<RequireVerified><ProfilePage /></RequireVerified>} />
      <Route path="/post-ride"              element={<RequireDriver><PostRidePage /></RequireDriver>} />
      <Route path="/rides/:rideId/requests" element={<RequireDriver><RideRequestsPage /></RequireDriver>} />
      <Route path="/my-rides"               element={<RequireDriver><HomePage /></RequireDriver>} />
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
