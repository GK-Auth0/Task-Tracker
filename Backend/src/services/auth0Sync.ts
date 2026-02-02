import { User } from "../models";

export const syncAuth0User = async (auth0User: any) => {
  const { sub, email, name, picture } = auth0User;
  
  try {
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create new user from Auth0 data
      user = await User.create({
        email,
        full_name: name || email.split('@')[0],
        avatar_url: picture,
        role: 'Member',
        password_hash: 'auth0_user' // Placeholder since Auth0 handles authentication
      });
    } else {
      // Update existing user
      await user.update({
        full_name: name || user.full_name,
        avatar_url: picture || user.avatar_url
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error syncing Auth0 user:', error);
    throw error;
  }
};