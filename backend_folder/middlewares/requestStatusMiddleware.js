const jwt = require("jsonwebtoken");

module.exports = function(allowedStatuses = []) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const tokenParts = authHeader.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            return res.status(401).json({ message: "Invalid token format" });
        }

        const token = tokenParts[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            if (
                allowedStatuses.length &&
                !allowedStatuses.includes(req.body.status)
            ) {
                return res.status(403).json({ message: "Status change not allowed" });
            }

            next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    };
};