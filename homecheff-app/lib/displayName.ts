/**
 * Utility functions for displaying user names based on user preferences
 */

export interface User {
  id?: string | null;
  name?: string | null;
  username?: string | null;
  displayFullName?: boolean | null;
  displayNameOption?: string | null;
}

/**
 * Get display name based on user preferences
 */
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return 'Onbekend';
  
  // If displayFullName is false, don't show name at all
  if (user.displayFullName === false) {
    return 'Anoniem';
  }
  
  // Check displayNameOption preference
  if (user.displayNameOption === 'username' && user.username) {
    return user.username;
  }
  
  if (user.displayNameOption === 'first' && user.name) {
    return user.name.split(' ')[0];
  }
  
  if (user.displayNameOption === 'last' && user.name) {
    const nameParts = user.name.split(' ');
    return nameParts[nameParts.length - 1];
  }
  
  if (user.displayNameOption === 'none') {
    return 'Anoniem';
  }
  
  // Default to full name or username
  return user.name || user.username || 'Onbekend';
}

/**
 * Get display name with fallback for public display
 */
export function getPublicDisplayName(user: User | null | undefined): string {
  if (!user) return 'Onbekend';
  
  // For public display, respect privacy settings but show something
  if (user.displayFullName === false) {
    return 'Anoniem';
  }
  
  if (user.displayNameOption === 'none') {
    return 'Anoniem';
  }
  
  return getDisplayName(user);
}

/**
 * Check if user name should be clickable (not anonymous)
 */
export function isNameClickable(user: User | null | undefined): boolean {
  if (!user) return false;
  
  if (user.displayFullName === false) return false;
  if (user.displayNameOption === 'none') return false;
  
  return true;
}
