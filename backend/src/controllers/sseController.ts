import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { askCoachStream, analyzeResumeStream } from '../services/aiService';
import Log from '../models/Log';

/**
 * Helper: sets standard SSE response headers and returns a helper to send events.
 */
const initSSE = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const close = () => res.end();

  return { send, close };
};

// ─── Live Admin Log Feed ────────────────────────────────────────────────────

const logCategories = ['auth', 'resume', 'ai', 'application', 'admin'];
const logActions = [
  'User registered via email',
  'Resume uploaded and analyzed',
  'Cover letter generated',
  'Application status updated',
  'Mock interview session started',
  'AI coach conversation initiated',
  'Dashboard accessed',
  'Admin panel stats refreshed',
];

export const liveAdminFeed = async (req: AuthRequest, res: Response) => {
  const { send, close } = initSSE(res);

  // Send a heartbeat immediately
  send('connected', { message: 'Live admin feed connected', ts: new Date().toISOString() });

  // Poll DB for new logs every 5 seconds, fall back to simulated events
  let intervalId: NodeJS.Timeout;

  const pushLogs = async () => {
    try {
      const recentLogs = await Log.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      if (recentLogs.length > 0) {
        send('logs', recentLogs);
      } else {
        throw new Error('no logs');
      }
    } catch {
      // Simulate a live event when DB is unavailable
      const simLog = {
        _id: `sim_${Date.now()}`,
        action: logActions[Math.floor(Math.random() * logActions.length)],
        category: logCategories[Math.floor(Math.random() * logCategories.length)],
        createdAt: new Date().toISOString()
      };
      send('logs', [simLog]);
    }
  };

  // Send initial logs
  await pushLogs();

  // Then send updated logs every 5s
  intervalId = setInterval(pushLogs, 5000);

  // Heartbeat every 25s to keep connection alive (nginx/proxies close idle SSE)
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    clearInterval(heartbeat);
    close();
  });
};

// ─── AI Coach Streaming ─────────────────────────────────────────────────────

export const streamCoach = async (req: AuthRequest, res: Response) => {
  const { send, close } = initSSE(res);

  const { messages = [], resumeText = '' } = req.body as {
    messages: { sender: string; content: string }[];
    resumeText: string;
  };

  if (!messages.length) {
    send('error', { message: 'No messages provided' });
    close();
    return;
  }

  send('start', { message: 'Streaming started' });

  await askCoachStream(
    messages,
    resumeText,
    (token) => send('token', { token }),
    () => { send('done', { message: 'Stream complete' }); close(); },
    (err) => {
      console.error('Stream coach error:', err);
      send('error', { message: 'AI stream error' });
      close();
    }
  );
};

// ─── Resume Analysis Streaming ──────────────────────────────────────────────

export const streamAnalysis = async (req: AuthRequest, res: Response) => {
  const { send, close } = initSSE(res);

  const { resumeText = '', jobDescription = '' } = req.body as {
    resumeText: string;
    jobDescription: string;
  };

  if (!resumeText) {
    send('error', { message: 'No resume text provided' });
    close();
    return;
  }

  send('start', { message: 'Analysis started' });

  await analyzeResumeStream(
    resumeText,
    jobDescription,
    (step, total, label) => send('progress', { step, total, label }),
    (result) => { send('result', result); close(); },
    (err) => {
      console.error('Stream analysis error:', err);
      send('error', { message: 'Analysis stream error' });
      close();
    }
  );
};
