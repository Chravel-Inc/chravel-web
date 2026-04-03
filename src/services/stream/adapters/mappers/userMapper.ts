/**
 * User Mapper
 *
 * Transforms Chravel user profiles to Stream user objects.
 */

export interface ChrravelUserProfile {
  userId: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  email?: string;
}

export interface StreamUserData {
  id: string;
  name: string;
  image?: string;
}

/**
 * Convert a Chravel user profile to a Stream user object.
 */
export function chravelUserToStream(profile: ChrravelUserProfile): StreamUserData {
  return {
    id: profile.userId,
    name: profile.displayName,
    image: profile.avatarUrl || undefined,
  };
}
