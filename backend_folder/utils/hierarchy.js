// /utils/hierarchy.js

// Allowed direct child per role
const CHILD_BY_ROLE = {
    Federal: 'Region',
    Region: 'Zone',
    Zone: 'Woreda',
    Woreda: 'Kebele',
    Kebele: 'Farmer' // farmer is not an admin, but kept here to validate
};

function childRoleOf(role) {
    return CHILD_BY_ROLE[role] || null;
}

// Build WHERE clause parts to restrict by the acting admin's scope
function scopeFilterForAdmins(user) {
    // Federal sees all
    if (user.role === 'Federal') return { where: '1=1', params: [] };

    if (user.role === 'Region') {
        return { where: 'a.region_id = ?', params: [user.region_id] };
    }
    if (user.role === 'Zone') {
        return { where: 'a.zone_id = ?', params: [user.zone_id] };
    }
    if (user.role === 'Woreda') {
        return { where: 'a.woreda_id = ?', params: [user.woreda_id] };
    }
    if (user.role === 'Kebele') {
        // Kebele has no admin children; return empty on list (controller will handle)
        return { where: '1=0', params: [] };
    }
    return { where: '1=0', params: [] };
}

// Validate the new admin’s role is exactly one level below the creator
function canCreateRole(creatorRole, newRole) {
    return childRoleOf(creatorRole) === newRole;
}

module.exports = {
    childRoleOf,
    scopeFilterForAdmins,
    canCreateRole
};