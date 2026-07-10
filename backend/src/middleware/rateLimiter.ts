import { Request, Response, NextFunction } from 'express';

const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (limit: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const requestData = ipRequestCounts.get(ip);

    if (!requestData || now > requestData.resetTime) {
      ipRequestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (requestData.count >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      });
    }

    requestData.count++;
    next();
  };
};
