const rateLimits = new Map();

function rateLimit(options) {
    const windowMs = options.windowMs || 60 * 1000;
    const max = options.max || 5;
    const message = options.message || 'Too many requests, please try again later.';

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const key = `${req.route.path}:${ip}`;
        
        const now = Date.now();
        if (!rateLimits.has(key)) {
            rateLimits.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        const record = rateLimits.get(key);
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
            return next();
        }

        record.count++;
        if (record.count > max) {
            return res.status(429).json({ error: message });
        }

        next();
    };
}

module.exports = rateLimit;
