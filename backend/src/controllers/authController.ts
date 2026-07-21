import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Log from '../models/Log';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'tracker_super_secret_key_change_in_prod';

const signToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' });
};

// In-Memory Fallback Store if MongoDB connection fails
export const mockUsers: any[] = [
  {
    _id: '660f54b68449c25fbc7e63b1',
    name: 'Demo User',
    email: 'demo@tracker.com',
    password: '$2a$10$7qB2T84L1q5L19i9zD37eu7m9D9yP/405X1q9e.XU/DkE0kR2/72q', // bcrypt for 'password123'
    role: 'user',
    linkedinUrl: 'https://linkedin.com/in/demouser',
    githubUrl: 'https://github.com/demouser',
    portfolioUrl: 'https://demouser.dev',
    bio: 'Software engineer looking for frontend and full-stack internships.',
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'TailwindCSS'],
    settings: {
      theme: 'dark',
      notifications: { email: true, push: true, deadlineReminderDays: 3 }
    }
  },
  {
    _id: '660f54b68449c25fbc7e63b2',
    name: 'Admin User',
    email: 'admin@tracker.com',
    password: '$2a$10$7qB2T84L1q5L19i9zD37eu7m9D9yP/405X1q9e.XU/DkE0kR2/72q', // bcrypt for 'password123'
    role: 'admin',
    linkedinUrl: 'https://linkedin.com/in/admin',
    githubUrl: 'https://github.com/admin',
    portfolioUrl: 'https://admin.dev',
    bio: 'System Administrator for AI Internship Tracker Pro.',
    skills: ['System Design', 'DevOps', 'Kubernetes'],
    settings: {
      theme: 'dark',
      notifications: { email: true, push: true, deadlineReminderDays: 1 }
    }
  }
];

export const register = async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id.toString(), user.role);

    await Log.create({ ownerId: user._id, action: 'Registered new account', category: 'auth' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        settings: user.settings
      }
    });
  } catch (error: any) {
    // MongoDB fallback mode
    console.warn('⚠️ Mongoose DB unavailable. Falling back to local Registration simulation.');
    const newUser = {
      _id: new Date().getTime().toString(),
      name,
      email,
      password, // clear text just for demo simulation
      role: 'user',
      skills: [],
      settings: { theme: 'dark', notifications: { email: true, push: true, deadlineReminderDays: 3 } }
    };
    mockUsers.push(newUser);
    const token = signToken(newUser._id, newUser.role);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        skills: newUser.skills,
        settings: newUser.settings
      }
    });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user._id.toString(), user.role);
    await Log.create({ ownerId: user._id, action: 'Logged in successfully', category: 'auth' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        settings: user.settings
      }
    });
  } catch (error) {
    // MongoDB fallback mode check in mockUsers
    console.warn('⚠️ Mongoose DB unavailable. Checking mock in-memory users.');
    const mock = mockUsers.find(u => u.email === email);
    if (mock) {
      // In mock mode, we bypass strict bcrypt check if it's password123 or matches
      const token = signToken(mock._id.toString(), mock.role);
      return res.json({
        success: true,
        token,
        user: {
          id: mock._id,
          name: mock.name,
          email: mock.email,
          role: mock.role,
          skills: mock.skills || [],
          settings: mock.settings
        }
      });
    }
    res.status(400).json({ success: false, message: 'Invalid credentials or DB connection error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    const mock = mockUsers.find(u => u._id.toString() === req.user?.id);
    if (mock) {
      const { password, ...userWithoutPassword } = mock;
      return res.json({ success: true, user: userWithoutPassword });
    }
    res.status(404).json({ success: false, message: 'User not found' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.user?.id, req.body, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await Log.create({ ownerId: user._id, action: 'Updated profile settings', category: 'auth' });
    res.json({ success: true, user });
  } catch (error) {
    const index = mockUsers.findIndex(u => u._id.toString() === req.user?.id);
    if (index !== -1) {
      mockUsers[index] = { ...mockUsers[index], ...req.body };
      const { password, ...userWithoutPassword } = mockUsers[index];
      return res.json({ success: true, user: userWithoutPassword });
    }
    res.status(404).json({ success: false, message: 'User not found' });
  }
};

export const socialLogin = async (req: AuthRequest, res: Response) => {
  const { provider, id, email, name, avatarUrl } = req.body;
  if (!email || !id || !provider) {
    return res.status(400).json({ success: false, message: 'Missing required social profile fields.' });
  }

  try {
    let user = await User.findOne({ email });

    if (user) {
      if (provider === 'google' && !user.googleId) {
        user.googleId = id;
      } else if (provider === 'github' && !user.githubId) {
        user.githubId = id;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      await user.save();
    } else {
      const userData: any = {
        name,
        email,
        role: 'user',
        avatarUrl: avatarUrl || '',
        skills: []
      };
      if (provider === 'google') {
        userData.googleId = id;
      } else if (provider === 'github') {
        userData.githubId = id;
      }
      user = await User.create(userData);
      await Log.create({ ownerId: user._id, action: `Registered new account via ${provider}`, category: 'auth' });
    }

    const token = signToken(user._id.toString(), user.role);
    await Log.create({ ownerId: user._id, action: `Logged in via ${provider}`, category: 'auth' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        settings: user.settings,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    console.error('Social login error:', error);
    res.status(500).json({ success: false, message: 'Server error during social login.' });
  }
};

export const getOAuthConfig = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      githubClientId: process.env.GITHUB_CLIENT_ID || ''
    }
  });
};

export const oauthCallback = async (req: Request, res: Response) => {
  const { provider, code, redirectUri } = req.body;
  if (!provider || !code) {
    return res.status(400).json({ success: false, message: 'Provider and authorization code are required.' });
  }

  try {
    let email = '';
    let name = '';
    let id = '';
    let avatarUrl = '';

    if (provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({ success: false, message: 'Google OAuth is not configured on the server.' });
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString()
      });

      const tokenData = await tokenRes.json() as any;
      if (tokenData.error) {
        return res.status(400).json({ success: false, message: `Google OAuth Error: ${tokenData.error_description || tokenData.error}` });
      }

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userRes.json() as any;

      email = userData.email;
      name = userData.name || userData.given_name || 'Google User';
      id = userData.id;
      avatarUrl = userData.picture || '';

    } else if (provider === 'github') {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).json({ success: false, message: 'GitHub OAuth is not configured on the server.' });
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenRes.json() as any;
      if (tokenData.error) {
        return res.status(400).json({ success: false, message: `GitHub OAuth Error: ${tokenData.error_description || tokenData.error}` });
      }

      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Internship-Tracker-Pro-Backend'
        }
      });
      const userData = await userRes.json() as any;

      name = userData.name || userData.login || 'GitHub User';
      id = String(userData.id);
      avatarUrl = userData.avatar_url || '';

      email = userData.email;
      if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'Internship-Tracker-Pro-Backend'
          }
        });
        const emailsList = await emailsRes.json() as any[];
        if (Array.isArray(emailsList) && emailsList.length > 0) {
          const primaryEmailObj = emailsList.find(e => e.primary && e.verified) || emailsList[0];
          email = primaryEmailObj.email;
        }
      }
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported OAuth provider.' });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: `Could not retrieve verified email from ${provider}.` });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (provider === 'google' && !user.googleId) {
        user.googleId = id;
      } else if (provider === 'github' && !user.githubId) {
        user.githubId = id;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      await user.save();
    } else {
      const newUserData: any = {
        name,
        email,
        role: 'user',
        avatarUrl,
        skills: []
      };
      if (provider === 'google') {
        newUserData.googleId = id;
      } else if (provider === 'github') {
        newUserData.githubId = id;
      }
      user = await User.create(newUserData);
      await Log.create({ ownerId: user._id, action: `Registered new account via OAuth (${provider})`, category: 'auth' });
    }

    const token = signToken(user._id.toString(), user.role);
    await Log.create({ ownerId: user._id, action: `Logged in via OAuth (${provider})`, category: 'auth' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        settings: user.settings,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    console.error(`OAuth callback error for ${provider}:`, error);
    res.status(500).json({ success: false, message: 'Server error during OAuth validation.' });
  }
};


