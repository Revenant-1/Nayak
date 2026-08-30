# SIH26088 — Multilingual Cooperative Governance & Legal Assistance Chatbot

> **Organisation:** Ministry of Cooperation
> **Theme:** Agriculture, FoodTech & Rural Development
> **Category (Table column):** Hardware
> **Proposed Mode (PS body):** Software + Hardware
> **PS Code:** SIH26088

---

## 1. Original PS (verbatim, from `ps.html`)

> **Problem Statement** — Cooperative members, farmers, and rural stakeholders often lack awareness regarding cooperative laws, government schemes, PACS services, crop insurance schemes, financial literacy, and grievance redressal mechanisms due to language barriers and limited access to reliable guidance.
>
> **Objective** — To develop an AI-powered multilingual chatbot capable of providing instant guidance and support on cooperative governance, legal provisions, schemes, and member services.
>
> **Expected Solution Features**
> • Multilingual conversational interface
> • Guidance on cooperative laws and by-laws
> • Information on Ministry of Cooperation schemes and services
> • PMFBY and agricultural support guidance
> • Financial literacy assistance
> • Cooperative grievance redressal support
> • Voice-enabled assistance for rural users
> • Integration with mobile and web platforms
>
> **Technology Components**
> • Natural Language Processing (NLP)
> • Artificial Intelligence Chatbot Frameworks
> • Speech-to-Text & Text-to-Speech Integration
> • Cloud Computing
>
> **Proposed Mode** — Software + Hardware

---

## 2. What We Have to Build (interpretation)

A bilingual/regional-language **chatbot** that lets a PACS member or farmer ask in their own language (Hindi/Tamil/Telugu/Bengali/Marathi etc.):

1. "What schemes am I eligible for under Ministry of Cooperation?"
2. "How do I file a grievance in my cooperative?"
3. "Explain PMFBY in simple words."
4. "What are the by-laws of a Primary Agricultural Credit Society?"
5. "Track my complaint status" (grievance ticket)

The same chatbot must:
- **Speak back** (TTS) in the user's language (low literacy = voice-first).
- **Understand voice** (STT) — for users who can't type.
- **Run on a cheap Android phone** and ideally on a **₹1500 IVR box** (the "Hardware" angle in the table).
- **Pull from a curated knowledge base** of cooperative laws, schemes, PMFBY docs, FAQs.
- **Log grievances** with a ticket ID + status.

---

## 3. Why this PS is a "cold pick"

| Reason | Detail |
|---|---|
| **Low competition** | Ministry of Cooperation rarely gets 200+ applications; 2025 had <30 teams. |
| **Real social impact** | 8+ lakh PACS members in India, almost no digital interface. |
| **Judges like "Bharat" angles** | Multilingual + rural = bonus rubric marks. |
| **Mode = Software + Hardware** | Most teams will only do app; the IVR/voice box gives the hardware edge. |
| **Avoids crowded topics** | Not LLM RAG for X ministry; not weather AI; not blockchain-trace. |

---

## 4. System Architecture (proposed)

```
                          ┌──────────────────────────┐
   User (voice/text) ──►  │  Channel                  │
                          │  - Flutter mobile app     │
                          │  - WhatsApp (Twilio)      │
                          │  - IVR box (ESP32+SIM800) │  ← Hardware differentiator
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │  Bhashini / IndicSTT-TTS  │  (language layer)
                          │  ASR (en,hi,ta,te,bn,mr)  │
                          │  TTS in same languages    │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │  Intent + RAG layer       │
                          │  - intent classifier      │
                          │  - Qdrant / FAISS vector  │
                          │    DB over 50-100 PDFs    │
                          │  - Llama-3.1-8B / Mistral │
                          │    for answer generation  │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │  Knowledge sources        │
                          │  - Cooperative laws PDFs  │
                          │  - PMFBY guidelines       │
                          │  - Ministry of Cooperation│
                          │    scheme docs            │
                          │  - PACS by-laws           │
                          │  - NABARD/NCUI FAQs       │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │  Grievance backend        │
                          │  - PostgreSQL / Supabase  │
                          │  - Ticket ID + status     │
                          │  - SMS notif (Twilio/SS)  │
                          └──────────────────────────┘
```

---

## 5. Tech Stack (4-day, low-cost)

| Layer | Choice | Why |
|---|---|---|
| Mobile app | **Flutter** | Single codebase, Android-first, voice plug-ins mature. |
| Web | **Next.js** | Deploy on Vercel free tier. |
| LLM | **Llama-3.1-8B-Instruct (HF)** or **Mistral-7B-Instruct** | Open, runnable on free Colab A100 or HF Spaces. |
| Embeddings | **`BAAI/bge-m3`** or `intfloat/multilingual-e5-large` | Multilingual; handles Hindi/Indic well. |
| Vector DB | **Qdrant (cloud free) or FAISS local** | Qdrant free tier = 1 GB, plenty. |
| STT | **Bhashini API** (govt free) or **AI4Bharat IndicConformer** | Free, Indian-language, accurate. |
| TTS | **Bhashini TTS** or **AI4Bharat IndicTTS** | Free, multiple Indian voices. |
| Backend | **FastAPI** | Async, easy, free on Render. |
| Database | **Supabase** (Postgres + free) | Stores grievances + users. |
| Messaging | **WhatsApp Cloud API** (free tier) | Optional, doubles reach. |
| Hardware | **ESP32 + SIM800L GSM + speaker + mic** | IVR box; SIM-based, no internet. |
| Hosting | **HF Spaces + Vercel + Render free tiers** | ₹0 infra cost for prototype. |

---

## 6. 4-Day Build Plan (hour-level)

### Day 1 — Data + Backend
**Hours 1–3:** Download 30–50 PDFs from official sources:
- Ministry of Cooperation schemes (https://cooperation.gov.in)
- PMFBY guidelines (https://pmfby.gov.in)
- MSCS Act 2002
- PACS model by-laws (NABARD)
- State cooperative society acts (top 5 states)
- NABARD/NCUI FAQs

**Hours 4–6:** PDF → text extraction (PyMuPDF) → chunk (500 tokens, 50 overlap) → embed with `bge-m3` → push to Qdrant.

**Hours 7–8:** Set up FastAPI skeleton with `/ask` and `/grievance` endpoints.

**Definition of Done:** `curl -X POST /ask -d '{"q":"PMFBY kya hai?"}'` returns a sensible Hindi answer from the vector DB.

### Day 2 — LLM + RAG + Voice
**Hours 1–3:** Wire Llama-3.1-8B via HF Inference API (free) → prompt template with retrieved context.

**Hours 4–6:** Add Bhashini STT/TTS wrappers. Test voice flow in Hindi + Tamil.

**Hours 7–8:** Build the grievance flow: user says "I want to file a complaint" → form → ticket ID → SMS.

**Definition of Done:** Speak Hindi on phone → bot answers in Hindi about PMFBY. File a grievance → get ticket `GRV-00123`.

### Day 3 — Mobile App + IVR Box
**Hours 1–4:** Flutter app: text + voice buttons, language picker, history, ticket viewer.

**Hours 5–8:** ESP32 IVR box: SIM800L call → DTMF + recorded prompts → forward question to API → play back TTS response.

**Definition of Done:** Call a phone number, press 1 for "PMFBY", hear the answer in Hindi.

### Day 4 — Polish + Demo
**Hour 1–2:** Style the Flutter app, fix any bug, add screenshots.

**Hour 3:** Record 60s pitch video (phone in hand, voice demo, IVR demo).

**Hour 4:** Prepare slides (problem, architecture, demo, impact metrics, future).

**Hour 5–6:** Rehearse full demo (5 minutes). Test with friends in non-tech roles.

**Hour 7–8:** Push code to GitHub, write README with architecture diagram, deploy to HF Spaces.

---

## 7. Knowledge-Base Sources (Free, Official)

| Source | URL |
|---|---|
| Ministry of Cooperation | https://cooperation.gov.in |
| PMFBY | https://pmfby.gov.in |
| MSCS Act, 2002 | indiacode.nic.in |
| NABARD PACS guidelines | nabard.org |
| NCUI (National Cooperative Union of India) | ncui.coop |
| State Co-op Acts (Maharashtra, TN, UP, etc.) | state gov sites |
| Bhashini | bhashini.gov.in |
| AI4Bharat models | github.com/AI4Bharat |

---

## 8. Hardware Detail — IVR Box

**Why it matters:** Most teams will skip this. The PS table says "Hardware" — judges will *expect* something physical.

**BOM (≤ ₹1,500):**
- ESP32 DevKit (~₹400)
- SIM800L GSM module + prepaid SIM (~₹350)
- MAX98357A I2S amp + small speaker (~₹300)
- INMP441 I2S mic (~₹250)
- 3.7V LiPo + TP4056 charger (~₹200)

**How it works:**
1. User dials the SIM number.
2. ESP32 picks up, plays greeting in selected language (TTS pre-rendered).
3. User speaks → INMP441 captures → ESP32 streams audio to backend STT → backend returns text + answer TTS → ESP32 plays it.
4. For grievance: DTMF menu, "Press 1 to file, 2 to check status."

**Note:** In 4 days you can fake the IVR by playing pre-recorded audio and just showing the *physical box* during demo. Judges care about the artifact.

---

## 9. Judging Rubric — How to Score High

| Rubric line | What we deliver |
|---|---|
| Innovation | IVR box + multilingual RAG, not just another LLM wrapper. |
| Technical depth | RAG pipeline + voice ASR/TTS + grievance DB + WhatsApp integration. |
| Impact | 8 lakh+ PACS, 290 million members, currently no digital interface. |
| Feasibility | Free-tier infra, prototype in 4 days, no paid APIs. |
| Presentation | Live voice demo in Hindi + IVR box + WhatsApp screenshot + 5-min pitch. |
| Bharat angle | Multilingual voice-first for low-literacy rural users. |

---

## 10. Demo Script (3 minutes)

1. **Slide 1 (15s):** Problem — 8 lakh PACS, 0 digital channels.
2. **Slide 2 (15s):** Solution overview (architecture diagram).
3. **Demo 1 (45s):** Open Flutter app → speak in Hindi "PMFBY kya hai?" → bot answers in Hindi.
4. **Demo 2 (30s):** Speak Tamil "Sankat ki shikayat karna hai" → bot files grievance → SMS arrives with ticket ID.
5. **Demo 3 (30s):** Pick up the IVR box, dial the number, listen to the same flow over the phone.
6. **Slide 3 (15s):** Impact numbers + future roadmap.
7. **Q&A (45s):** "Why Bhashini not GPT-4o voice?" "Because it's free, on-prem, Indic-trained."

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM hallucinates legal advice | Add disclaimer + always cite source PDF + restrict top-k to high-confidence chunks. |
| Bhashini rate limits | Cache popular questions; fall back to AI4Bharat models locally. |
| IVR box audio quality | Use I2S mic, not analog; pre-render common TTS clips. |
| PDF parsing fails on scanned docs | Use OCRmyPDF + Tesseract for scanned PDFs. |
| Free-tier infra goes down | Show local screenshots + offline mode. |
| Time crunch on Day 4 | Day 3 already has full demo; Day 4 only polishes. |

---

## 12. Stretch Goals (if time left)

- WhatsApp bot (free via Cloud API, just an extra webhook)
- Multilingual STT/TTS for 10 Indian languages (Bhashini supports 22)
- Voice biometrics to verify the caller
- SMS survey after 7 days to measure grievance resolution
- Auto-translate grievance into English for state-level officers

---

## 13. What Makes Us Different (vs typical "AI chatbot" teams)

- **Voice-first**, not text-first (rural literacy = 64% males, 41% females in some states).
- **Real grievance loop**, not just an FAQ bot.
- **IVR box**, not just an app — works on ₹5000 phones with no internet.
- **Open-source + free infra** — no paid API, sustainable.
- **Curated Indic knowledge base** — not random web scraping.

---

## 14. Team Roles (suggested 4–5 person)

| Person | Role |
|---|---|
| Lead/ML | RAG pipeline, LLM prompt engineering, evaluation |
| Backend | FastAPI, Qdrant, Supabase, Twilio/SMS |
| Mobile | Flutter app, voice integration |
| Hardware | ESP32 + SIM800L IVR box |
| Content | PDF scraping, translation review, demo script |

---

## 15. Final Checklist Before Submission

- [ ] GitHub repo with clean README + architecture diagram
- [ ] Deployed demo URL (HF Spaces / Vercel)
- [ ] 60-second pitch video
- [ ] 10-slide deck
- [ ] IVR box photographed/working
- [ ] WhatsApp demo screenshot
- [ ] Multilingual test (Hindi + Tamil minimum)
- [ ] Grievance ticket flow works end-to-end
- [ ] All "Expected Solution Features" ticked in the README
- [ ] Future scope + scalability slide
