const roleHierarchy = {
    'Federal': 'Region',
    'Region': 'Zone',
    'Zone': 'Woreda',
    'Woreda': 'Kebele',
    'Kebele': 'Farmer'
};

module.exports = (req, res, next) => {
    const creatorRole = req.user.role;
    const { role: targetRole } = req.body;

    if (!roleHierarchy[creatorRole] || roleHierarchy[creatorRole] !== targetRole) {
        return res.status(403).json({
            message: `You can only create ${roleHierarchy[creatorRole]} accounts`
        });
    }

    next();
};