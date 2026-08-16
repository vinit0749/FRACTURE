import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const defaultOptions = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
};

function createLimiter(options = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    ...defaultOptions,
    ...options,
  });
}

export const generalApiLimiter = createLimiter({
  limit: 300,
});

export const usernameCheckLimiter = createLimiter({
  limit: 30,
  message: {
    message: "Too many username checks. Please try again later.",
  },
});

export const userWriteLimiter = createLimiter({
  limit: 60,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

export const profileUpdateLimiter = createLimiter({
  limit: 20,
  message: {
    message: "Too many profile updates. Please try again later.",
  },
});

// ================================
// Profile Picture Upload Limiter
// ================================

export const profileUploadLimiter = createLimiter({
  limit: 10,
  message: {
    message: "Too many profile picture uploads. Please try again later.",
  },
});

export const fortunaChatLimiter = createLimiter({
  limit: 20,
  message: {
    message: "Too many FORTUNA requests. Please try again later.",
  },
  keyGenerator: (req) => req.user?.uid || ipKeyGenerator(req),
});

export const fortunaDiscoveryLimiter = createLimiter({
  limit: 15,
  message: {
    message: "Too many FORTUNA discovery requests. Please try again later.",
  },
  keyGenerator: (req) => req.user?.uid || ipKeyGenerator(req),
});

export const fortunaHistoryLimiter = createLimiter({
  limit: 60,
  message: {
    message: "Too many FORTUNA history requests. Please try again later.",
  },
  keyGenerator: (req) => req.user?.uid || ipKeyGenerator(req),
});
