import admin, { isFirebaseAdminAvailable } from "../firebase-admin.js";

function authenticateToken(req, res, next) {
  if (!isFirebaseAdminAvailable) {
    return res.status(503).json({
      message: "Authentication service is not configured.",
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required. Please sign in again.",
    });
  }

  const idToken = authHeader.substring("Bearer ".length).trim();

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    })
    .catch(() => {
      console.warn("Firebase ID token verification failed.");
      res.status(401).json({
        message: "Invalid or expired token. Please sign in again.",
      });
    });
}

export default authenticateToken;
