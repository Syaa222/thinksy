# Graph Report - thinksy  (2026-09-14)

## Corpus Check
- 155 files · ~207,353 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .ico 2, (none) 1, .css 1)

## Summary
- 592 nodes · 1179 edges · 52 communities (36 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.86)
- Token cost: 494,382 input · 0 output

## Community Hubs (Navigation)
- Admin & School Management API
- Exam/Ujian API & Tutor Chat
- Admin Dashboard Pages
- Project Docs & Remediation Plan
- Student Dashboard Modals & Layout
- AI Tutor & Chat Components
- Guru Dashboard & Realtime Hooks
- Guru Question Bank Management
- NPM Package References
- Notifications, Streak & Grading
- TypeScript Config
- Digital Journal & Bab Reader
- Student Dashboard Types
- DB Migration & Seed Scripts
- Assessment & Quiz Session Pages
- Package Dependencies
- Student Dashboard Home & Mapel Theme
- Sesi & Daily Mission API
- Guru AI Assistant & Layout
- Student Navbar & Math Minigame
- Dev Dependencies
- Attendance Face Liveness Detection
- Auth Callback & Proxy
- Guru Penilaian Siswa (Grading)
- App Layout & Next Config
- Exam Result Client
- Quiz Practice Client
- Exam Room Client
- Super Admin Sekolah Management
- Student Notification API
- Guru Live Exam Monitor
- Student Schedule
- Global Discussion Modal
- Super Admin Sekolah Page
- NPM Scripts
- Thinksy Branding (App Icon)
- Toast Notification
- Image Compression Utility
- Guru Attendance API
- Claude/Agent Project Instructions
- ESLint Config
- PostCSS Config
- Text Highlight Type
- File Icon Asset
- Globe Icon Asset
- School Photo Asset
- Logo Asset
- Next.js Logo Asset
- Vercel Logo Asset
- Window Icon Asset

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 143 edges
2. `createAdminClient()` - 70 edges
3. `lucide-react` - 52 edges
4. `react` - 43 edges
5. `useRealtimeDashboard()` - 20 edges
6. `MarkdownRenderer()` - 18 edges
7. `compilerOptions` - 16 edges
8. `GuruLayout()` - 14 edges
9. `checkAndUpdateDailyStreak()` - 14 edges
10. `createClient()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Bug: Achievement Badges Always Unlocked` --semantically_similar_to--> `Out-of-Scope MVP Features (Gamification, Payments, etc.)`  [INFERRED] [semantically similar]
  graphify-out/converted/Rencana perbaikan Thinksy_faea92dd.md → context.md
- `Bug: Daily Mission Points Given Without Completion Check` --semantically_similar_to--> `Out-of-Scope MVP Features (Gamification, Payments, etc.)`  [INFERRED] [semantically similar]
  graphify-out/converted/Rencana perbaikan Thinksy_faea92dd.md → context.md
- `Bug: Default Points Hardcoded to 1250` --semantically_similar_to--> `Out-of-Scope MVP Features (Gamification, Payments, etc.)`  [INFERRED] [semantically similar]
  graphify-out/converted/Rencana perbaikan Thinksy_faea92dd.md → context.md
- `Bug: Streak Always Shows 14` --semantically_similar_to--> `Out-of-Scope MVP Features (Gamification, Payments, etc.)`  [INFERRED] [semantically similar]
  graphify-out/converted/Rencana perbaikan Thinksy_faea92dd.md → context.md
- `Bug: Missing Timer & AI Wrongly Active on Quiz/Assessment` --semantically_similar_to--> `Strict Content Rules (Math Kelas 8, Socratic AI Tutor)`  [INFERRED] [semantically similar]
  graphify-out/converted/Rencana perbaikan Thinksy_faea92dd.md → context.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **OAuth Login Flow Setup (Google & GitHub via Supabase)** — loginwithgoogleandgithub_google_oauth_setup, loginwithgoogleandgithub_github_oauth_setup, loginwithgoogleandgithub_supabase_provider_config, loginwithgoogleandgithub_supabase_site_url_config, loginwithgoogleandgithub_handle_new_user_trigger [EXTRACTED 0.90]
- **Answer Key Protection Pattern (RLS + Server Grading)** — context_answer_key_protection_rule, context_rls_security, rencana_answer_key_security_fix, rencana_soal_publik_view [INFERRED 0.85]
- **Remove Hardcoded/Fake Content Initiative** — rencana_curriculum_replacement, rencana_dashboard_hardcoded_bug, rencana_bab_page_bug, rencana_exam_result_hardcoded_bug [INFERRED 0.80]

## Communities (52 total, 14 thin omitted)

### Community 0 - "Admin & School Management API"
Cohesion: 0.07
Nodes (41): GET(), POST(), GET(), GET(), POST(), GET(), GET(), PUT() (+33 more)

### Community 1 - "Exam/Ujian API & Tutor Chat"
Cohesion: 0.08
Nodes (26): GET(), POST(), GET(), GET(), POST(), GET(), POST(), GET() (+18 more)

### Community 2 - "Admin Dashboard Pages"
Cohesion: 0.08
Nodes (18): GuruItem, Undangan, AdminKelasPage(), ClassItem, GuruOption, PresensiItem, SekolahInfo, TeacherItem (+10 more)

### Community 3 - "Project Docs & Remediation Plan"
Cohesion: 0.07
Nodes (30): AI Route Handler Rule (/api/tutor, /api/nilai-esai), Answer Key Protection Rule (kunci_jawaban), Design & UI Guidelines (Desktop-First), Out-of-Scope MVP Features (Gamification, Payments, etc.), Thinksy MVP Multi-Tenant AI Learning App Overview, AI Rate Limiting & Logging Rule (20 msgs/day, log_ai), Row Level Security Rule (sekolah_id filtering), Roles Hierarchy (super_admin, admin_sekolah, guru, siswa) (+22 more)

### Community 4 - "Student Dashboard Modals & Layout"
Cohesion: 0.10
Nodes (19): UatDevMenu(), UatDevMenuProps, FloatingActionHub(), FloatingActionHubProps, HelpCenterModal(), HelpCenterModalProps, SettingsModal(), SettingsModalProps (+11 more)

### Community 5 - "AI Tutor & Chat Components"
Cohesion: 0.12
Nodes (15): GuruDetailSiswaPage(), TeacherNote, MarkdownRenderer(), Question, SessionQuizClientProps, ChatSession, DEFAULT_WELCOME_MESSAGE, GeneralAiChat() (+7 more)

### Community 6 - "Guru Dashboard & Realtime Hooks"
Cohesion: 0.13
Nodes (16): LoginForm(), ClassCardData, GuruDashboardPage(), ScheduleItem, StudentAttendance, PenilaianEsaiPage(), SubmissionItem, connectionListeners (+8 more)

### Community 7 - "Guru Question Bank Management"
Cohesion: 0.13
Nodes (17): GuruDaftarSiswaPage(), fetchRealStudents(), PresensiEntry, QuestionReviewItem, ReviewSoalEksplorasiPage(), BankSoalManualPage(), fetchPublishedQuestions(), QuestionItem (+9 more)

### Community 8 - "NPM Package References"
Cohesion: 0.09
Nodes (21): name, private, version, @anthropic-ai/sdk, eslint, eslint-config-next, html2canvas, jspdf (+13 more)

### Community 9 - "Notifications, Streak & Grading"
Cohesion: 0.19
Nodes (14): POST, POST(), GET(), POST(), PresensiRequestBody, CreateNotificationParams, createSystemNotification(), markNotificationsAsRead() (+6 more)

### Community 10 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 11 - "Digital Journal & Bab Reader"
Cohesion: 0.13
Nodes (15): DaftarMateriClient(), DaftarMateriClientProps, MateriItem, DetailBabPage(), DigitalJournalReader(), DigitalJournalReaderProps, FontSize, HighlightItem (+7 more)

### Community 12 - "Student Dashboard Types"
Cohesion: 0.18
Nodes (15): TabBelajar(), TabBelajarProps, TabKursusSayaProps, TabPeringkat(), TabPeringkatProps, CalendarDayItem, CalendarWeekItem, ChapterItem (+7 more)

### Community 13 - "DB Migration & Seed Scripts"
Cohesion: 0.12
Nodes (8): pg, { Client }, { Client }, fs, path, { Client }, { Client }, rawBabData

### Community 14 - "Assessment & Quiz Session Pages"
Cohesion: 0.16
Nodes (11): AssessmentPage(), isValidUUID(), ModeEksplorasiPage(), isValidUUID(), LatihanPage(), isValidUUID(), SesiPage(), SessionQuizClient() (+3 more)

### Community 15 - "Package Dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @anthropic-ai/sdk, html2canvas, jspdf, katex, lucide-react, @mediapipe/tasks-vision, next (+7 more)

### Community 16 - "Student Dashboard Home & Mapel Theme"
Cohesion: 0.24
Nodes (9): getMapelTheme(), MAPEL_THEMES, MapelTheme, TabKursusSaya(), SiswaDashboardPage(), StudentDashboardClient(), ALLOWED_MAPEL_NAMES, AllowedMapelName (+1 more)

### Community 17 - "Sesi & Daily Mission API"
Cohesion: 0.30
Nodes (10): GET(), getTodayWIB(), POST(), PUT(), autoClaimMisi(), ensureDailyMissions(), GET(), getTodayWIB() (+2 more)

### Community 18 - "Guru AI Assistant & Layout"
Cohesion: 0.21
Nodes (8): GuruBuatUjianPage(), ChatMessage, FloatingGuruSpeedDial(), TeacherNote, ThinksyChatSession, GuruLayoutProps, lucide-react, Bug: Logged-in Teacher Name/Identity Mismatch

### Community 19 - "Student Navbar & Math Minigame"
Cohesion: 0.27
Nodes (9): StudentNavbar(), StudentNavbarProps, NotificationItem, SekolahData, generateMathQuestion(), MathMiniGameModal(), MathMiniGameModalProps, playTone() (+1 more)

### Community 20 - "Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, pg, tailwindcss, @tailwindcss/postcss, @types/node, @types/pg (+3 more)

### Community 21 - "Attendance Face Liveness Detection"
Cohesion: 0.43
Nodes (6): AttendanceModal(), AttendanceModalProps, evaluateFaceFrame(), getFaceLandmarker(), LivenessStatus, @mediapipe/tasks-vision

### Community 22 - "Auth Callback & Proxy"
Cohesion: 0.33
Nodes (4): GET(), getDashboardPath(), config, @supabase/ssr

### Community 23 - "Guru Penilaian Siswa (Grading)"
Cohesion: 0.29
Nodes (5): ExamAttempt, ExamQuestion, GuruPenilaianSiswaPage(), StudentClass, StudentItem

### Community 24 - "App Layout & Next Config"
Cohesion: 0.29
Nodes (4): metadata, plusJakartaSans, nextConfig, next

### Community 25 - "Exam Result Client"
Cohesion: 0.38
Nodes (5): app/(siswa)/hasil/[sesiId], ExamResultClient(), ExamResultClientProps, QuestionReview, Bug: Hardcoded Exam Result Scores

### Community 26 - "Quiz Practice Client"
Cohesion: 0.33
Nodes (5): QuizPage(), ExamPracticeClient(), ExamPracticeClientProps, ExamQuestion, Bug: Quiz Page Uses Sample Questions & Client-Side Answer Key

### Community 27 - "Exam Room Client"
Cohesion: 0.29
Nodes (6): ExamRoomClient(), ExamRoomClientProps, OpsiItem, QuestionItem, SesiData, UjianData

### Community 28 - "Super Admin Sekolah Management"
Cohesion: 0.29
Nodes (4): AdminItem, ModalUndangAdmin(), Sekolah, Undangan

### Community 29 - "Student Notification API"
Cohesion: 0.47
Nodes (5): GET(), handleUpdateNotification(), PATCH(), POST(), Bug: Notification Box Shows Fake Sample Messages

### Community 30 - "Guru Live Exam Monitor"
Cohesion: 0.33
Nodes (5): LiveMonitorClient(), LiveMonitorClientProps, SesiItem, StudentItem, UjianData

### Community 31 - "Student Schedule"
Cohesion: 0.40
Nodes (4): SchedulePage(), ScheduleClient(), ScheduleClientProps, ScheduleItem

### Community 32 - "Global Discussion Modal"
Cohesion: 0.60
Nodes (4): GlobalDiscussionModal(), GlobalDiscussionModalProps, ChatCommentItem, GlobalChatItem

### Community 34 - "NPM Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 35 - "Thinksy Branding (App Icon)"
Cohesion: 0.83
Nodes (4): AI Robot Mascot (Graduate), Thinksy App Icon, Thinksy (Product/Brand), Tagline: Learn Smarter, Grow Further

### Community 36 - "Toast Notification"
Cohesion: 0.67
Nodes (3): ToastNotification(), ToastNotificationProps, ToastNotificationData

## Ambiguous Edges - Review These
- `eksplorasi/[sesiId]/page.tsx` → `Bug: Missing Timer & AI Wrongly Active on Quiz/Assessment`  [AMBIGUOUS]
  graphify-out/converted/Rencana perbaikan Thinksy_faea92dd.md · relation: references
- `Thinksy Tech Stack (Next.js 16, Supabase, Gemini 2.5 Flash)` → `Context Tech Stack (Next.js 14+, Supabase, Anthropic Claude)`  [AMBIGUOUS]
  context.md · relation: conceptually_related_to

## Knowledge Gaps
- **181 isolated node(s):** `Undangan`, `GuruItem`, `ClassItem`, `PresensiItem`, `GuruOption` (+176 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 226 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `eksplorasi/[sesiId]/page.tsx` and `Bug: Missing Timer & AI Wrongly Active on Quiz/Assessment`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Thinksy Tech Stack (Next.js 16, Supabase, Gemini 2.5 Flash)` and `Context Tech Stack (Next.js 14+, Supabase, Anthropic Claude)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `lucide-react` connect `Guru AI Assistant & Layout` to `Exam/Ujian API & Tutor Chat`, `Admin Dashboard Pages`, `Student Dashboard Modals & Layout`, `AI Tutor & Chat Components`, `Guru Dashboard & Realtime Hooks`, `Guru Question Bank Management`, `NPM Package References`, `Digital Journal & Bab Reader`, `Student Dashboard Types`, `Student Dashboard Home & Mapel Theme`, `Student Navbar & Math Minigame`, `Attendance Face Liveness Detection`, `Guru Penilaian Siswa (Grading)`, `Exam Result Client`, `Quiz Practice Client`, `Exam Room Client`, `Super Admin Sekolah Management`, `Guru Live Exam Monitor`, `Student Schedule`, `Global Discussion Modal`, `Super Admin Sekolah Page`, `Toast Notification`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Admin & School Management API` to `Exam/Ujian API & Tutor Chat`, `Admin Dashboard Pages`, `Guru Attendance API`, `Notifications, Streak & Grading`, `Digital Journal & Bab Reader`, `Assessment & Quiz Session Pages`, `Student Dashboard Home & Mapel Theme`, `Sesi & Daily Mission API`, `Exam Result Client`, `Quiz Practice Client`, `Student Notification API`, `Student Schedule`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Why does `react` connect `AI Tutor & Chat Components` to `Admin Dashboard Pages`, `Student Dashboard Modals & Layout`, `Guru Dashboard & Realtime Hooks`, `Guru Question Bank Management`, `NPM Package References`, `Digital Journal & Bab Reader`, `Student Dashboard Home & Mapel Theme`, `Guru AI Assistant & Layout`, `Student Navbar & Math Minigame`, `Attendance Face Liveness Detection`, `Guru Penilaian Siswa (Grading)`, `Exam Result Client`, `Quiz Practice Client`, `Exam Room Client`, `Super Admin Sekolah Management`, `Guru Live Exam Monitor`, `Student Schedule`, `Global Discussion Modal`, `Super Admin Sekolah Page`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **What connects `Undangan`, `GuruItem`, `ClassItem` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin & School Management API` be split into smaller, more focused modules?**
  _Cohesion score 0.06502732240437159 - nodes in this community are weakly interconnected._