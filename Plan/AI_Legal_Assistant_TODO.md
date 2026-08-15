# AI-Powered Local Language Legal Assistant — Master TODO List

_Derived from: AI_Legal_Assistant_Roadmap.docx — 1-Academic-Year plan, 5-member student team_

---

## 0. Setup & Environment

- [ ] Create GitHub repo, branch naming convention, README (Student A)
- [ ] Set up Python virtual environment + `requirements.txt` (FastAPI, uvicorn, pydantic) (Student A)
- [ ] Install & test Ollama with one small model (e.g. Mistral 7B Q4) on every member's machine; document install steps for Win/macOS/Linux (All, B leads)
- [ ] Build "Hello World" FastAPI endpoint with Swagger docs (Student A)
- [ ] Scaffold React + Vite app calling Hello World endpoint (Student D)
- [ ] Write one-page architecture decision doc (stack choices, why SQLite-first, why no cloud deploy) + team sign-off (Student A)
- [ ] Set up shared task board (GitHub Projects/Kanban)
- [ ] Set up shared Google Doc/Notion for meeting notes & decision log

## 1. Technology Stack (decisions to confirm/install)

- [ ] **Frontend:** React 18 + Vite, Tailwind CSS, i18next; optional throwaway HTML/JS or Streamlit fallback UI for early phases
- [ ] **Backend:** FastAPI (Python 3.11), Uvicorn, Pydantic; Celery + Redis only if STT/OCR latency becomes a real problem later
- [ ] **Database:** SQLite (first ~2/3 of year); ChromaDB for vector store; PostgreSQL migration optional/stretch
- [ ] **AI/ML:** Llama-3.1 8B / Mistral 7B via Ollama; LlamaIndex for RAG; BAAI/bge-m3 (or smaller multilingual MiniLM) embeddings; IndicTrans2 for translation; Whisper (small → medium) for STT; Tesseract 5 + PyMuPDF for OCR; Google Colab (free T4) as compute fallback
- [ ] **APIs:** No paid external APIs; optional browser Web Speech API for mic capture; all LLM/translation/STT/OCR run as local model calls
- [ ] **Dev tools:** Git + GitHub, VS Code, Postman/Swagger UI, Docker (optional, later), shared doc for notes

## 2. Software & Hardware Requirements

- [ ] Install backend/AI Python libs: fastapi, uvicorn, pydantic, sqlalchemy, python-multipart, ollama client, llama-index, chromadb, sentence-transformers, openai-whisper, pytesseract, PyMuPDF, python-jose + passlib (optional auth), pandas, pytest
- [ ] Install frontend JS libs: react, react-dom, vite, tailwindcss, i18next + react-i18next, axios, react-dropzone, react-pdf, (optional) recharts
- [ ] Confirm hardware: min 8GB RAM / recommended 16GB; 20–40GB free storage; GPU optional (CPU-only Ollama workable); test demo machine 2+ weeks before each milestone

## 3. Team Structure & Ownership

- [ ] Confirm role assignments:
  - [ ] Student A — Team Lead & Backend Engineer (FastAPI, DB schema, integration, sprint planning)
  - [ ] Student B — AI/ML Engineer: LLM & RAG (Ollama, LlamaIndex, ChromaDB, answer-quality eval)
  - [ ] Student C — AI/ML Engineer: Speech & Translation (Whisper, IndicTrans2, OCR)
  - [ ] Student D — Frontend Engineer (React UI, chat, language switcher, uploads, voice UI, UX)
  - [ ] Student E — Data, QA & Demo Coordinator (corpus/scheme curation, testing, demo prep)
- [ ] Assign a backup/secondary owner for every major module (no single point of failure)
- [ ] Set up weekly 30-min sync + Friday async written update
- [ ] Agree: Student A + Student E jointly sign off on "demo-ready" status per milestone

---

## 4. Phase-by-Phase Development Roadmap

### Phase 0 — Foundations, Tooling & Corpus Kick-off (Weeks 1–3)

- [ ] 0.1 Create GitHub repo, branch convention, README — Student A
- [ ] 0.2 Install/test Ollama on all machines, document setup — All (B leads)
- [ ] 0.3 Set up Python venv + requirements.txt — Student A
- [ ] 0.4 Build "Hello World" FastAPI endpoint — Student A
- [ ] 0.5 Scaffold React + Vite app calling Hello World endpoint — Student D
- [ ] 0.6 Shortlist 10 candidate legal source documents — Student E
- [ ] 0.7 Draft first 15 government schemes into structured JSON/CSV — Student E
- [ ] 0.8 Write architecture decision doc + team sign-off — Student A

### Phase 1 — Core Backend, Database & RAG Skeleton (Weeks 4–7)

- [ ] 1.1 Design simplified ER schema (users, sessions, messages, schemes, documents) — Student A
- [ ] 1.2 Implement schema in SQLite via SQLAlchemy — Student A
- [ ] 1.3 Install ChromaDB + LlamaIndex; index first 10 legal documents — Student B
- [ ] 1.4 Build query function: embed → retrieve top-k → LLM via Ollama → answer + source — Student B
- [ ] 1.5 Run manual test set of 10 English legal questions; log results — Student E
- [ ] 1.6 Expose RAG query as FastAPI `POST /ask` endpoint — Student A
- [ ] 1.7 Draw/document ER diagram and architecture diagram — Student A

### Phase 2 — Working Chat UI + English End-to-End Flow (Weeks 8–11)

- [ ] 2.1 Build chat-style React component (message list + input) with Tailwind — Student D
- [ ] 2.2 Integrate `/ask` endpoint via axios, add loading state — Student D
- [ ] 2.3 Display source citations under each answer — Student D
- [ ] 2.4 Add 15–20 more legal documents/sections, re-index — Student E
- [ ] 2.5 Add error handling (backend down, empty query, timeout) — Student A + D
- [ ] 2.6 Run full team walkthrough demo of English chat flow — Student E (all attend)

### Phase 3 — Multilingual Translation Layer (Weeks 12–16)

- [ ] 3.1 Install IndicTrans2; test Hindi↔English on 5 sample sentences — Student C
- [ ] 3.2 Repeat for Marathi↔English — Student C
- [ ] 3.3 Wrap translation in reusable backend service functions — Student C
- [ ] 3.4 Modify `/ask` to accept language parameter, call translation pre/post RAG — Student A
- [ ] 3.5 Add language selector dropdown in React UI — Student D
- [ ] 3.6 Build & run 20-question Hindi + 20-question Marathi test set; log issues — Student E
- [ ] 3.7 Tune prompts/translation post-processing based on findings — Student B + C

### Phase 4 — Voice Input (STT) Integration (Weeks 17–20)

- [ ] 4.1 Install openai-whisper (small); test on 5 pre-recorded Hindi clips — Student C
- [ ] 4.2 Build FastAPI `POST /transcribe` endpoint — Student A
- [ ] 4.3 Add microphone recording UI (tap-to-speak, MediaRecorder API) — Student D
- [ ] 4.4 Wire recorded audio to `/transcribe`; show editable transcription before `/ask` — Student D + A
- [ ] 4.5 Test voice flow end-to-end with 15 spoken questions/language; log accuracy — Student E
- [ ] 4.6 (If needed) Upgrade to whisper-medium and re-test — Student C

### Phase 5 — Government Scheme Recommendation Engine (Weeks 21–25)

- [ ] 5.1 Expand scheme dataset from 15 to 40–60 entries — Student E
- [ ] 5.2 Design 5–6-question profiling flow + rule-based matching logic — Student A
- [ ] 5.3 Implement matching engine as testable Python module — Student A
- [ ] 5.4 Expose `/profile` and `/recommend-schemes` API endpoints — Student A
- [ ] 5.5 Build profiling conversation UI + recommendation cards — Student D
- [ ] 5.6 Translate scheme names/descriptions/UI labels (Hindi/Marathi) — Student C
- [ ] 5.7 Test recommendation engine against 10 distinct test profiles — Student E

### Phase 6 — Document Decoder (OCR + Summarisation) (Weeks 26–30)

- [ ] 6.1 Install Tesseract 5 with Hindi/Marathi packs; test OCR on 3 scans — Student C
- [ ] 6.2 Build PyMuPDF text extractor w/ OCR fallback for image-based pages — Student C
- [ ] 6.3 Implement `POST /upload-document` endpoint (PDF/JPG/PNG, size limit) — Student A
- [ ] 6.4 Design/test LLM summarisation prompt (obligations, deadlines, penalties) — Student B
- [ ] 6.5 Connect upload → OCR → summarisation → translation into one pipeline — Student A + B
- [ ] 6.6 Build document upload UI (drag-and-drop) + summary display w/ highlights — Student D
- [ ] 6.7 Collect & test against 5–7 sample documents — Student E

### Phase 7 — Integration Hardening, Testing & Demo Polish (Weeks 31–36)

- [ ] 7.1 Unify navigation/layout across all four features — Student D
- [ ] 7.2 Add consistent loading/error states across all API calls — Student D
- [ ] 7.3 Write pytest unit tests (RAG query, scheme matcher, OCR/summarisation) — Student A + B
- [ ] 7.4 Build curated "known-good" demo set (~20 Q&A, 10 profiles, 5 documents) — Student E
- [ ] 7.5 Run full dry-run demo end-to-end at least twice, on actual demo machine — All
- [ ] 7.6 Fix bugs surfaced during dry runs (bug-fix buffer) — All (assigned per bug)
- [ ] 7.7 Write demo script (presenter order, fallback plan) — Student E

### Phase 8 — Stretch Goals & Final Submission (Weeks 37–40)

- [ ] 8.1 (Stretch) Add Urdu language support + RTL CSS — Student C + D
- [ ] 8.2 (Stretch) Add PWA manifest + service worker caching top 50 FAQs — Student D
- [ ] 8.3 (Stretch) Package system with Docker Compose — Student A
- [ ] 8.4 Write final project report (roadmap outcomes, screenshots, results) — All (E compiles)
- [ ] 8.5 Prepare & rehearse final slide deck and live demo (3+ times) — All
- [ ] 8.6 Record backup demo video — Student E

---

## 5. Milestones (Checkpoint Demos)

- [ ] **MVP 1** (~Week 11, end of Phase 2): English-only text Q&A working end-to-end with citations
- [ ] **MVP 2** (~Week 20, end of Phase 4): Hindi/Marathi Q&A + voice input working end-to-end
- [ ] **Semester Review Demo** (~Week 30, end of Phase 6): Q&A + schemes + document decoder all working
- [ ] **Final Demo** (~Week 40, end of Phase 8): Polished, rehearsed, all 4 features, backup recording ready

## 6. Incremental 20-Day Milestones (Detailed Checkpoints)

- [ ] Milestone 1 (Day 1–20): Hello, Working Pipeline — full-stack loop + Ollama proven
- [ ] Milestone 2 (Day 21–40): Database Connected, Data Flows — real schema, seeded data
- [ ] Milestone 3 (Day 41–60): First Real Legal Answer — RAG pipeline gives correct cited answers (CLI/Swagger)
- [ ] Milestone 4 (Day 61–80): Real Chat Interface Goes Live — usable web app, MVP 1 achieved
- [ ] Milestone 5 (Day 81–100): Hindi & Marathi translation core proven (backend/Swagger)
- [ ] Milestone 6 (Day 101–120): Hindi & Marathi live in the UI with language switcher
- [ ] Milestone 7 (Day 121–140): Voice input live end-to-end, MVP 2 achieved
- [ ] Milestone 8 (Day 141–160): Scheme engine logic & data proven (backend/Swagger)
- [ ] Milestone 9 (Day 161–180): Scheme engine live in the UI, multilingual
- [ ] Milestone 10 (Day 181–200): Document decoder (OCR + summarisation) core proven
- [ ] Milestone 11 (Day 201–220): Document decoder live in UI + follow-up Q&A; full feature set complete
- [ ] Milestone 12 (Day 221–240): One coherent app — unified UI, automated tests, known-good demo set
- [ ] Milestone 13 (Day 241–260): Demo-hardened & rehearsed — dry runs, bug-fix buffer, demo script, backup video
- [ ] Milestone 14 (Day 261–280): Final demo ready — stretch goals (if time), final report/deck, live delivery

---

## 7. Risk Management Checklist

### Technical Risks

- [ ] Mitigate LLM hallucination: ground every answer in RAG, show source citations, add "not legal advice" disclaimer, restrict demo questions to corpus topics
- [ ] Mitigate slow local hardware: use smaller/quantised models, use Google Colab T4 for experimentation, pre-test demo queries
- [ ] Mitigate poor translation quality: use IndicTrans2, recruit a fluent Hindi/Marathi reviewer, flag low-confidence cases
- [ ] Mitigate poor OCR accuracy: curate clean sample documents for demo, document known limitations
- [ ] Mitigate integration breakage: reuse same backend/UI shell across features, run integration smoke tests every phase
- [ ] Mitigate cross-platform/environment issues: document setup steps in Phase 0, consider Docker only once stable

### Skill Gaps

- [ ] Budget explicit learning time for embeddings/RAG concepts in Phase 0–1; pair AI/ML students
- [ ] Use a simple chat-UI tutorial as a frontend starting template
- [ ] Start STT/OCR with simplest official examples before customizing
- [ ] Assign QA/testing discipline explicitly to Student E; require test notes before milestone sign-off
- [ ] Re-estimate effort each phase based on actual team velocity

### Scope Creep Risks

- [ ] Keep Urdu as Phase 8 stretch goal only (don't build 3 languages from the start)
- [ ] Cap scheme dataset at 40–60 (don't chase 150+)
- [ ] Explicitly de-prioritize production concerns (auth hardening, scaling, cloud deploy, payment-grade security)
- [ ] Enforce "hardening-only" rule for Phase 7–8 (no new features mid-hardening)
- [ ] Keep DB schema minimal in Phase 1; treat extras (feedback/analytics) as optional later additions

### Recommended Simplifications vs. Original Report

- [ ] Confirm: 2 core languages (Hindi, Marathi) + Urdu as stretch
- [ ] Confirm: 40–60 curated schemes (not 150+)
- [ ] Confirm: SQLite primary DB, Postgres migration optional
- [ ] Confirm: No cloud deployment/CI-CD/Docker required for core demo (Phase 8 optional only)
- [ ] Confirm: No mandatory PWA offline mode
- [ ] Confirm: Guest mode acceptable (JWT auth optional)
- [ ] Confirm: Synchronous calls acceptable (Celery/Redis only if latency becomes a real problem)

---

## 8. Success Criteria (Final Demo Bar)

- [ ] Answer ≥30 distinct pre-tested legal questions correctly (with citations) in Hindi and Marathi
- [ ] Recommend ≥3 relevant schemes for 10 distinct test citizen profiles
- [ ] Transcribe spoken Hindi/Marathi questions correctly ≥80% of the time on clear audio
- [ ] Summarise ≥5 sample legal documents into accurate plain-language explanations
- [ ] Run reliably end-to-end on one laptop for a 10-minute live demo without crashing
- [ ] Every team member can explain/reproduce at least parts of the system, not just their own module

---

## 9. Final Timeline Checkpoints (Academic Year, 10 Months)

- [ ] Month 1 (Weeks 1–4): Phase 0 → start Phase 1 — env setup, corpus/scheme collection, ER schema design
- [ ] Month 2 (Weeks 5–8): Phase 1 → start Phase 2 — SQLite + RAG pipeline built/tested, React UI scaffolding
- [ ] Month 3 (Weeks 9–11): Finish Phase 2 — MVP 1 delivered
- [ ] Month 4 (Weeks 12–16): Phase 3 — Hindi/Marathi translation integrated
- [ ] Month 5 (Weeks 17–20): Phase 4 — Voice input integrated, MVP 2 delivered
- [ ] Month 6 (Weeks 21–25): Phase 5 — Scheme recommendation engine built
- [ ] Month 7 (Weeks 26–30): Phase 6 — Document decoder built, Semester Review Demo delivered
- [ ] Month 8 (Weeks 31–33): Start Phase 7 — UI unification, pytest tests, demo set curation
- [ ] Month 9 (Weeks 34–36): Finish Phase 7 — dry runs, bug-fix buffer, demo script finalised
- [ ] Month 10 (Weeks 37–40): Phase 8 — stretch goals (if time), final report/deck, rehearsals, Final Demo delivered
- [ ] Reminder: If any phase overruns, shrink Phase 8 stretch ambitions rather than cutting Phase 7 testing time
