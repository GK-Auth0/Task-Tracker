import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { User, UserMetadata } from "../models";
import { getIPGeolocation, parseUserAgent } from "./geolocation";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  ip?: string;
  userAgent?: string;
}

interface LoginDto {
  email: string;
  password: string;
}

export async function registerUser(dto: RegisterDto) {
  const existingUser = await User.findOne({ where: { email: dto.email } });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);

  const user = await User.create({
    email: dto.email,
    password_hash: hashedPassword,
    full_name: `${dto.firstName} ${dto.lastName}`,
    role: "Member",
  });

  // Create user metadata with IP geolocation
  if (dto.ip) {
    const geoData = await getIPGeolocation(dto.ip);
    const userAgentData = dto.userAgent ? parseUserAgent(dto.userAgent) : {};
    
    await UserMetadata.create({
      user_id: user.id,
      ...geoData,
      ...userAgentData,
    });
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);

  const { password_hash, ...userWithoutPassword } = user.get({ plain: true });

  return {
    user: userWithoutPassword,
    token,
  };
}

export async function loginUser(dto: LoginDto) {
  const user = await User.findOne({ where: { email: dto.email } });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    dto.password,
    user.password_hash,
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);

  const { password_hash, ...userWithoutPassword } = user.get({ plain: true });

  return {
    user: userWithoutPassword,
    token,
  };
}

export async function getCurrentUser(userId: string) {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const { password_hash, ...userWithoutPassword } = user.get({ plain: true });
  return userWithoutPassword;
}
interface Auth0SyncDto {
  auth0Id: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function syncAuth0User(dto: Auth0SyncDto) {
  // Check if user already exists by Auth0 ID or email
  let user = await User.findOne({ 
    where: { 
      email: dto.email 
    } 
  });

  if (!user) {
    // Create new user from Auth0 data
    user = await User.create({
      email: dto.email,
      password_hash: '', // Auth0 users don't need password
      full_name: dto.name || dto.email.split('@')[0],
      role: "Member",
    });
  } else {
    // Update existing user with Auth0 data if needed
    if (dto.name && user.full_name !== dto.name) {
      await user.update({ full_name: dto.name });
    }
  }

  // Generate JWT token for the user
  const tokenPayload = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);

  const { password_hash, ...userWithoutPassword } = user.get({ plain: true });
  
  return {
    user: userWithoutPassword,
    token,
  };
}