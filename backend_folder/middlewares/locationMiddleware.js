module.exports = (req, res, next) => {
    req.locationFilter = "";

    switch (req.user.role) {
        case 'Region':
            req.locationFilter = `AND region_name = '${req.user.region_name}'`;
            break;
        case 'Zone':
            req.locationFilter = `AND zone_name = '${req.user.zone_name}'`;
            break;
        case 'Woreda':
            req.locationFilter = `AND woreda_name = '${req.user.woreda_name}'`;
            break;
        case 'Kebele':
            req.locationFilter = `AND kebele_name = '${req.user.kebele_name}'`;
            break;
        default:
            req.locationFilter = "";
    }

    next();
};