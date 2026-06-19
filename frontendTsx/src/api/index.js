import api from "./client";
 
// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login:  (data) => api.post("/auth/login",  data),
  me:     ()     => api.get("/auth/me"),
  cloudinarySignature: () => api.get("/auth/cloudinary-signature"),
};
 
// ─── Users ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  uploadDocument:      (data)    => api.post("/users/me/documents", data),
  updateCarDetails:    (data)    => api.put("/users/me/car-details", data),
  updateEmergencyContact: (data) => api.put("/users/me/emergency-contact", data),
  getProfile:          (userId)  => api.get(`/users/${userId}`),
};
 
// ─── Rides ────────────────────────────────────────────────────────────────────
export const ridesAPI = {
  postRide:       (data)      => api.post("/rides", data),
  getFeed:        (params)    => api.get("/rides", { params }),
  getRide:        (rideId)    => api.get(`/rides/${rideId}`),
  myPosted:       ()          => api.get("/rides/my/posted"),
  myRequests:     ()          => api.get("/rides/my/requests"),
  requestToJoin:  (rideId, data) => api.post(`/rides/${rideId}/requests`, data),
  getRideRequests:(rideId)    => api.get(`/rides/${rideId}/requests`),
  acceptRequest:  (reqId, data)  => api.post(`/rides/requests/${reqId}/accept`, data),
  declineRequest: (reqId)     => api.post(`/rides/requests/${reqId}/decline`),
  cancelRequest:  (reqId)     => api.post(`/rides/requests/${reqId}/cancel`),
  completeRide:   (rideId)    => api.post(`/rides/${rideId}/complete`),
};
 
// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesAPI = {
  listThreads:  ()           => api.get("/messages/threads"),
  getThread:    (threadId)   => api.get(`/messages/threads/${threadId}`),
  send:         (data)       => api.post("/messages/send", data),
  unreadCount:  ()           => api.get("/messages/unread-count"),
};
 
// ─── Emergency ────────────────────────────────────────────────────────────────
export const emergencyAPI = {
  triggerAlert: (data) => api.post("/emergency/alert", data),
  myAlerts:     ()     => api.get("/emergency/my-alerts"),
};
 
// ─── Ratings ──────────────────────────────────────────────────────────────────
export const ratingsAPI = {
  submit: (data) => api.post("/ratings", data),
};
 
// ─── Cloudinary direct upload ─────────────────────────────────────────────────
export async function uploadToCloudinary(file, docType, signature) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.api_key);
  formData.append("timestamp", signature.timestamp);
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);
 
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloud_name}/auto/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url;
}