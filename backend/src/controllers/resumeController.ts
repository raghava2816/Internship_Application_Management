import { Response } from 'express';
import Resume from '../models/Resume';
import Log from '../models/Log';
import { AuthRequest } from '../middleware/authMiddleware';
import { analyzeResume } from '../services/aiService';
import mammoth from 'mammoth';

// ─── Reliable single-path PDF extractor ────────────────────────────────────
const extractPdfText = async (buffer: Buffer): Promise<string> => {
  try {
    // pdf-parse exports its function directly via module.exports
    // We resolve both the ESM-interop and plain CJS form in one shot.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
      require('pdf-parse')?.default ?? require('pdf-parse');

    if (typeof pdfParse !== 'function') {
      throw new Error('pdf-parse module did not export a callable function');
    }

    const result = await pdfParse(buffer);
    const text = (result?.text ?? '').trim();

    if (text.length < 30) {
      throw new Error(
        'Extracted PDF text is too short — the file may be image-only or encrypted. ' +
        'Please paste your resume text manually.'
      );
    }
    return text;
  } catch (err: any) {
    console.error('PDF text extraction error:', err?.message ?? err);
    throw err;
  }
};


// Mock resumes removed for strict real-time enforcement

export const getResumes = async (req: AuthRequest, res: Response) => {
  try {
    const resumes = await Resume.find({ ownerId: req.user?.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: resumes.length, data: resumes });
  } catch (error: any) {
    console.error('⚠️ DB error fetching resumes:', error);
    res.status(500).json({ success: false, message: 'Database error fetching resumes' });
  }
};

export const uploadResume = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.id;
    let fileName = req.body.fileName || 'resume.pdf';
    let textContent = req.body.textContent || '';
    const jobDescription = req.body.jobDescription || '';
    let fileUrl = ''; // Will be set if a binary file is uploaded

    // If a file is uploaded via Multer, extract text AND build a data URL for download
    if (req.file) {
      fileName = req.file.originalname;
      const mimetype = req.file.mimetype;

      // Store base64 data URL so the frontend can offer a direct download
      fileUrl = `data:${mimetype};base64,${req.file.buffer.toString('base64')}`;

      if (mimetype === 'application/pdf') {
        try {
          const parsed = await extractPdfText(req.file.buffer);
          if (parsed && parsed.length > 30) {
            textContent = parsed;
          }
        } catch (err: any) {
          console.error('PDF parsing failed:', err?.message ?? err);
          if (!textContent || !textContent.trim()) {
            return res.status(400).json({
              success: false,
              message: err?.message || 'Failed to parse PDF file content. Try the paste mode instead.',
            });
          }
        }
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword'
      ) {
        try {
          const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
          textContent = parsed.value || '';
        } catch (err) {
          console.error('DOCX parsing failed:', err);
          return res.status(400).json({ success: false, message: 'Failed to parse Word document content.' });
        }
      } else {
        // Plain text fallback
        textContent = req.file.buffer.toString('utf8');
      }
    }

    if (!textContent || !textContent.trim()) {
      return res.status(400).json({ success: false, message: 'Resume text content is empty or unreadable.' });
    }

    // Deactivate previous active resumes
    await Resume.updateMany({ ownerId }, { isActive: false });

    // Determine version number
    const count = await Resume.countDocuments({ ownerId });
    const version = `v${count + 1}.0`;

    // Process ATS analysis
    const atsReport = await analyzeResume(textContent, jobDescription);

    const newResume = await Resume.create({
      ownerId,
      fileName,
      fileUrl,
      version,
      textContent,
      atsReport,
      isActive: true
    });

    await Log.create({ ownerId, action: `Uploaded new resume version: ${version}`, category: 'resume' });
    res.status(201).json({ success: true, data: newResume });
  } catch (error: any) {
    console.error('⚠️ Mongoose DB/AI error during upload:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload and analyze resume.' });
  }
};

export const setActiveResume = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.id;
    await Resume.updateMany({ ownerId }, { isActive: false });
    const active = await Resume.findOneAndUpdate({ _id: req.params.id, ownerId }, { isActive: true }, { new: true });
    if (!active) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    await Log.create({ ownerId, action: `Activated resume version: ${active.version}`, category: 'resume' });
    res.json({ success: true, data: active });
  } catch (error: any) {
    console.error('⚠️ Error activating resume:', error);
    res.status(500).json({ success: false, message: 'Failed to activate resume.' });
  }
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, ownerId: req.user?.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    // If we deleted the active resume, active the next latest one
    if (resume.isActive) {
      const nextLatest = await Resume.findOne({ ownerId: req.user?.id }).sort({ createdAt: -1 });
      if (nextLatest) {
        nextLatest.isActive = true;
        await nextLatest.save();
      }
    }
    await Log.create({ ownerId: req.user?.id, action: `Deleted resume: ${resume.fileName}`, category: 'resume' });
    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error: any) {
    console.error('⚠️ Error deleting resume:', error);
    res.status(500).json({ success: false, message: 'Failed to delete resume.' });
  }
};



export const updateResumeChecklist = async (req: AuthRequest, res: Response) => {
  const { action, done } = req.body;
  try {
    const ownerId = req.user?.id;
    const resume = await Resume.findOne({ _id: req.params.id, ownerId });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    if (resume.atsReport && resume.atsReport.improvements) {
      const item = resume.atsReport.improvements.find((i: any) => i.action === action);
      if (item) {
        item.done = done;
        resume.markModified('atsReport');
        await resume.save();
      }
    }
    res.json({ success: true, data: resume });
  } catch (error: any) {
    console.error('⚠️ Error updating checklist:', error);
    res.status(500).json({ success: false, message: 'Failed to update resume checklist.' });
  }
};

export const analyzeResumeAgainstJD = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { jobDescription } = req.body;
  const ownerId = req.user?.id || '660f54b68449c25fbc7e63b1';

  try {
    const resume = await Resume.findOne({ _id: id, ownerId });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const atsReport = await analyzeResume(resume.textContent, jobDescription || '');
    resume.atsReport = atsReport;
    resume.markModified('atsReport');
    await resume.save();

    res.status(200).json({ success: true, data: resume });
  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze resume.', error: error.message });
  }
};


