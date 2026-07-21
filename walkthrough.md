# Walkthrough of Layout Refactoring & Parser Improvements

This document outlines the modifications implemented to resolve responsiveness issues, layout clutter, and static file parser behavior when uploading multiple resumes.

---

## 1. OpenAI and Groq AI Swap Layer
* **Groq Compatibility**: Refactored [aiService.ts](file:///c:/Users/kaluv/OneDrive/Desktop/Intership_Finder_Project/backend/src/services/aiService.ts) to natively support both OpenAI and Groq. 
* **Dynamic Routing**: If you add a `GROQ_API_KEY` (e.g. `gsk_...`) to your [backend/.env](file:///c:/Users/kaluv/OneDrive/Desktop/Intership_Finder_Project/backend/.env#L15), the system will automatically route all completions (resume analysis, cover letter edits, coaching chatbot, and STAR bullet expansions) to Groq's high-speed endpoint using the powerful **`llama-3.3-70b-versatile`** model. Otherwise, it will fall back to OpenAI (`gpt-4o`).
* **Resolved OpenAI API Linking Timing Bug**: In [index.ts](file:///c:/Users/kaluv/OneDrive/Desktop/Intership_Finder_Project/backend/src/index.ts#L3-L17), the environment configuration `dotenv.config()` was executing *after* routes and AI services were imported. Consequently, `process.env.OPENAI_API_KEY` resolved to `undefined` during `aiService.ts` module initialization, locking the application into local mock fallback mode.
* **Resolution**: Moved `dotenv.config()` to the very top of `index.ts`. Environment variables are now successfully loaded before any controllers, routes, or services execute, correctly provisioning the OpenAI client wrapper.

---

## 2. Real-Time Job Description Matching
* Implemented the POST endpoint `/api/resumes/:id/analyze` in [resumeRoutes.ts](file:///c:/Users/kaluv/OneDrive/Desktop/Intership_Finder_Project/backend/src/routes/resumeRoutes.ts#L21) and [resumeController.ts](file:///c:/Users/kaluv/OneDrive/Desktop/Intership_Finder_Project/backend/src/controllers/resumeController.ts#L325). It uses the active AI engine (Groq or OpenAI) on the backend to match the resume contents against a job description.
* Added `analyzeActiveResume` to the frontend context in [AppDataContext.tsx](file:///c:/Users/kaluv/OneDrive/Desktop/Intership_Finder_Project/frontend/src/context/AppDataContext.tsx#L878) to dispatch this request.
* Created a **Role Suitability Scan** dashboard card in [ResumeAnalyzer.tsx](file:///c:/Users/kaluv/OneDrive/Desktop/Intership_Finder_Project/frontend/src/pages/ResumeAnalyzer.tsx#L777) where users paste job descriptions and click **Scan JD Match Compatibility (Groq/OpenAI)** to query the AI engine.
* Fixed the `useEffect` hooks in the frontend to prevent the local mock report from overriding active resume scores and recommendations once a Job Description is typed.

---

## 3. Dynamic Client-Side PDF/Word Text Extraction
* Implemented `extractRawTextFromBuffer` in [ResumeAnalyzer.tsx](file:///c:/Users/kaluv/OneDrive/Desktop/Intership_Finder_Project/frontend/src/pages/ResumeAnalyzer.tsx#L225):
  * Scans raw file `ArrayBuffer` values.
  * Filters out non-printable binary streams.
  * Cleans noise using alphanumeric regex patterns.
  * Rejects short unparseable blocks to safely fallback to keyword templates if the PDF is scanned/image-based.
* With this extractor, uploading different resumes in mock/offline sessions now reads their unique strings. This generates dynamic compatibility scores, customized recruiter perspectives, and custom keyword recommendations.

---

## 4. Collapse Clumsy Uploader Box
* Added a `showUploader` state toggle to clean up the dashboard.
* When an active resume is loaded, the page hides the large, bulky file uploader. Instead, it displays a premium **Active Resume Header Banner** showing:
  * Uploaded filename
  * Active version badge
  * Real-Time status indicator
  * Compact button to "Upload New" version when needed.

---

## 5. Responsive Column Grid Layout
* Redesigned the `audit` tab column layout:
  * Refactored squished side-by-side components into a balanced **12-column grid** (`grid grid-cols-1 xl:grid-cols-12`).
  * Placed the circular score progress ring and radar competency chart inside a compact sidebar column (`xl:col-span-4`).
  * Placed detailed text audits, strengths/weaknesses grids, improvements lists, and recommended skill keywords in a wider main content area (`xl:col-span-8`).
* Responsive layouts (`grid-cols-1 md:grid-cols-2`) ensure that elements stack cleanly on tablets and mobile screens without overflow or squishing.

---

## Verification Results
* Both the backend server and frontend Vite hot-reload successfully.
* Extractor handles multiple uploads smoothly and updates active document indices instantly.
