// middlewares/rateLimitMiddleware.js
const loginAttempts = new Map(); // Store IP addresses and their attempt counts
const blockedIPs = new Map(); // Store blocked IP addresses with timestamps

const MAX_ATTEMPTS = 10;
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window for attempts

// Get client IP address
const getClientIP = (req) => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           '127.0.0.1';
};

// Clean up expired entries
const cleanupExpiredEntries = () => {
    const now = Date.now();
    
    // Clean up expired blocked IPs
    for (const [ip, blockTime] of blockedIPs.entries()) {
        if (now - blockTime > BLOCK_DURATION) {
            blockedIPs.delete(ip);
        }
    }
    
    // Clean up old login attempts
    for (const [ip, data] of loginAttempts.entries()) {
        if (now - data.firstAttempt > ATTEMPT_WINDOW) {
            loginAttempts.delete(ip);
        }
    }
};

// Rate limiting middleware
const rateLimitMiddleware = (req, res, next) => {
    const clientIP = getClientIP(req);
    const now = Date.now();
    
    // Clean up expired entries
    cleanupExpiredEntries();
    
    // Check if IP is currently blocked
    if (blockedIPs.has(clientIP)) {
        const blockTime = blockedIPs.get(clientIP);
        const timeRemaining = BLOCK_DURATION - (now - blockTime);
        
        if (timeRemaining > 0) {
            const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
            return res.status(429).json({
                message: 'IP address temporarily blocked due to too many failed login attempts',
                blocked: true,
                timeRemaining: minutesRemaining,
                retryAfter: new Date(now + timeRemaining).toISOString()
            });
        } else {
            // Block has expired, remove it
            blockedIPs.delete(clientIP);
        }
    }
    
    // Add IP and attempt count to request for use in login handlers
    const attemptData = loginAttempts.get(clientIP) || { count: 0, firstAttempt: now };
    req.loginAttempts = {
        ip: clientIP,
        count: attemptData.count,
        remaining: MAX_ATTEMPTS - attemptData.count
    };
    
    next();
};

// Function to record failed login attempt
const recordFailedAttempt = (req) => {
    const clientIP = getClientIP(req);
    const now = Date.now();
    
    let attemptData = loginAttempts.get(clientIP);
    
    if (!attemptData) {
        attemptData = { count: 1, firstAttempt: now };
    } else {
        // Reset if first attempt was more than 15 minutes ago
        if (now - attemptData.firstAttempt > ATTEMPT_WINDOW) {
            attemptData = { count: 1, firstAttempt: now };
        } else {
            attemptData.count++;
        }
    }
    
    loginAttempts.set(clientIP, attemptData);
    
    // Block IP if max attempts reached
    if (attemptData.count >= MAX_ATTEMPTS) {
        blockedIPs.set(clientIP, now);
        loginAttempts.delete(clientIP); // Remove from attempts as it's now blocked
        
        console.log(`IP ${clientIP} blocked for ${BLOCK_DURATION / (60 * 1000)} minutes after ${MAX_ATTEMPTS} failed attempts`);
        
        return {
            blocked: true,
            message: 'IP address blocked due to too many failed login attempts',
            timeRemaining: Math.ceil(BLOCK_DURATION / (60 * 1000))
        };
    }
    
    return {
        blocked: false,
        attemptsRemaining: MAX_ATTEMPTS - attemptData.count,
        message: `Login failed. ${MAX_ATTEMPTS - attemptData.count} attempts remaining before IP block.`
    };
};

// Function to clear attempts on successful login
const clearAttempts = (req) => {
    const clientIP = getClientIP(req);
    loginAttempts.delete(clientIP);
};

// Function to get current attempt status
const getAttemptStatus = (req) => {
    const clientIP = getClientIP(req);
    const attemptData = loginAttempts.get(clientIP);
    
    if (!attemptData) {
        return { count: 0, remaining: MAX_ATTEMPTS };
    }
    
    return {
        count: attemptData.count,
        remaining: MAX_ATTEMPTS - attemptData.count
    };
};

module.exports = {
    rateLimitMiddleware,
    recordFailedAttempt,
    clearAttempts,
    getAttemptStatus,
    MAX_ATTEMPTS,
    BLOCK_DURATION
};
