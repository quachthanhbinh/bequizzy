# BeQuizzy — Product Overview

**Last updated:** June 2026
**Domain:** bequizzy.com
**Source:** PRD.md · BUSINESS.md · ROADMAP.md

---

## Table of Contents

1. [What Is BeQuizzy?](#1-what-is-bequizzy)
2. [Target Customers & Pain Points](#2-target-customers--pain-points)
3. [North Star Metrics](#3-north-star-metrics)
4. [Competitive Landscape](#4-competitive-landscape)
   - [Direct AI Tutoring Platforms](#direct-ai-tutoring-platforms)
   - [1:1 Tutoring Marketplaces](#11-tutoring-marketplaces)
   - [Course Creation & Knowledge Monetization Platforms](#course-creation--knowledge-monetization-platforms)
   - [Language Learning Platforms](#language-learning-platforms)
   - [Local & Regional Products (Vietnam)](#local--regional-products-vietnam)
   - [BeQuizzy Positioning vs. Competitors](#bequizzy-positioning-vs-competitors)
5. [Features](#5-features)
   - [Tier 1 — Core (MVP)](#tier-1--core-mvp)
   - [Tier 2 — Should Have (Month 3–6)](#tier-2--should-have-month-36)
   - [Tier 3 — Nice to Have (Month 6+)](#tier-3--nice-to-have-month-6)
   - [Out of Scope](#out-of-scope)
6. [Foundation Infrastructure](#6-foundation-infrastructure)
7. [How It Works](#7-how-it-works)
8. [Pricing](#8-pricing)

---

## 1. What Is BeQuizzy?

BeQuizzy is an **AI-powered interactive learning platform** for ages 5 to adult — because learning is a lifelong process.

It is simultaneously four things:

- **An Interactive Simulation Engine** — the heart of BeQuizzy. Every subject is rendered as an interactive, real-world simulation: chemistry experiments on a virtual lab bench, physics sandboxes, 3D geometry sculptors, live conversation scenes for languages, virtual instruments for music. Learning happens by **doing and discovering**, not reading.
- **An AI Personal Tutor** — an always-on, adaptive tutor that guides learners through simulations with Socratic questioning. The AI watches what the learner experiments with, identifies misconceptions, and steers discovery — covering STEM, languages, exam prep, life skills, arts, music, and beyond.
- **A Marketplace for Human Tutors** — qualified teachers and domain experts can receive students 1:1, open group classes, and use BeQuizzy's interactive simulation tools live in session to make teaching more engaging and memorable.
- **An AI Avatar Creator Studio** — tutors package their expertise, teaching style, and knowledge base into a personalized AI version of themselves. Students purchase a license to learn from a tutor's AI avatar on demand, at any time.

The core belief: **the best way to learn is to experience it** — every concept should be tangible, visual, and interactive before it becomes abstract knowledge.

### Mission

> **Erase the geographic boundaries of quality education.**
> A child in Cà Mau, a fishing village in Indonesia, or a rural township in the Philippines deserves the same world-class learning as a child in Hanoi, Singapore, or Tokyo. Where you are born should not determine what you are allowed to know.

### Vision

> **BeQuizzy is every learner's lifelong companion — from their first curiosity at age 5 to the last lesson they freely choose to take.**
> Learning is not a phase of life. It is life itself. BeQuizzy walks alongside every individual — child, teenager, adult, or elder — adapting to their stage, pace, and goals at every turn.

### The Problem We Solve

| Problem | Reality Today | BeQuizzy's Answer |
|---|---|---|
| **Geographic inequality** | Top tutors concentrate in Hanoi, HCMC, Bangkok, Jakarta. Rural children are left behind | AI tutor + simulation engine available everywhere with an internet connection |
| **Affordability barrier** | A good private tutor costs 200,000–500,000₫/hour. Not every family can afford it | Subscription at a fraction of the cost; AI tutor never tires, never judges |
| **Subject breadth** | School covers core academics. No one teaches you Morse code, body language, or how to play piano affordably | Broadest learning platform ever built — academics to life skills to arts |
| **Lifelong learning gap** | After school, most people stop learning systematically | The platform grows with the learner — from finger-painting at 5 to GRE prep at 28 to learning piano at 55 |
| **Knowledge monetization for teachers** | A brilliant tutor in Đà Lạt can only teach students within driving distance | AI Avatar Studio lets any expert's knowledge reach the world 24/7 |
| **Global citizenship readiness** | Local curricula prepare children for local life, not a globalized world | Multilingual by design; cultural context in every subject; world geography, history, communication |

### Global Citizenship Education Track

Running as a thread across all subjects — not a separate module, but a lens:

- **Language as a gateway** — every language course includes cultural immersion (food, customs, festivals, history of the people who speak it)
- **World Geography Explorer** — interactive globe; click any country to learn its geography, government, economy, culture, and famous people
- **Comparative History** — same event told from multiple national perspectives (e.g., WWII from Vietnamese, Japanese, American, and French viewpoints)
- **Global Current Events** — age-appropriate AI discussion of world news; learners form and defend opinions
- **Cross-cultural Communication** — how gestures, directness, humor, and silence mean different things across cultures
- **International Exam Readiness** — IELTS, TOEFL, SAT, GMAT, GRE, DELF — the passports to global opportunity

---

## 1.5. The Interactive Simulation Engine — Core Design Principle

> **BeQuizzy is not a quiz app. It is a real-world simulation platform.**
> Every subject is rendered as a live, interactive experience. Learners see, touch, mix, build, and discover — the same way scientists, musicians, and artists actually work. The simulation engine is what makes content memorable instead of forgettable.

### Design Philosophy

```
TRADITIONAL LEARNING:          BEQUIZZY LEARNING:
  Read text about H₂O    →     Open a beaker of water (canvas, animated)
  Memorize formula       →     Mix H₂ + O₂ → watch explosion → H₂O forms
  Take a quiz            →     Identify mystery liquid by its reactions
  Forget in 2 weeks      →     Remember forever because you "did" it
```

All simulation experiences follow the same loop:

```
SEE IT     →    TOUCH IT    →    EXPERIMENT    →    DISCOVER    →    MASTER
(visual        (interact        (free play,         (AI guides       (quiz,
 render)        with it)         no wrong             the aha          unlock
                                 answer)              moment)          next)
```

Gamification wraps every simulation: XP points, level unlocks, streak bonuses, challenge mode (timed), leaderboards, rare experiment unlocks, and achievement badges modeled after real-world milestones (e.g., "Junior Chemist", "Black Belt Typist", "Polyglot Explorer").

---

### Chemistry Simulation Lab

The flagship simulation. Every element and compound is rendered with physical reality:

| Simulation Layer | Detail |
|---|---|
| **Visual state rendering** | Each substance shown in correct physical state: liquid (flows, surface tension ripple), solid (crystalline or amorphous shape), gas (diffuses, color-tinted cloud animation) |
| **Container system** | Drag-and-drop containers: test tube, beaker, Erlenmeyer flask, petri dish, balloon, closed vessel, bunsen burner stand — all animated on a canvas lab bench |
| **Substance library** | 200+ substances at launch; each has: color, state, smell (emoji tag), hazard label (🔥 flammable, ☠️ toxic, ⚗️ corrosive, 💧 soluble) |
| **Reaction engine** | Mix Substance A + Substance B → real reaction: color change animation, bubbling/fizzing, precipitate forming, heat release (container turns red), gas escaping (balloon inflates), explosion (for dangerous combos, with safety warning) |
| **Chemical equation display** | As reaction occurs, balanced equation appears: `2H₂ + O₂ → 2H₂O` with mole ratios visualized |
| **Reaction storytelling** | After reaction: AI explains *why* it happened, what bonds broke and formed, real-world applications |
| **Safety mode** | Dangerous reactions shown with warning overlay and protective gear reminder — positioned as learning, never glorified |

**Game Modes:**
- 🔬 **Free Lab** — open sandbox, no rules, experiment freely
- 🕵️ **Mystery Compound** — identify an unknown substance by running tests (color, pH, reactions); earn detective XP
- ⚗️ **Synthesis Challenge** — given a target compound, figure out the reaction pathway to produce it
- 🏆 **Speed Lab** — race against timer to balance equations or predict products
- 📖 **Guided Discovery** — AI tutor leads through a famous historical experiment (e.g., Priestley discovering oxygen)

---

### Physics Simulation Sandbox

| Simulation | Detail |
|---|---|
| **Gravity & Motion** | Drop objects, adjust mass/gravity/air resistance; projectile launcher with angle controls; slow-motion replay |
| **Circuit Builder** | Drag batteries, resistors, bulbs, switches onto a canvas; real current flows (animated electrons); short circuit sparks |
| **Wave & Sound** | Visualize sound waves from instruments; interference patterns; doppler effect with moving source |
| **Optics** | Shine light rays through lenses and prisms; see refraction, reflection, dispersion into rainbow |
| **Pendulum & Springs** | Adjust length/mass/gravity; watch oscillation; plot motion graph in real time |
| **Rube Goldberg Builder** | Drag components (ramp, ball, domino, lever, pulley); build chain reactions; share with friends |

---

### Biology Simulation Lab

| Simulation | Detail |
|---|---|
| **Zoomable Cell** | Start at organism view; zoom into tissue → cell → organelle → molecule; each layer is interactive |
| **Virtual Dissection** | Step-by-step animated dissection (frog, flower, heart); label organs; no physical animals harmed |
| **DNA Builder** | Drag nucleotide bases; build double helix; introduce mutations; see protein synthesis result |
| **Ecosystem Simulator** | Add/remove species; watch predator-prey population graphs shift in real time; simulate extinction events |
| **Microscope Viewer** | Pre-rendered microscope slides (blood cells, bacteria, plant cells); adjust magnification knob |

---

### Mathematics Visualization Engine

| Simulation | Detail |
|---|---|
| **3D Geometry Sculptor** | Drag sliders to build and morph 3D shapes; real-time volume and surface area calculation display |
| **Function Grapher** | Type any function → see it plotted; drag parameters to see how graph changes; real-world context overlaid (e.g., parabola = ball trajectory) |
| **Probability Sandbox** | Flip coins, roll dice, spin wheels — see theoretical vs actual distribution form over hundreds of trials |
| **Fraction Kitchen** | Pizza/cake slices for young learners; add, subtract, and compare fractions visually |
| **Number Line Explorer** | Animated jumps for addition/subtraction; zoom into decimals and negative numbers |

---

### Language Immersion Scenes

| Simulation | Detail |
|---|---|
| **Scene-Based Conversation** | Learner is "placed" in a scene (Vietnamese market, Tokyo subway, Madrid café); AI characters speak and respond in target language |
| **Pronunciation Mirror** | Record yourself → AI overlays your waveform against native speaker's; highlights differences; scores accuracy |
| **Word Association Web** | Click a word → see related words radiate outward; click any to hear it, see it in context, see etymology |
| **Subtitle Lab** | Watch a short clip in target language; toggle subtitles; click any word to get instant definition + pronunciation |

---

### Music & Instrument Studio

| Simulation | Detail |
|---|---|
| **Virtual Piano** | Full 88-key canvas keyboard; click or use keyboard shortcuts; see sheet music notation update in real time |
| **Guitar Fretboard** | Interactive fretboard; tap strings; chord fingering diagrams; strum animation |
| **Sound Wave Visualizer** | Play any note → see its waveform; stack harmonics; show why chord = pleasant (frequency ratios) |
| **Rhythm Trainer** | AI plays a rhythm → learner taps to match; game mode with increasing complexity |
| **Music Theory Canvas** | Drag notes onto a staff; hear what chord forms; see circle of fifths; compose a simple melody |

---

### Cosmology & Astronomy Explorer

| Simulation | Detail |
|---|---|
| **Solar System Navigator** | 3D real-scale (compressed) solar system; click each planet for stats; animate orbits with real speed ratios |
| **Scale Simulator** | "How big is the Sun compared to Earth?" — animated zoom from your house → city → Earth → Solar System → Milky Way |
| **Constellation Canvas** | Click any star in a night sky render; learn its name, distance, spectral type; connect dots to form constellations |
| **Black Hole Visualizer** | Animated gravitational lensing; show event horizon; explain time dilation with visual clock comparison |

---

### Typing & Morse Code Trainer

| Simulation | Detail |
|---|---|
| **10-Finger Trainer** | Animated hand overlay shows correct finger placement; real-time WPM and accuracy tracking; unlock new texts as speed improves |
| **Morse Code Decoder** | Listen to real Morse audio; decode by tapping; encode messages; historical context (Titanic distress call) |
| **Typing Races** | Race against AI opponents or friends in real time; ghost replay of personal best |
| **Vietnamese Input** | Full Telex/VNI mode support; diacritic placement practice |

---

### Life Skills Simulations

| Simulation | Detail |
|---|---|
| **Budget Simulator** | Given a monthly income; make spending decisions; see bank account and happiness meter respond |
| **Cooking Lab** | Step-by-step interactive recipe with timer; ingredient scaling; see Maillard reaction explained when browning meat |
| **First Aid Trainer** | Animated patient; tap correct first aid steps in right order; CPR rhythm trainer with metronome |
| **Body Language Reader** | Short video clips of people; learner interprets emotion; AI reveals the micro-expressions and explains cues |

---

### Scientific Discoveries Lab

> **Learn how humanity discovered the world — by re-living the exact experiment.**
> Every great discovery in history started with a question, an observation, and an experiment. BeQuizzy puts the learner in the scientist's shoes *before* revealing the answer. Accompanied by links to the original research paper or historical document.

| Discovery Scenario | Interactive Simulation | Primary Source |
|---|---|---|
| **Newton & Gravity** (1687) | Drop objects of different masses from a tower; observe they land together; adjust air resistance; discover F=ma experimentally | *Principia Mathematica*, Newton (1687) |
| **Archimedes & Buoyancy** (c.250 BC) | Lower objects into a water tank; watch water level rise; measure displaced volume; discover density principle | *On Floating Bodies*, Archimedes |
| **Marie Curie & Radioactivity** (1898) | Simulate Geiger counter readings from various minerals; isolate the radioactive element; name it | Nobel Lecture, Curie (1911) |
| **Fleming & Penicillin** (1928) | Petri dish simulation — grow bacteria colonies; introduce mold at different spots; observe kill zones; form hypothesis | *British Journal of Experimental Pathology*, Fleming (1929) |
| **Mendel & Genetics** (1866) | Cross pea plants with different traits; record offspring ratios; discover dominant/recessive pattern | *Versuche über Pflanzenhybriden*, Mendel (1866) |
| **Einstein's Thought Experiments** (1905) | Ride a beam of light; observe clock dilation; measure speed from different reference frames | *Annalen der Physik*, Einstein (1905) — Special Relativity |
| **Darwin & Evolution** (1859) | Navigate the Galápagos islands; observe beak variation; simulate natural selection across generations | *On the Origin of Species*, Darwin (1859) |
| **Galileo & Falling Bodies** (1590s) | Drop objects from Leaning Tower of Pisa simulation; disprove Aristotle's "heavier = faster" assumption | *Discorsi*, Galileo (1638) |
| **Hubble & Expanding Universe** (1929) | Measure galaxy redshift in simulation; plot recession velocity vs distance; discover the universe is expanding | *PNAS*, Hubble (1929) |
| **Watson, Crick & DNA** (1953) | Rotate X-ray diffraction image; deduce helical structure; build the double helix from base pairs | *Nature*, Watson & Crick (1953) |
| **Tesla & AC Power** (1887) | Build an AC vs DC circuit; animate power loss over distance; see why AC won the "War of Currents" | USPTO Patent 381,968, Tesla (1888) |
| **Faraday & Electromagnetic Induction** (1831) | Move a magnet through a coil; watch current meter respond; build first primitive generator | *Philosophical Transactions*, Faraday (1832) |

**Each Discovery Scenario includes:**
- 🔬 **Interactive experiment** — learner runs it themselves, no answer revealed upfront
- 💭 **"What do you think happened?"** — AI asks for hypothesis before revealing truth
- 📄 **Original source** — linked paper, patent, or historical document
- 🌍 **Real-world impact** — "this discovery led to X, which today powers Y"
- 🏅 **Nobel Trail** — badge series for completing all discoveries in a scientific field

---

### Reflex Training Arena

> **The fastest muscles in your body are trained by your brain.**
> Reflex training is backed by neuroscience: reaction time is a trainable cognitive skill, not fixed at birth. BeQuizzy's Reflex Arena trains four distinct reflex types — visual, auditory, tactile, and verbal — each with games calibrated to benchmark averages and adaptive difficulty.

**The Science of Reaction Time:**
- Visual simple reaction time: **~200–250ms** average (eye → brain → hand)
- Auditory simple reaction time: **~160–180ms** — *faster than visual* because auditory nerve is shorter
- Tactile reaction time: **~150ms** — fastest of all three primary senses
- Training effect: dedicated practice reduces reaction time by **15–30%** (peer-reviewed; Aimlabs/Lumos Labs studies)

---

#### 👁️ Visual Reflex — Nhanh Mắt

| Game / Exercise | Mechanic | Skill Trained |
|---|---|---|
| **Flash Target** | Targets flash on screen in random positions; tap as fast as possible; tracks ms per hit | Simple visual reaction time |
| **Color Snap** | Screen fills with a color; tap only when it matches the target color | Discrimination + selective attention |
| **Peripheral Patrol** | Central task running; targets appear in periphery — catch them without losing central focus | Peripheral vision + dual attention |
| **Moving Target Lock** | Targets drift across screen at increasing speed; maintain cursor on target for 2s | Eye-tracking smoothness (pursuit) |
| **Pattern Flash** | Grid of tiles flashes a pattern for 300ms; reproduce the pattern from memory | Visual memory + spatial recall |
| **Baseline Test** | Standard simple reaction time benchmark (click when red turns green); compare to global average | Baseline measurement |

---

#### 👂 Auditory Reflex — Nhanh Tai

| Game / Exercise | Mechanic | Skill Trained |
|---|---|---|
| **Sound Snap** | Tap when you hear the target sound in a stream of different sounds | Auditory selective attention |
| **Beat Rider** | Listen to a rhythm; tap in sync; score on timing precision (±20ms) | Rhythm perception + timing accuracy |
| **Direction Finder** | Binaural audio — sound plays from left, right, front, or behind; identify direction without looking | Sound localization (spatial hearing) |
| **Phoneme Lightning** | Rapid audio clips of similar sounds (/p/ vs /b/, /th/ vs /d/); tap correct one — used for both reflex training and language learning | Phoneme discrimination |
| **Melody Match** | Hear a short melody; identify if the repeat is the same or altered (one note changed) | Tonal memory (important for music + tonal languages) |
| **Silence Detector** | Stream of beeps with one gap; tap the moment silence begins | Precision auditory timing |

> **Cross-skill note:** Auditory reflex training directly accelerates language learning (especially tonal languages: Mandarin, Vietnamese, Thai) and musical instrument learning.

---

#### 🤚 Hand Speed Reflex — Nhanh Tay

| Game / Exercise | Mechanic | Skill Trained |
|---|---|---|
| **Tap Fury** | Alternating left/right key taps at increasing BPM; like a drumming metronome | Bilateral hand alternation speed |
| **Precision Aim** | Small targets appear; click center precisely; penalizes overshoot — accuracy over raw speed | Fine motor precision |
| **Piano Cascade** | Notes fall in Piano Hero style; press correct keys in time | Finger independence + hand-eye-sound sync |
| **Typing Sprint** | Timed typing race; track WPM and accuracy; ghost replay of personal best | Finger typing reflex + muscle memory |
| **Grip Switch** | Alternate between wide grip (all fingers spread) and pinch — trains opposable dexterity | Grip flexibility |
| **Surgical Steady** | Guide a cursor through a winding path without touching walls; measures fine tremor | Fine motor steadiness |

---

#### 🗣️ Verbal Speed Reflex — Nhanh Miệng

| Game / Exercise | Mechanic | Skill Trained |
|---|---|---|
| **Tongue Twister Timer** | Read tongue twisters aloud; AI scores fluency and speed via mic; tracks improvement over sessions | Articulatory speed + phoneme sequencing |
| **Word Lightning** | AI says a category (e.g., "animals"); learner names as many as possible in 30 seconds | Verbal fluency + lexical retrieval speed |
| **Rapid Translation** | Word appears in Language A; say translation in Language B as fast as possible | Bilingual switching reflex |
| **Debate Snap** | AI gives a controversial statement; learner has 5 seconds to start a response; trains immediate verbal formulation | Impromptu verbal response |
| **Number Recite** | AI reads digits aloud; learner repeats immediately; sequence grows longer each round (verbal working memory) | Verbal-auditory working memory |
| **Pitch Match** | AI sings a note; learner hums to match; AI shows waveform alignment | Vocal pitch matching (music + tonal language) |

---

#### 🧠 Cognitive Speed — Nhanh Não

| Game / Exercise | Mechanic | Skill Trained |
|---|---|---|
| **Mental Math Blitz** | Arithmetic questions appear; answer before timer runs out; difficulty auto-scales | Calculation speed under pressure |
| **Stroop Challenge** | Word "RED" written in blue ink — say the *color*, not the word; classic interference task | Cognitive inhibition + processing speed |
| **N-Back Memory** | Remember the item shown N steps ago in a stream; N increases as performance improves | Working memory capacity |
| **Chimp Grid** | Numbers appear on grid, then disappear; tap positions in order — mirrors Human Benchmark "Chimp Test" | Visual-spatial working memory |
| **Decision Tree** | Multiple-choice branches appear rapidly; make correct decisions without slowing the chain | Decision speed under uncertainty |
| **Pattern Sprint** | Series of shapes with one rule; identify rule and apply it to novel cases as fast as possible | Fluid reasoning speed |

---

**Reflex Arena Progression System:**
```
BASELINE TEST  →  WEAKNESS IDENTIFIED  →  TARGETED TRAINING  →  RETEST  →  RANK UP

Ranks: Apprentice → Journeyman → Specialist → Expert → Elite → Legendary
Each rank unlocks: new game modes, harder difficulty, leaderboard access, cosmetic avatar items
```

**Cross-subject reflex benefits:**
| Reflex Type | Benefits In |
|---|---|
| Visual | Gaming, driving, sports, surgery simulation |
| Auditory | Music, language learning (tonal languages), communication |
| Hand Speed | Typing, music instruments, STEM lab precision |
| Verbal Speed | Language fluency, debate, presentation, social skills |
| Cognitive | Math, chess, problem-solving, exam performance under time pressure |

---

## 2. Target Customers & Pain Points

### Learner Personas

| Persona | Age | Key Pain Points |
|---|---|---|
| **Young Explorer** | 5–12 | Learning is boring, abstract; parents struggle to explain concepts interactively at home |
| **School Student** | 10–18 | Needs 1:1 academic support (math, science, languages), exam prep (SAT, IELTS), but private tutors are expensive |
| **Language Learner** | 15–40 | Wants to learn English, Chinese, Japanese, Korean, Spanish etc. but existing apps are monotonous and lack real conversational practice |
| **Test Prep Candidate** | 18–30 | GMAT, GRE, SAT, IELTS — needs structured, personalized, adaptive prep with feedback |
| **Creative Learner** | Any | Wants to learn piano, guitar, drawing, graffiti, calligraphy — difficult to find affordable, quality instruction |
| **Lifelong Learner / Adult** | 25–60 | Wants to acquire new skills (typing, Morse code, soft skills, body language, numerology) outside of a traditional classroom |
| **Parent** | 30–50 | Wants safe, engaging, curriculum-aligned learning tools for their children; wants visibility into progress |

### Tutor Personas

| Persona | Description | Key Pain Points |
|---|---|---|
| **Independent Tutor** | Subject expert running 1:1 sessions | No platform to manage students, schedule, payments, and learning materials in one place |
| **Small Tutoring Center** | 2–10 teachers | Needs student management, attendance, invoicing, progress tracking |
| **Knowledge Creator / Expert** | Domain expert (musician, coder, artist, linguist) | Wants to monetize their expertise at scale beyond active 1:1 hours |
| **Institutional Educator** | School teacher or university lecturer | Wants digital tools to make classroom content interactive and self-paced |

---

## 3. North Star Metrics

| Metric | Why It Matters |
|---|---|
| **Weekly Active Learners (WAL)** | Retention signal — learning habits are built through regular engagement, not one-off sessions |
| **Learning Sessions Completed per Learner per Week** | Depth of engagement — signals genuine learning behavior, not just logins |
| **AI Tutor Satisfaction Score (ATSS)** | Quality of AI tutoring interactions — rated after each session |
| **Tutor-to-Student Match Rate** | Marketplace health — % of students who successfully find and book a human tutor |
| **AI Avatar Licenses Purchased** | Monetization signal — validates the AI Avatar Creator Studio model |
| **Monthly Recurring Revenue (MRR)** | Business health |

---

## 4. Competitive Landscape

### Direct AI Tutoring Platforms

| Product | Focus | Target Age | Pricing | Weakness vs. BeQuizzy |
|---|---|---|---|---|
| **Growtrics.ai** | Math & Science (Singapore curriculum) | K-12 | ~$15–20/mo | Narrow subject scope (Math+Science only); Singapore-focused; no human tutor marketplace; no creator economy layer |
| **Synthesis Tutor** | K-5 Math only | 5–11 | $29/mo or $119/yr | Extremely narrow (Math only); no adult learning; no marketplace; no language support |
| **Photomath** | Math problem scanning & solving | 10–25 | Free / $69.99/yr | Passive answer-giving, not active tutoring; no other subjects; no human connection |
| **Khanmigo (Khan Academy)** | Broad K-12 curriculum, AI assistant | 5–18 | Free / ~$4/mo | No human tutor marketplace; no AI avatar; limited adult use cases; no monetization for teachers |
| **Quizlet** | Flashcard-based study & test prep | 10–25 | Free / Plus | Tool-based, not a tutor; no live instruction; no teacher monetization |
| **Brainly** | Homework help Q&A community | 10–20 | Free / Plus | Community answers, not personalized; no AI tutor; no human marketplace |

### 1:1 Tutoring Marketplaces

| Product | Focus | Scale | Pricing | Weakness vs. BeQuizzy |
|---|---|---|---|---|
| **Preply** | Languages + corporate training | 100,000+ tutors | Per lesson ($8–$80+/hr) | Language-only; no AI tutor as fallback; no creator AI avatar; no interactive learning tools |
| **italki** | 150+ languages | 20,000+ teachers | Per lesson ($8+/hr) | Language-only; community-driven content but no AI tutoring; no AI avatar feature |
| **Wyzant** | Multi-subject K-12 + test prep | Large US-focused | Per lesson ($35–$100+/hr) | No AI; US-only; no creator economy; expensive for SEA market |
| **Superprof** | Multi-subject global | Millions of tutors | Per lesson | No AI; platform is a directory, not a true learning environment |

### Course Creation & Knowledge Monetization Platforms

| Product | Focus | Scale | Pricing | Weakness vs. BeQuizzy |
|---|---|---|---|---|
| **Teachable** | Online course creation & coaching | 150,000+ schools | $0–$299/mo | Self-directed video courses only; no AI tutor; no live adaptive learning; no AI avatar |
| **Thinkific** | Online course + community | 35,000+ businesses | Free–$149/mo | Asynchronous content; no AI tutoring interaction; no student-facing adaptive AI |
| **Maven** | Cohort-based expert courses | Large | Revenue share | Focused on professionals; high ticket; no kids/school learning; no AI avatar |
| **Udemy** | Course marketplace | 62M+ students | Revenue share | One-size-fits-all courses; no personalization; no adaptive AI tutor; no 1:1 human connection |
| **Coursera** | University/professional certificates | Large | $399+/yr | Adult professionals only; no AI tutor interaction; no creator AI avatar; no K-12 |

### Language Learning Platforms

| Product | Approach | Languages | Pricing | Weakness vs. BeQuizzy |
|---|---|---|---|---|
| **Duolingo** | Gamified self-study | 40+ languages | Free / $7/mo | Language-only; gamification ≠ real conversational fluency; no human tutor; no creator economy |
| **Babbel** | Structured lessons | 14 languages | ~$7/mo | Language-only; no AI tutor; no human marketplace; limited interactivity |
| **Busuu** | Lessons + native speaker feedback | 12 languages | ~$10/mo | Language-only; feedback is community-based; no AI avatar |

### Local & Regional Products (Vietnam)

| Product | Focus | Weakness vs. BeQuizzy |
|---|---|---|
| **type.scala.vn** (Typing Kid VN) | Vietnamese 10-finger typing training | Single-skill tool (typing only); no AI; no broader curriculum; no monetization |
| **loppi.io.vn** | Tutoring center management (attendance, fees, parent communication) | Admin/ops tool only; no actual teaching or AI; no student learning features |
| **growtrics.ai** | Math/Science AI tutoring (Singapore-focused) | See above; not Vietnam-native; very narrow |

### BeQuizzy Positioning vs. Competitors

```
BREADTH OF LEARNING SUBJECTS
           Narrow ◄────────────────────────────────► Broad
                                                     [BeQuizzy]
Photomath ──────────────────────────────────────────────►
Synthesis ─────────────────────────────────────────────►
Growtrics ──────────────────────────────────────────────►
Duolingo ──────────────────────────────────────────────►
Quizlet ────────────────────────────────────────────────►
                              Khanmigo ───────────────────►
                              Coursera ───────────────────►

AI DEPTH:
           Static ◄─────────────────────────────────► Adaptive AI
                                 Udemy
                        Teachable/Thinkific
                                         Duolingo
                                                  Growtrics
                                                  Synthesis
                                                          [BeQuizzy]

CREATOR ECONOMY:
           None ◄─────────────────────────────────► Full
Duolingo/Khan ─►
                    Udemy/Coursera ─────────────────►
                              Teachable/Thinkific ──────►
                                                   Maven ──►
                                                         [BeQuizzy + AI Avatar]
```

**BeQuizzy's unique intersection:** Broadest subject coverage + Adaptive AI Tutor + Human Tutor Marketplace + AI Avatar Creator Economy — all in one platform.

---

## 5. Features

Every feature in BeQuizzy serves one of four strategic purposes. Understanding this framework drives every product decision:

| Role | Symbol | Purpose | Plan Availability |
|---|---|---|---|
| **Core** | 🔑 | The reason users come. Without these, there is no product. Give away generously to maximize reach. | Free (limited) |
| **Moat** | ⚔️ | No competitor has this. Hard to copy. BeQuizzy's long-term defensibility. | Free preview → Pro full access |
| **Monetize** | 💰 | Creates the "I need to upgrade" moment. Visible from Free but gated. | Paid plans only |
| **Retain** | 🔒 | Leaving BeQuizzy becomes painful. Switching cost, habit formation, accumulated value. | All plans — builds over time |

### Feature Strategy Map

| Feature | 🔑 | ⚔️ | 💰 | 🔒 | Free | Pro | Tutor Pro | Academy |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Interactive Simulation Engine (Chemistry, Physics, Biology, Math) | ✓ | ✓ | | | Limited | Full | ✓ | ✓ |
| Scientific Discoveries Lab | | ✓ | | | 3 scenarios | All | ✓ | ✓ |
| Reflex Training Arena (5 types) | | ✓ | | ✓ | 2 types | All 5 | ✓ | ✓ |
| AI Personal Tutor (conversational) | ✓ | | | | 5/month | Unlimited | ✓ | ✓ |
| Adaptive Learning Path | ✓ | | ✓ | ✓ | Basic | Full | ✓ | ✓ |
| Spaced Repetition Engine | ✓ | | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Learning Record (full history) | ✓ | | | ✓ | 30 days | Unlimited | ✓ | ✓ |
| Streak & Gamification System | ✓ | | | ✓ | ✓ | Enhanced | ✓ | ✓ |
| Human Tutor Marketplace | ✓ | | | | ✓ | ✓ | ✓ | ✓ |
| Virtual Classroom (1:1) | ✓ | | | | ✓ | ✓ | ✓ | ✓ |
| Parent Dashboard | | | ✓ | ✓ | Basic | Full weekly reports | ✓ | ✓ |
| Exam Prep Mode (IELTS/SAT/GMAT/GRE) | | | ✓ | | Preview | Full | ✓ | ✓ |
| Language Conversation Mode + Pronunciation AI | | ✓ | ✓ | | ✗ | ✓ | ✓ | ✓ |
| Progress Analytics & Mastery Heatmap | | | ✓ | ✓ | Basic | Full | ✓ | ✓ |
| Typing & Morse Code Trainer | ✓ | | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Extended Simulations (Music, Astronomy, Life Skills, Arts) | | ✓ | ✓ | | ✗ | ✓ | ✓ | ✓ |
| Group Class Management | | | ✓ | | ✗ | ✗ | ✓ | ✓ |
| Homework & Assignment Manager | | | ✓ | | ✗ | ✗ | ✓ | ✓ |
| Tutor Class Recording + AI Summary | | | ✓ | | ✗ | ✗ | ✓ | ✓ |
| AI Avatar Creator Studio | | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| AI Avatar Marketplace (purchase) | | ✓ | ✓ | ✓ | Preview | Per license | Per license | ✓ |
| Reflex Rank Progression (Apprentice → Legendary) | | ✓ | | ✓ | 2 types | All 5 | ✓ | ✓ |
| Peer Learning Groups | | | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| Certificate & Credential Engine | | | ✓ | | ✗ | ✓ | ✓ | ✓ |
| White-Label Portal | | | ✓ | | ✗ | ✗ | ✗ | Custom |
| Corporate Language Training (B2B) | | | ✓ | | ✗ | ✗ | ✗ | Custom |
| API & Integrations (Google Classroom, Zapier) | | | ✓ | | ✗ | ✗ | ✗ | ✓ |

---

### 5.1 — 🔑 Core Features: Why Users Come

> These define what BeQuizzy *is*. Available on the Free plan to maximize reach and acquisition. Every user must experience these to understand the product's value.

#### Interactive Simulation Engine

| Feature | What It Does | Why It's Core |
|---|---|---|
| **Chemistry Lab** | Canvas-animated lab bench; 200+ substances with real color/state/hazard; mix → reaction animation + balanced equation; Mystery Compound + Synthesis Challenge game modes | Most memorable science learning possible — learners remember what they *did*, not what they read |
| **Physics Sandbox** | Gravity & motion, circuit builder (electrons animated), wave visualizer, optics with light rays, Rube Goldberg builder | Abstract physics concepts made tangible and playful |
| **Biology Lab** | Zoomable cell anatomy, virtual dissection, DNA builder, ecosystem simulator | Replaces rote memorization with spatial exploration |
| **Math Visualization** | 3D geometry sculptor, function grapher with real-world context, probability sandbox, fraction kitchen | Destroys math anxiety by making numbers visible and manipulable |
| **Language Immersion Scenes** | Learner placed in real-world scenes (market, café, airport); AI characters respond in target language | Language learned in context, not in a vacuum |
| **Typing & Morse Code Trainer** | Animated hand overlay, WPM tracking, Morse decoder, Vietnamese Telex/VNI | Universal foundational skill; low friction first engagement |

#### AI Personal Tutor (Free: 5 sessions/month)

| Feature | What It Does | Why It's Core |
|---|---|---|
| **Conversational AI Tutor** | Socratic method — asks questions, guides thinking, never just gives answers; voice + text input | Replaces the "answer machine" with a real thinking partner |
| **Subject Breadth** | Math, Science (Physics, Chemistry, Biology), English, Chinese, Vietnamese at launch | Broad enough to be the single app for a student's entire school life |
| **Session Progress Summary** | After each session: what was covered, mastered, and needs review | Closes the loop — learner always knows where they stand |
| **Safe Content Mode** | COPPA-compliant content filtering for under-13 | Non-negotiable for family trust and parent adoption |

#### Human Tutor Marketplace

| Feature | What It Does | Why It's Core |
|---|---|---|
| **Tutor Profile & Matching** | Filter by subject, language, price, availability, teaching style | Demand-side value proposition for the marketplace to function |
| **1:1 Booking System** | Instant booking or tutor-approval flow; calendar sync | Without easy booking, the marketplace doesn't convert |
| **Virtual Classroom** | Video call, screen share, interactive whiteboard embedded | Session must happen *inside* BeQuizzy — not Zoom — to capture session data and build the learning record |
| **Tutor Wallet & Payout** | Weekly payouts; MoMo, VNPay, payOS, Stripe | Supply side (tutors) won't join if payment is unreliable |

#### Core Platform

| Feature | What It Does | Why It's Core |
|---|---|---|
| **Learner Profile** | Age, goals, subjects, language of instruction | Personalizes the entire AI experience from day one |
| **Spaced Repetition Engine** | Resurfaces concepts at optimal forgetting-curve intervals | Learning without this is a leaking bucket |
| **Mobile-First App** | iOS + Android + PWA; offline content review | 90%+ of SEA users are mobile-primary |
| **Multi-language UI** | Vietnamese + English at launch; expandable | Vietnam-first strategy requires native Vietnamese |

---

### 5.2 — ⚔️ Competitive Moat: Why BeQuizzy Wins

> Features that no existing competitor has combined in one platform. These take significant engineering effort and accumulated data to replicate. They are BeQuizzy's long-term defensibility.

#### Why these are hard to copy

| Moat Feature | Why Competitors Can't Easily Replicate |
|---|---|
| **Interactive Simulation Engine** (full breadth) | Chemistry + Physics + Biology + Math + Language + Music + Reflex all as live simulations requires enormous engineering investment. Competitors (Duolingo, Khan Academy, Synthesis) each have 1–2 simulations. BeQuizzy will have 20+. |
| **Scientific Discoveries Lab** | Requires curation of primary-source papers + interactive experiment design per discovery. Not a template — each scenario is hand-crafted. Grows into a library that compounds as a moat. |
| **Reflex Training Arena** | Nobody else pairs cognitive reflex training (visual/auditory/hand/verbal/cognitive) with academic subject learning. The cross-skill insight (ear training → tonal language fluency) is a unique positioning. |
| **AI Avatar Creator Studio** | Network effect: more tutors create avatars → richer marketplace → more learner demand → more tutors want to join. First mover in edu-specific AI avatar market. The tutor's training data stays on BeQuizzy — they lose it if they leave. |
| **Language Conversation Mode + Pronunciation AI** | Real-time phoneme-level pronunciation feedback requires specialized ASR models trained per language. Competitors (Duolingo) have this for a few languages. BeQuizzy targets SEA languages (Vietnamese, Thai, Bahasa, Tagalog) that others ignore. |

#### Moat Feature Details

| Feature | Access | Notes |
|---|---|---|
| **Scientific Discoveries Lab** | Free: 3 scenarios · Pro: all 12+ | Re-live Newton, Curie, Darwin, Watson-Crick, Hubble, Tesla + more; hypothesis-first; linked to original papers/patents |
| **Reflex Training Arena** | Free: 2 types · Pro: all 5 | Visual, Auditory, Hand Speed, Verbal Speed, Cognitive; baseline benchmark; Apprentice → Legendary ranked system |
| **AI Avatar Creator Studio** | Academy plan only | Tutors upload content + record sessions → AI trains on their style → avatar listed in marketplace |
| **AI Avatar Marketplace** | Free preview · Purchase per license | Browse and preview any avatar; buy monthly or lifetime license; tutor earns 70% of revenue |
| **Language Conversation Mode** | Learner Pro | Immersive AI role-play scenes; real-time waveform pronunciation comparison; phoneme-level scoring |
| **Extended Simulations** | Learner Pro | Cosmology/astronomy, music studio (piano/guitar), creative arts feedback, life skills (budget/first aid/cooking), body language reader |
| **AI Music Tutor** | Learner Pro | AI listens via microphone; feedback on pitch, timing, posture; works with piano, guitar, drums |
| **Creative Arts Module** | Learner Pro | Upload artwork; AI structured feedback; drawing → graffiti → calligraphy progression |

---

### 5.3 — 💰 Monetization Features: Why Users Upgrade & Pay

> These features create the "upgrade moment" — the point where a Free user clearly sees they need to pay. Each is designed to be *visible* from the Free tier so the user feels the pull.

#### The 5 Upgrade Triggers

```
TRIGGER 1: AI Tutor session limit hit
  "You've used your 5 free AI sessions this month."
  → Upgrade to Learner Pro for unlimited sessions

TRIGGER 2: Exam deadline approaching
  Student has IELTS in 3 months; full prep track is locked
  → Upgrade to access structured IELTS prep with mock tests + AI feedback

TRIGGER 3: Parent wants full visibility
  Parent sees "Basic dashboard" and wants weekly report + mastery heatmap
  → Upgrade to unlock full Parent Dashboard

TRIGGER 4: Learning Record limit
  User has been on BeQuizzy 35 days; history beyond 30 days is greyed out
  → Upgrade to keep unlimited learning history

TRIGGER 5: Tutor wants group class
  Independent tutor has 6 students asking for a group class; feature is locked
  → Upgrade to Tutor Pro
```

#### Monetization Feature Details

| Feature | Plan | What Creates the Upgrade Pull |
|---|---|---|
| **Unlimited AI Tutor Sessions** | Learner Pro | Free users hit 5/month within 1–2 weeks of active use |
| **Adaptive Learning Path (Full)** | Learner Pro | Free shows "personalized roadmap exists but locked"; compelling preview |
| **Exam Prep Mode** | Learner Pro | Full IELTS/SAT/GMAT/GRE/TOEIC tracks with timed mock exams, practice sets, AI feedback on essay answers |
| **Parent Dashboard (Full)** | Learner Pro | Weekly learning report; mastery heatmaps per subject; predicted exam readiness score; email digest |
| **Progress Analytics & Heatmap** | Learner Pro | Visual mastery heatmap shows exactly which concepts are weak; learner clearly sees the value |
| **Extended Simulations** | Learner Pro | Music studio, astronomy, arts, life skills — Free shows locked previews with teaser content |
| **Peer Learning Groups** | Learner Pro | Social learning; opt-in class/school leaderboard; AI discussion facilitator |
| **Certificate & Credential Engine** | Learner Pro | Verifiable certificates for completed tracks; shareable to LinkedIn/CV |
| **Group Class Management** | Tutor Pro | Create cohorts 4–20 students; set per-seat pricing; live group classroom with BeQuizzy tools |
| **Homework & Assignment Manager** | Tutor Pro | Assign, auto-grade MCQ, manual grade open-ended; AI provides written feedback on submissions |
| **Tutor Class Recording** | Tutor Pro | Auto-records group sessions; AI generates highlighted summary; shared with students |
| **Session Analytics** | Tutor Pro | See which students are struggling, engagement heatmaps per student, dropout risk alerts |
| **AI Avatar Creator Studio** | Academy | Tutors package their knowledge into a scalable AI clone; passive income stream |
| **Center Management** | Academy | Multi-teacher workspace; attendance, billing, payroll, student rosters in one view |
| **White-Label Portal** | Enterprise | Schools deploy BeQuizzy under their own brand |
| **Corporate Language Training** | Enterprise | Companies purchase seats; team progress dashboards; manager oversight |
| **API & LMS Integrations** | Academy/Enterprise | Google Classroom, Zapier, Microsoft Teams Education, REST API |

---

### 5.4 — 🔒 Retention Mechanics: Why Users Stay

> These features make leaving BeQuizzy painful, expensive, or emotionally difficult. Switching cost is not built through lock-in tactics — it is built through genuine accumulated value that cannot be easily transferred.

#### The Switching Cost Stack

```
Day 1:    Learner joins → completes baseline reflex test → starts first simulation
Week 1:   AI has mapped learning style and weak spots → adaptive path begins
Month 1:  30+ sessions recorded → mastery heatmap filled in → streak established
Month 3:  Spaced repetition system knows exactly what to review next
           Reflex rank achieved (e.g., "Specialist" in Visual) → can't transfer rank
           Parent receives weekly reports → invested in the product
Month 6:  Full learning history → irreplaceable academic record
           AI Avatar purchased → active license being used
           Tutor relationship built → emotional attachment
Year 1+:  Accumulated learning record = personal educational portfolio
           Cannot recreate this history on any other platform
```

#### Retention Feature Details

| Feature | How It Retains | Switching Cost |
|---|---|---|
| **Spaced Repetition Engine** | AI schedules exactly the right review at the right moment; leaving means losing this calibration | Competitor AI starts from scratch; learner re-forgets everything already mastered |
| **Learning Record (Unlimited)** | Full history of every session, topic, score, and mastery level; visual timeline of learning journey | Irreplaceable academic record; cannot export to another platform in a meaningful way |
| **Reflex Rank System** | Ranked Apprentice → Legendary in 5 reflex types; rank earned through real benchmarked performance | Platform-specific rank; losing "Expert Visual Reflex" rank is genuinely felt |
| **Streak System** | Daily learning habit with visual streak counter + multipliers; social proof via friend comparison | Psychological sunk cost; Duolingo proved streak loss is the #1 churn trigger |
| **Gamification Progression** | Boss experiments unlocked; rare discovery badges earned; cosmetic avatar items collected | All earned cosmetics, badges, and unlocks are non-transferable |
| **Parent Dashboard (weekly reports)** | Parents build a mental model of their child's progress; cancelling feels like losing visibility | Parent's trust in the product becomes a family decision, not individual |
| **Adaptive Learning Path** | AI knows the learner's exact weak spots, learning pace, and preferred style after months of data | A new platform sees a stranger; BeQuizzy sees a 6-month relationship |
| **Tutor Relationship** | Learner has booked sessions with a specific tutor who knows their history | Emotional connection; tutor also has incentive to retain student for payout |
| **AI Avatar License** | Learner has paid for a tutor's AI avatar license; active subscription | Sunk cost + genuine daily usage; license is platform-bound |
| **Scientific Discoveries Progress** | 12+ discovery scenarios with completion status and earned badges | "I'm halfway to completing the Physics Discovery Set" = motivation to finish |
| **Learning Community** | Class leaderboard, peer study groups, friend streaks | Social accountability and FOMO |

---

### 5.5 — Gamification Design Principles

Gamification in BeQuizzy is not surface-level (badges for logging in). It mirrors real-world achievement and mastery progression. Every mechanic must answer: *"Does this reflect genuine learning, or just time spent?"*

| Layer | Mechanic | Real-World Analogy |
|---|---|---|
| **XP & Levels** | Earn XP from simulation interactions, correct answers, session completion; level up per subject | Karate belt ranks — earned through real ability, not attendance |
| **Streak System** | Daily streaks with multipliers; broken streak = lose bonus not progress | Sports training — consistency compounds over months |
| **Mastery Stars** | Each topic: Attempted → Understood → Mastered (proven by spaced repetition recall, not self-report) | School grades but earned through demonstrated recall |
| **Rare Experiment Unlocks** | Simulations locked until prerequisite mastered (nuclear fission requires atomic structure first) | Game zone unlocks after defeating the boss |
| **Reflex Ranks** | Apprentice → Journeyman → Specialist → Expert → Elite → Legendary; rank = actual benchmark performance | Esports ranked tiers (Bronze → Diamond) — performance-based |
| **Discovery Badges** | Complete a re-enacted historical experiment → earn scientist's badge ("Curie's Radioactivity") | Professional certifications as milestones |
| **Challenge Mode** | Timed versions of any simulation; race personal best or friends' ghost scores | Speedrunning — same content, new meta-game |
| **Leaderboards** | Opt-in class/school/global per subject and reflex type | Sports ranking tables — visible, aspirational |
| **Cosmetic Rewards** | Avatar items, lab coat colors, instrument skins — zero pay-to-win; earned only through learning | Game cosmetics as social status among peers |
| **Boss Experiments** | End-of-unit culminating challenge: design a molecule, balance a circuit, compose a melody | Final exam reframed as a boss battle — high stakes, satisfying completion |

---

### 5.6 — Out of Scope

| Not Built | Reason |
|---|---|
| **Physical merchandise / textbooks** | BeQuizzy is a digital platform; physical goods are out of scope |
| **Full LMS for universities** | Enterprise LMS (Moodle/Canvas replacement) is a different product with a different sales cycle |
| **Degree-granting programs** | Accreditation is a regulatory challenge outside the product scope |
| **Cold outreach / marketing automation for tutors** | Tutors get students through the BeQuizzy marketplace; we do not build sales CRM tools |
| **Social media platform** | BeQuizzy is a learning platform, not a social network; community features are scoped to learning contexts only |
| **Cryptocurrency / NFT credentials** | Blockchain credentials are premature for the target market |
| **AI-generated textbook publishing** | Out of scope for MVP; potential Phase 4 |

---

## 6. Foundation Infrastructure

Non-negotiable infrastructure features that underpin BeQuizzy as a multi-tenant, child-safe, global SaaS platform.

### Authentication & Identity

| Feature | Notes |
|---|---|
| Email/password + OAuth social login | Google, Apple, Facebook sign-in |
| Email verification + password reset | |
| Session management + silent refresh | |
| **2FA / MFA** | TOTP (Google Authenticator), backup codes, risk-based trigger on new device/location |
| Account lockout on failed attempts | Temporary block after N wrong attempts |
| Suspicious login alert | Notification when login from new device or country |
| **Parental consent flow** | For learners under 13: parent email verification required (COPPA / GDPR-K compliance) |
| **Child account management** | Parent account links to child sub-accounts; parent controls content access level |

### Multi-tenancy & Workspace

| Feature | Notes |
|---|---|
| Learner profile scoping | All learning data, sessions, and progress isolated per learner |
| Tutor workspace | Tutor has a private workspace: students, sessions, earnings, content library |
| Center workspace | Multi-teacher center has a shared admin view with per-teacher scoping |
| Workspace deletion + 30-day grace period | Full cascade delete of all workspace data |

### RBAC (Role-Based Access Control)

| Feature | Notes |
|---|---|
| Pre-defined roles | Learner / Parent / Tutor / Center Admin / Platform Admin |
| Permission enforcement per resource | Parent can see child data; tutor cannot see other tutor's data |
| **Audit log** | Every sensitive action logged: who, when, what (role changes, data exports, payout requests) |

### Billing & Subscriptions

| Feature | Notes |
|---|---|
| Plan management | Free / Learner Pro / Tutor Pro / Academy / Enterprise |
| Monthly + annual billing (20% discount annual) | |
| Upgrade / downgrade with proration | |
| Subscription lifecycle | trialing → active → past_due → cancelled |
| Failed payment retry + dunning emails | Automatic smart retries |
| Local payment methods | MoMo, VNPay, payOS (Vietnam); Stripe (global) |
| AI Avatar license purchases | One-time or subscription license purchase for individual AI avatars |
| Tutor payout system | Weekly automated payouts; tax documentation per country |
| **Trial period** | 7-day free trial on all paid plans |
| **Pause subscription** | Freeze billing, keep data, lock AI features |

### Invoicing

| Feature | Notes |
|---|---|
| Auto-generated invoices per billing cycle | PDF available for download |
| Invoice email delivery | Sent immediately after payment |
| Tax handling (VAT/GST) | Auto-calculated by geography |
| Credit notes for refunds | |
| **Billing info form** | Company name, address, Tax ID / MST for Vietnamese VAT invoices |

### Security & Child Safety

| Feature | Notes |
|---|---|
| Rate limiting | Per IP, per user, per endpoint |
| Content moderation | AI moderation on all user-generated content (tutor profiles, session notes, AI avatar training data) |
| **COPPA compliance** | No behavioral advertising to under-13; parental consent; data minimization |
| **Safe chat** | Real-time message scanning between tutors and students; escalation for flagged content |
| Session recording consent | Explicit consent required before recording any live session |
| Encryption at rest + in transit | |
| CSRF + XSS protection | |
| **Tutor background check integration** | Third-party identity + background verification for marketplace tutors |

### Data Privacy & Compliance

| Feature | Notes |
|---|---|
| GDPR data export | Full account ZIP on request |
| GDPR right to erasure | Cascade delete + 30-day grace |
| Consent logging | Per learner / parent |
| SEA compliance | PDPD (Vietnam), PDPA (Thailand/Singapore) |
| **COPPA (USA)** | Children's Online Privacy Protection Act for under-13 learners |
| Cookie consent banner | All public pages |
| **Notification preferences** | User controls which emails/push notifications they receive |

### User Account

| Feature | Notes |
|---|---|
| Display name + avatar / profile photo | |
| Password change | |
| **Email change** | With re-verification |
| **Account deletion** | Delete personal account; parent can delete child account |
| **Connected apps** | View + disconnect active OAuth connections |
| Learning preferences | Preferred language of instruction, subjects of interest, learning pace |

---

## 7. How It Works

### For Learners

```
SIGN UP (< 5 minutes)
  Choose role: Learner or Tutor
  → Learner: age, subjects of interest, learning goals
  → AI generates a personalized learning road map

LEARN WITH AI TUTOR
  Pick a subject or let AI recommend
  → Conversational AI session (text or voice)
  → Interactive tools embedded in session (simulations, whiteboards, quizzes)
  → Spaced repetition schedules follow-up sessions automatically

BOOK A HUMAN TUTOR
  Browse marketplace → filter by subject, price, availability
  → Book 1:1 or join a group class
  → Session in Virtual Classroom (video + whiteboard + tools)
  → AI summarizes session and assigns follow-up practice

ACCESS AI AVATARS (Phase 2)
  Browse AI Avatar Marketplace
  → Preview a tutor's AI avatar (3 free questions)
  → Purchase license → chat with tutor's AI clone any time

TRACK PROGRESS
  Learning Record: all sessions, mastery levels, streaks
  Weekly Report (learner + parent)
  Predicted exam readiness for standardized tests
```

### For Tutors

```
SIGN UP (< 10 minutes)
  Profile: subjects, experience, qualifications, video intro
  → Identity verification (background check for marketplace)
  → Set hourly rate, availability, age groups served

RECEIVE STUDENTS
  Students discover and book through marketplace
  → Session in BeQuizzy Virtual Classroom
  → Assign homework; AI auto-grades MCQ, flags for manual review

OPEN GROUP CLASSES
  Create class: name, subject, price per seat, schedule, max students
  → Students enroll → Live group sessions with interactive tools
  → Auto-record → AI summary → share with enrolled students

BUILD AI AVATAR (Phase 2)
  Upload teaching materials, record Q&A sessions, set teaching persona
  → AI trains on tutor's content and style
  → List AI avatar on marketplace → set license price
  → Earn passive income from AI avatar licenses
```

---

## 8. Geographic Expansion Strategy

BeQuizzy launches in Vietnam and expands in deliberate phases. Each market has distinct localization requirements, competitive dynamics, and user pain points.

### Phase 1 — Vietnam (2026–2027) 🇻🇳

**Why Vietnam first:**
- Founder's home market; deep cultural and linguistic context
- 97M population; ~20M school-age children; education is a top family priority
- Severe urban/rural education divide: top gia sư (private tutors) concentrate in Hà Nội and HCMC; rural families have no access
- Large, fragmented private tutoring market (individual gia sư, small trung tâm) with no unified platform
- Strong smartphone penetration; mobile-first behavior
- National exam pressure (THPT Quốc gia, university entrance) creates urgent demand for quality prep

**Vietnam-specific localization:**
| Area | Detail |
|---|---|
| Language | Vietnamese UI + content; all AI tutor responses in Vietnamese |
| Curriculum | Align with Bộ Giáo dục & Đào tạo (MOET) syllabus (lớp 1–12) |
| Input | Vietnamese Telex/VNI typing support throughout; diacritics in all text |
| Exams | THPT Quốc gia prep, university entrance (khối A/B/C/D), IELTS, TOEIC |
| Payment | MoMo, VNPay, payOS, ZaloPay; VAT invoice with MST (mã số thuế) |
| Tutor market | Onboard independent gia sư and small tutoring centers; Vietnamese |
| Cultural | Vietnamese history, literature (Nguyễn Du, Hồ Chí Minh era), geography |
| Family focus | Parent dashboard critical — Vietnamese parents are highly involved in education |

**Phase 1 North Star:** 100,000 Weekly Active Learners in Vietnam within 12 months of launch.

---

### Phase 2 — Southeast Asia (2027–2028) 🌏

**Markets:** Thailand 🇹🇭 · Indonesia 🇮🇩 · Philippines 🇵🇭 · Malaysia 🇲🇾 · Singapore 🇸🇬

**Shared regional pain points:**
- Urban/rural education divide in every SEA market (especially Indonesia — 17,000 islands)
- English fluency gap is a top concern for families across all SEA markets
- Private tutoring is expensive and geographically limited
- Rapid smartphone adoption; mobile-native learners
- Parents place extremely high value on education (pan-Asian cultural driver)

| Market | Focus | Local Specifics |
|---|---|---|
| **Indonesia** 🇮🇩 | Largest SEA market (277M people); rural access is the defining problem | Bahasa Indonesia UI; Kurikulum Merdeka alignment; GoPay, OVO payment; 34 provinces |
| **Philippines** 🇵🇭 | Strong English base; K-12 DepEd curriculum; OFW families value education for children left at home | Filipino (Tagalog) + English UI; GCash payment; overseas parent access feature |
| **Thailand** 🇹🇭 | Strong tutoring culture; competitive university entrance; tonal language = BeQuizzy auditory reflex advantage | Thai UI; PromptPay; PAT exam prep; Thai cultural immersion |
| **Malaysia** 🇲🇾 | Multilingual country (Malay, Chinese, Tamil, English); STEM emphasis | Bahasa Malaysia + English UI; FPX payment; SPM exam prep |
| **Singapore** 🇸🇬 | Most competitive; Growtrics.ai already present; premium market; PSLE pressure | English-first; MOE curriculum; compete on simulation depth and breadth vs. Growtrics |

**Phase 2 North Star:** 1M Weekly Active Learners across SEA by end of Phase 2.

---

### Phase 3 — Global (2028+) 🌍

**Target regions:** East Asia (Japan 🇯🇵, South Korea 🇰🇷) · South Asia (India 🇮🇳) · Western markets (USA 🇺🇸, UK 🇬🇧, Australia 🇦🇺, Europe)

**Competitive positioning at global scale:**

| Competitor | Their Strength | BeQuizzy's Answer |
|---|---|---|
| Duolingo | 40+ languages, 500M downloads, brand recognition | Simulation engine + human tutors + AI avatar — Duolingo is a vocabulary drill; BeQuizzy is a learning world |
| Synthesis Tutor | SpaceX origin story, excellent UX, math only | BeQuizzy covers 20x more subjects; same depth of simulation |
| Khan Academy / Khanmigo | Free, trusted, broad curriculum | BeQuizzy is interactive simulation — watching a video ≠ running an experiment |
| Preply / italki | 100k+ tutors, language-focused | BeQuizzy wraps human tutors inside a full platform with AI, tools, and avatar economy |
| Coursera / Udemy | Massive course libraries | Static video courses vs. BeQuizzy's living simulations and AI tutor |

**Global product requirements:**
- Full English-first product (already built from day 1)
- Localization pipeline: new language UI in < 4 weeks using AI translation + native review
- Regional curriculum tagging (Common Core USA, National Curriculum UK, CBSE India, MEXT Japan)
- International payment stack (Stripe global, Apple Pay, Google Pay)
- GDPR (EU), COPPA (USA), PDPA (Thailand/Singapore), compliance-by-design
- Global tutor onboarding in any timezone

**Phase 3 North Star:** 10M Weekly Active Learners globally; AI Avatar Marketplace with 10,000+ listed avatars.

---

### Expansion Readiness Checklist (per new market)

```
BEFORE LAUNCH IN A NEW MARKET:
  ✓ UI localized in local language (AI translation + native review)
  ✓ At least 3 local exam prep tracks available
  ✓ Local payment method integrated
  ✓ Local data privacy regulation compliance confirmed
  ✓ 50+ local tutors onboarded and verified
  ✓ Local curriculum tags mapped for core subjects
  ✓ Cultural content review (history, geography, cultural sensitivity)
  ✓ Local customer support channel (WhatsApp, Zalo, LINE per market)
```

---

## 9. Pricing

### Learner Plans

| Plan | Price (USD) | Price (VND) | Key Inclusions |
|---|---|---|---|
| **Free** | $0 | 0₫ | 5 AI tutor sessions/month · Basic progress tracking · Browse tutor marketplace |
| **Learner Pro** | $12/mo | 299,000₫/mo | Unlimited AI tutor sessions · All subjects · Spaced repetition · Parent dashboard · Exam prep tracks |
| **Learner Pro Annual** | $99/yr | 2,490,000₫/yr | All Learner Pro features · Save 31% |
| **Family Plan** | $25/mo | 599,000₫/mo | Up to 4 learner sub-accounts · All Learner Pro features |

### Tutor Plans

| Plan | Price (USD) | Price (VND) | Key Inclusions |
|---|---|---|---|
| **Tutor Starter** | $0 | 0₫ | List profile · Up to 5 active students · Basic scheduling · BeQuizzy takes 20% commission per session |
| **Tutor Pro** | $29/mo | 699,000₫/mo | Unlimited students · Group class management · Session recording · Homework tools · BeQuizzy takes 10% commission |
| **Academy** | $79/mo | 1,990,000₫/mo | All Tutor Pro features · AI Avatar Creator Studio · Avatar marketplace listing · Center management (up to 5 teachers) · 8% commission |
| **Center Enterprise** | Custom | Custom | Unlimited teachers · White-label portal · Priority support · API access · Custom commission rate |

### AI Avatar Licenses (Student-Facing)

| License Type | Price (USD) | Notes |
|---|---|---|
| **Single Avatar – Monthly** | $5–$30/mo | Varies by tutor; tutor sets price within platform limits |
| **Single Avatar – Lifetime** | $20–$150 one-time | Tutor option to offer lifetime access |
| **Avatar Bundle** | Custom | Coming Phase 3 — bundle multiple avatars at a discount |

> BeQuizzy takes 30% of AI Avatar license revenue; tutor earns 70%.

---

*This document is a living overview and will be updated as the product evolves.*
