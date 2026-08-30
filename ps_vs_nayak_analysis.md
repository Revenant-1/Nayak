---
name: ps-vs-nayak-analysis
description: Comparison of SIH26088 PS requirements vs current Nayak project state
metadata:
  type: reference
---
# PS.md vs Nayak Project: Gap Analysis

**Date:** 2026-08-29

## Overview

| Aspect | SIH26088 (ps.md) | Current Nayak Project |
|---|---|---|
| **Domain** | Cooperative governance, PACS, PMFBY, Ministry of Cooperation | General legal Q&A, individual rights, no specific domain focus |
| **Target Users** | PACS members, farmers, rural stakeholders (low literacy) | General users seeking legal information |
| **Primary Focus** | Multilingual + voice-first + hardware IVR box | Text-based chat with Web Speech API (English only) |
| **Multilingual** | Hindi, Tamil, Telugu, Bengali, Marathi, other Indian languages | English-only; Hindi/Marathi planned but not implemented |
| **Hardware** | ESP32 + SIM800L IVR box (₹1,500 budget) | None — pure software/web app |
| **STT/TTS** | Bhashini / AI4Bharat Indian-language models | Web Speech API (client-side, English 'en-US') |
| **Knowledge Base** | Curated PDFs: cooperative laws, PMFBY, scheme docs | Qdrant vector DB with embeddings; document upload 501 (not implemented) |
| **Grievance System** | Ticket ID + SMS status tracking via Twilio | None; chat history only; no ticketing |
| **WhatsApp** | Integration as optional messaging channel | None |
| **Backend** | FastAPI with auth, Qdrant, Supabase | FastAPI with auth, Qdrant; Supabase not used |
| **LLM** | Llama-3.1-8B / Mistral via HF Inference | Ollama legal Llama + cascade: legal → local → Gemini → Groq |
| **Mobile** | Flutter app (Android-first) | React + Vite + Tailwind (web-first) |
| **Language Detection/Intent** | Classifier for scheme queries, grievance, etc. | Simple keyword matching in `processCommand` |
| **Session/Auth** | Not specified in PS; user context secondary | JWT + bcrypt; login/register/guest/verify fully implemented |
| **Vector DB** | Qdrant (cloud free, 1 GB) | Qdrant with fastembed; `retrieve_legal_context()` searches top-2 |
| **PDF Processing** | PyMuPDF + OCRmyPDF for scanned docs | PyMuPDF planned; document upload returns 501 |

## What's Already Working (Nayak Alignment)

✅ **RAG pipeline with Qdrant** — Core matching feature is present  
✅ **FastAPI backend** — API design aligns; auth already production-ready  
✅ **JWT auth system** — Login/register/guest/verify all wired up  
✅ **bcrypt password hashing** — Configured and working  
✅ **Chat with history persistence** — Via PostgreSQL/SQLAlchemy  
✅ **Voice input via Web Speech API** — Client-side STT integrated  
✅ **TTS via Web Speech API** — SpeechSynthesis integrated  
✅ **Profile management & logout** — Frontend components exist  
✅ **Responsive Tailwind UI** — Dark/light theme aware  
✅ **CORS + error handling** — Properly configured  
✅ **Scheme model with eligibility** — DB schema supports Ministry schemes  
✅ **Document ingestion path exists** — Code scaffolding in vector_db/

## Major Gaps (PS Not Yet Met)

### 1. Multilingual Support — CRITICAL
- **PS requirement:** Hindi, Tamil, Telugu, Bengali, Marathi + voice-first
- **Current state:** English only; Web Speech API hardcoded to `en-US`
- **Missing:** Indic language models, i18next, translation layer (IndicTrans2 planned Phase 3)

### 2. Voice-First / Hardware IVR Box — CRITICAL
- **PS requirement:** ESP32 + SIM800L box; dial number, press keys, hear TTS answer
- **Current state:** None — pure web/mobile app
- **Missing:** Embedded hardware design, GSM modem integration, DTMF handling, pre-rendered TTS clips

### 3. Grievance Ticketing System — CRITICAL
- **PS requirement:** Ticket ID + SMS status; user files complaint → gets ticket
- **Current state:** No ticketing, no SMS, no status tracking
- **Missing:** Grievance model + endpoint, ticket ID generation, Twilio SMS integration, status API

### 4. Curated Knowledge Base — HIGH
- **PS requirement:** 30-50 PDFs: cooperative laws, PMFBY, MSCS Act, PACS by-laws
- **Current state:** Document upload returns 501; no knowledge base populated
- **Missing:** PDF ingestion pipeline, text chunking (500 tokens, 50 overlap), embeddings push to Qdrant

### 5. Bhashini/AI4Bharat STT/TTS — HIGH
- **PS requirement:** Free govt Bhashini API; Indian-language ASR/TTS
- **Current state:** Web Speech API only; locked to `en-US`
- **Missing:** Bhashini API wrappers, AI4Bharat IndicConformer/IndicTTS, language selection UI

### 6. WhatsApp Integration — MEDIUM
- **PS requirement:** Optional webhook; doubles reach
- **Current state:** None
- **Missing:** WhatsApp Cloud API webhook, message handler

### 7. Intent Classifier — MEDIUM
- **PS requirement:** Classifier for scheme queries, grievance, PMFBY, etc.
- **Current state:** `processCommand` has simple keyword matching only
- **Missing:** Proper intent classification, routing to right response paths

### 8. Mobile App — MEDIUM
- **PS requirement:** Flutter app (text + voice buttons, language picker, history, ticket viewer)
- **Current state:** React web app only
- **Missing:** Flutter port or responsive web redesign

### 9. i18next Internationalization — MEDIUM
- **PS requirement:** Not yet installed/configured
- **Current state:** English only; i18next "planned not yet implemented"
- **Missing:** i18next setup, translation files for Hindi/Marathi, language picker

### 10. Test Coverage — MEDIUM
- **PS requirement:** No unit/integration tests visible
- **Current state:** No pytest suite visible in codebase
- **Missing:** Auth service tests, RAG quality evals, integration tests

## Priority Order for What to Add Right Now

### Priority 1 — Multilingual + Language Support (Foundation for everything else)
- Add `i18next` to frontend deps
- Set up language picker in App/Sidebar
- Add Hindi/Marathi UI strings
- Update Web Speech API to support Hindi (`hi-IN`) as fallback
- Add Indic language support markers in vector DB search

### Priority 2 — PDF Knowledge Base Ingestion
- Implement `/upload-document` endpoint (currently 501)
- Add PyMuPDF text extraction + chunking (500 tokens, 50 overlap)
- Integrate `bge-m3` or `intfloat/multilingual-e5-large` embeddings
- Push sample cooperative law PDFs to Qdrant
- This enables the RAG to actually answer domain questions

### Priority 3 — Intent Classifier + Scheme Routing
- Enhance `processCommand` with proper intent detection
- Add scheme eligibility lookup via the existing `schemes` model
- Route queries to appropriate response paths (PMFBY, grievance, by-laws)

### Priority 4 — Bhashini/AI4Bharat STT/TTS Integration
- Add Bhashini API wrappers (free govt API)
- Add AI4Bharat IndicConformer for STT
- Add AI4Bharat IndicTTS for TTS
- Add language selection in voice settings
- This enables the "voice-first" requirement

### Priority 5 — Grievance Ticketing System
- Add grievance model (ticket_id, status, user_id, query, created_at)
- Add `/api/grievance` endpoint
- Add SMS via Twilio or fallback SMS service
- Frontend: grievance form + ticket viewer

### Priority 6 — Mobile Responsiveness / Flutter Consideration
- Evaluate if React → Flutter port is needed, or if responsive web suffices
- Add language picker UI component
- Ensure all features work on mobile

## Immediate Action Items (Next 2-3 Days)

1. ✅ **Set up i18next** + language picker in Sidebar
2. ✅ **Implement `/upload-document`** with PyMuPDF + Qdrant ingestion
3. ✅ **Add Hindi `hi-IN` support** to Web Speech API calls
4. ✅ **Enhance intent classifier** in `ProcessCommands.py`
5. ✅ **Add grievance model + endpoint** (simple ticket ID generation)
6. ✅ **Add AI4Bharat IndicConformer** STT wrapper alternative
7. ✅ **Populate sample scheme data** in the schemes table (PMFBY, MSCS Act examples)
8. ✅ **Update README** with current capabilities + known gaps vs PS requirements

## Recommendation

The Nayak project has a **solid authentication + RAG foundation** (≈45% of PS requirements covered technically), but the **multilingual + voice + grievance** dimensions are largely untouched. To align with SIH26088:

- Short-term (this sprint): Multilingual foundation + knowledge base ingestion
- Mid-term (next 2 sprints): Bhashini/AI4Bharat STT/TTS + grievance ticketing
- Long-term (stretch): Flutter app + IVR box emulation + WhatsApp integration

The project is **not currently SIH26088-aligned** but can be brought into alignment with focused work on the 6-8 high-impact gaps listed above.