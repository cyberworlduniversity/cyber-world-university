async function isCurrentAuthorizedRole(tokenRole, allowedRoles, readCurrentRoles) {
  if (!allowedRoles.includes(tokenRole)) return false;
  const currentRoles = await readCurrentRoles();
  return currentRoles.authRole === tokenRole && currentRoles.profileRole === tokenRole;
}

module.exports = { isCurrentAuthorizedRole };
