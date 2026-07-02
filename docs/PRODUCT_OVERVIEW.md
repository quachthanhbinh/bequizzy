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
   - [Feature Strategy Map](#feature-strategy-map)
   - [5.1 — Core Features](#51----core-features-why-users-come)
   - [5.2 — Competitive Moat](#52----competitive-moat-why-bequizzy-wins)
   - [5.3 — Monetization Features](#53----monetization-features-why-users-upgrade--pay)
   - [5.4 — Retention Mechanics](#54----retention-mechanics-why-users-stay)
   - [5.5 — Gamification Design Principles](#55--gamification-design-principles)
   - [5.6 — Assessment & Testing Engine](#56----assessment--testing-engine)
   - [5.7 — Smart Learning Hub (Mini LMS)](#57----smart-learning-hub-mini-lms)
   - [5.8 — Out of Scope](#58--out-of-scope)
6. [Foundation Infrastructure](#6-foundation-infrastructure)
7. [How It Works](#7-how-it-works)
8. [Geographic Expansion Strategy](#8-geographic-expansion-strategy)
9. [Pricing](#9-pricing)

---

## 1. What Is BeQuizzy?

BeQuizzy is an **AI-powered interactive learning platform** for ages 5 to adult — because learning is a lifelong process.

It is simultaneously five things:

- **An Interactive Simulation Engine** — the heart of BeQuizzy. Every subject is rendered as an interactive, real-world simulation: chemistry experiments on a virtual lab bench, physics sandboxes, 3D geometry sculptors, live conversation scenes for languages, virtual instruments for music. Learning happens by **doing and discovering**, not reading.
- **An AI Personal Tutor** — an always-on, adaptive tutor that guides learners through simulations with Socratic questioning. The AI watches what the learner experiments with, identifies misconceptions, and steers discovery — covering STEM, languages, exam prep, life skills, arts, music, and beyond.
- **A Teaching Platform for Tutors** — BeQuizzy is the professional workspace where qualified teachers and domain experts run their solo teaching business. Conduct 1:1 and group classes inside a purpose-built virtual classroom. Manage students, build curriculum, assign and grade work, track progress — without stitching together Zoom, Google Sheets, and WhatsApp. BeQuizzy is the tool; tutors bring their students.
- **A Smart Learning Hub (Mini LMS)** — the connective tissue between learning and progress for both sides. For tutors: a full solo-business operating layer — curriculum planner, session calendar, grade book, parent communication, and student analytics. For learners: personal learning calendar, goal tracking, mastery heatmap, and self-organized **peer study groups** where learners collaborate, quiz each other, and hold each other accountable — no tutor required.
- **The BeQuizzy Marketplace** — tutors package their teaching expertise into structured **AI Knowledge Sets** (6-layer products: curriculum architecture → concept library → question bank → teaching logic → common mistakes → assessment framework) and publish them for sale. Learners license access to any tutor's AI — learning from their full methodology 24/7, without booking a session. This is BeQuizzy's primary commercial engine: **packaged teaching expertise**, not software.

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
| **Knowledge monetization for teachers** | A brilliant tutor in Đà Lạt can only teach students within driving distance | BeQuizzy Marketplace packages any expert’s knowledge as a licensable AI curriculum — reaching learners 24/7, not limited by geography |
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

### History & Social Studies Simulator

> **Learn history by living through its turning points — not by memorizing dates.**
> Every major event is an interactive decision tree: learners step into the shoes of key figures, face the real choices they faced, and see how different decisions change the outcome.

| Simulation | Detail |
|---|---|
| **Historical Timeline Explorer** | Interactive zoomable timeline of world and regional history; click any event to dive into causes, key figures, and global ripple effects; zoom from century view to day-of-event |
| **Decision Point Simulation** | Choose-your-own-path historical scenarios (e.g., "You are Hồ Chí Minh in 1945 — which alliance do you choose?"); see how different decisions alter history |
| **Comparative History Canvas** | Same event told simultaneously from multiple national perspectives (e.g., WWII from Vietnamese, Japanese, American, and French viewpoints); bias literacy training embedded |
| **Primary Source Analyzer** | AI presents original historical documents (proclamations, treaties, letters, propaganda posters); learner analyzes language, context, intent — AI guides with Socratic questions |
| **Historical Map Animator** | Borders and empires shifting over centuries on a real map canvas; learners trace how geography shaped political history |
| **Southeast Asian Civilizations Vault** | Deep-dive into Angkor, Majapahit, Đại Việt, Ayutthaya, Srivijaya — artifacts, architecture, customs, trade routes; often absent from Western-focused history curricula |

**Curriculum alignment:** Vietnam (Lịch sử lớp 6–12) · Indonesia (Sejarah) · Thailand (Social Studies: History strand) · Malaysia (Sejarah) · Philippines (Araling Panlipunan) · Singapore (History O/A-Level)

---

### Geography & Earth Sciences Explorer

> **See the Earth as a living, breathing system — not a list of capitals to memorize.**

| Simulation | Detail |
|---|---|
| **Interactive World Atlas** | Zoomable world map with 195 countries; click any for geography, climate, economy, culture, and population data rendered as visual infographics |
| **Plate Tectonics Simulator** | Animate continental drift over 500 million years; trigger earthquakes and volcanic eruptions in real time; build mountain ranges by colliding plates |
| **Weather & Climate Lab** | Model how latitude, altitude, ocean currents, and greenhouse gas concentration affect local and global climate; simulate +2°C and +4°C scenarios |
| **Natural Disaster Simulator** | Animate how earthquakes, tsunamis, typhoons, and floods develop from initial trigger to impact zone; explore disaster preparedness and early-warning systems |
| **Water Cycle & Ecosystems** | Trace a water molecule through the full hydrological cycle; model food webs; simulate the cascading effect of deforestation or dam construction |
| **Southeast Asia Focus** | Special module: Mekong River ecosystem and political tension, archipelago geology (Ring of Fire), monsoon patterns and agricultural impact, regional country profiles |

**Curriculum alignment:** Vietnam (Địa lý lớp 6–12) · Indonesia (Geografi, IPS) · Thailand (Social Studies: Geography strand) · Malaysia (Geografi) · Singapore (Geography O/A-Level)

---

### Literature & Language Arts Studio

> **Language comes alive when you experience its stories — not just its grammar rules.**

| Simulation | Detail |
|---|---|
| **Story World Visualizer** | Classic literary works rendered as navigable visual scenes; learner walks through the story world, meets characters, makes choices that reveal themes — comprehension through immersion |
| **Writing Workshop** | AI-guided essay and narrative writing with real-time structural feedback; identifies thesis clarity, paragraph coherence, argument strength; tracks improvement across drafts |
| **Poetry Decoder** | Read a poem; AI segments it into literary devices (metaphor, imagery, rhythm, allusion, irony); learner tags each device in the text with immediate feedback |
| **Rhetoric & Argument Lab** | Identify logical fallacies, rhetorical devices, and persuasion techniques in real speeches and historical texts; build critical reading skills |
| **Reading Comprehension Accelerator** | Adaptive reading passages scaled by Lexile level; speed-reading trainer with comprehension engine targeting higher-order thinking questions |
| **Vietnamese Literature Module** | Deep coverage of Vietnamese literary canon: Truyện Kiều (Nguyễn Du), Chinh Phụ Ngâm, modern prose, war poetry — cultural and historical context embedded in each work |
| **SEA Literature Gallery** | Representative works from Thai, Indonesian, Filipino, Malay, and Singaporean literature; comparative themes across cultures (identity, colonial legacy, nature) |

**Curriculum alignment:** Vietnam (Ngữ văn lớp 1–12) · Indonesia (Bahasa Indonesia) · Thailand (Thai Language) · Malaysia (Bahasa Melayu, Kesusasteraan Melayu) · Philippines (Filipino) · Singapore (English Language, Literature)

---

### Computer Science & Programming Lab

> **Code is the language of the future — every learner deserves to speak it.**

| Simulation | Detail |
|---|---|
| **Visual Block Coder** | Drag-and-drop block coding (Scratch-style) for ages 7+; build games, animations, and interactive stories; no syntax errors possible — pure logic training |
| **Python & JavaScript Sandbox** | In-browser live code editor with instant output; pre-built starter projects (calculator, quiz game, simple data visualizer); AI tutor explains errors in plain language |
| **Algorithm Visualizer** | Animate sorting (bubble, quicksort, merge sort) and search algorithms on live data arrays; learner controls speed and data set; compare time complexity visually |
| **Data Structures Explorer** | Interactive stacks, queues, linked lists, trees, and graphs; drag nodes, trace traversal paths, watch memory allocation update in real time |
| **Logic Gate Circuit** | Build AND/OR/NOT/XOR gate circuits; trace binary signals through layers; assemble a half-adder from scratch — understanding how computers compute at the hardware level |
| **AI & Machine Learning Primer** | Feed a visual dataset into a neural network; watch it learn in real time; tune learning rates and observe overfitting; pure intuition-building, no coding required |
| **Cybersecurity Escape Room** | Solve a series of puzzles involving password strength, phishing recognition, encryption basics (Caesar cipher → RSA concept), and safe online behavior |

**Curriculum alignment:** Vietnam (Tin học lớp 3–12) · Indonesia (Informatika) · Thailand (Technology strand) · Malaysia (Teknologi Maklumat dan Komunikasi, Sains Komputer) · Philippines (Computer) · Singapore (Computing O/A-Level)

---

### Economics & Financial Literacy Simulator

> **Understanding money and markets is among the most practical — and most neglected — subjects in school.**

| Simulation | Detail |
|---|---|
| **Supply & Demand Lab** | Drag sliders to shift supply, demand, price floors, and ceilings; watch equilibrium price and quantity adjust in real time; real-world scenarios (oil shock, rice harvest failure, pandemic disruption) |
| **Personal Finance Planner** | Given a starting income and random life events (job change, medical bill, wedding); make financial decisions over a simulated 10-year timeline; compound interest visualized as a growing bar |
| **Stock Market Simulator** | Paper-trade with historical market data; learn P/E ratios, dividends, market sentiment, and risk vs. return — zero real money, maximum learning |
| **Inflation & Monetary Policy** | Animate how central bank decisions (interest rates, quantitative easing) ripple through an economy; simulate hyperinflation (1920s Germany, Zimbabwe) and recession scenarios |
| **Entrepreneurship Sandbox** | Start a virtual micro-business; manage costs, pricing, marketing budget, and an AI competitor; survive 12 simulated months without going bankrupt |
| **Global Trade Explorer** | Simulate comparative advantage between two countries; track import/export flow changes; understand why countries trade and what happens when supply chains break |

**Curriculum alignment:** Vietnam (Kinh tế lớp 10–12, GDCD) · Indonesia (Ekonomi, IPS) · Thailand (Social Studies: Economics strand) · Malaysia (Ekonomi, Perdagangan) · Philippines (Economics, Business Math) · Singapore (Economics A-Level)

---

### Civics, Ethics & Social Values Studio

> **Citizens who understand how their society works are citizens who can change it for the better.**

| Simulation | Detail |
|---|---|
| **Government Structure Explorer** | Interactive visual of how different government types work (parliamentary democracy, presidential republic, constitutional monarchy); drill down from national to provincial to local level for Vietnam, Indonesia, Thailand, Malaysia, Philippines, Singapore |
| **Law & Justice Simulator** | Walk through a simplified legal case from complaint → investigation → trial → verdict; understand constitutional rights and civic responsibilities at each stage |
| **Voting & Electoral Systems** | Simulate the same election under first-past-the-post, proportional representation, and preferential voting; see how identical votes produce different outcomes — why system design matters |
| **Environmental Policy Maker** | Given a real SEA environmental crisis (Mekong dam, coral reef bleaching, Jakarta flooding); propose policies and see AI-simulated outcomes including economic, social, and ecological trade-offs |
| **Social Contract Explorer** | Understand foundational social theories (Hobbes, Locke, Rousseau, Confucian ethics, Buddhist social ethics) and how they shaped different societies' governance values today |
| **Ethics in the Modern World** | Scenario-based moral dilemmas (AI and privacy, social media and truth, climate and development); learner articulates and defends positions; AI presents counterarguments |

**Curriculum alignment:** Vietnam (GDCD / Giáo dục Kinh tế và Pháp luật lớp 1–12) · Indonesia (Pancasila dan Kewarganegaraan) · Thailand (Social Studies: Civics strand) · Malaysia (Pendidikan Moral, Pendidikan Islam) · Philippines (Edukasyon sa Pagpapakatao) · Singapore (Character & Citizenship Education)

---

### Visual Arts & Design Studio

> **Creativity is a cognitive skill. Art teaches you to observe the world with precision and express ideas without words.**

| Simulation | Detail |
|---|---|
| **Drawing Fundamentals Lab** | Step-by-step guided drawing exercises on a digital canvas; AI analyzes line quality, proportion, and perspective; gamified progression from basic geometric forms to complex portraits |
| **Color Theory Workshop** | Interactive color wheel; mix digital pigments; explore warm/cool, complementary, analogous, and triadic color schemes; apply directly to design challenges with AI critique |
| **Design Thinking Playground** | Given a real-world problem (e.g., "design a better school lunch container"); sketch → prototype → test cycle with AI feedback on functionality, aesthetics, and user needs |
| **Art History Gallery** | Walk through interactive virtual galleries organized by movement — Western (Impressionism, Cubism, Bauhaus) and Asian (Vietnamese Đông Hồ woodblock, Indonesian Batik, Thai mural painting, Chinese ink wash) |
| **Photography & Composition** | Frame a shot on a virtual scene canvas; AI grades composition (rule of thirds, leading lines, negative space, depth); understand how photographers and cinematographers direct the eye |
| **Calligraphy & Typography** | Practice Vietnamese calligraphy, Chinese brush stroke technique, Arabic script, and modern digital typography; AI scores stroke accuracy, proportion, and rhythm |

**Curriculum alignment:** Vietnam (Mỹ thuật lớp 1–9) · Indonesia (Seni Budaya) · Thailand (Art) · Malaysia (Pendidikan Seni Visual) · Philippines (MAPEH — Arts strand) · Singapore (Art O-Level)

---

### Health & Well-being Education *(knowledge-based, non-physical)*

> **Physical Education belongs on the field. Health knowledge belongs in every mind — and can be learned just as well online.**
> This module covers the non-physical, knowledge-based dimensions of health education: the science and psychology that transforms a person's everyday decisions.

| Simulation | Detail |
|---|---|
| **Nutrition Science Lab** | Build a day's meals on an interactive plate; AI calculates macros/micros and flags deficiencies; explore how vitamin deficiency, excess sugar, or iron shortage manifest as real symptoms |
| **Human Body Systems Atlas** | Explore all 11 body systems (circulatory, digestive, nervous, immune, endocrine, etc.) in a zoomable interactive 3D model; trace how systems interact under stress, illness, and recovery |
| **Disease & Immunity Simulator** | Animate how viruses and bacteria invade the body; watch the immune response (antibodies, T-cells, fever) play out in real time; simulate vaccine effect and herd immunity on a population graph |
| **Mental Health Literacy** | Scenario-based interactive stories depicting anxiety, depression, grief, and stress responses; learner identifies symptoms; AI explains coping strategies and when to seek help — reduces stigma through understanding |
| **Environmental Health** | Visualize how air quality, water contamination, noise pollution, and climate exposure affect human health outcomes; link to local SEA data (Hanoi AQI, Jakarta flooding, Manila heat index) |
| **Puberty & Adolescent Health** | Medically accurate, age-gated, culturally sensitive content on puberty, body changes, consent, and healthy relationships; delivered with per-market cultural review |

**Curriculum alignment:** Vietnam (Khoa học tự nhiên / Sinh học, GDTC-SK) · Indonesia (PJOK — health theory) · Thailand (Health & Physical Education — theory) · Malaysia (Pendidikan Kesihatan) · Philippines (MAPEH — Health strand) · Singapore (Health Education)

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
> Reflex training is backed by neuroscience: reaction time is a trainable cognitive skill, not fixed at birth. BeQuizzy's Reflex Arena trains **five distinct reflex types** — visual, auditory, hand speed, verbal speed, and cognitive — each with games calibrated to benchmark averages and adaptive difficulty.

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
| **Tutor-to-Student Connection Rate** | Teaching platform adoption — % of learners who successfully find and connect with a human tutor; and % of tutors who actively use BeQuizzy as their primary teaching workspace |
| **AI Knowledge Set Licenses Purchased** | Monetization signal — validates the AI Knowledge Studio marketplace model |
| **Monthly Recurring Revenue (MRR)** | Business health |

---

## 4. Competitive Landscape

### Direct AI Tutoring Platforms

| Product | Focus | Target Age | Pricing | Weakness vs. BeQuizzy |
|---|---|---|---|---|
| **Growtrics.ai** | Math & Science (Singapore curriculum) | K-12 | ~$15–20/mo | Narrow subject scope (Math+Science only); Singapore-focused; no live tutoring platform; no creator economy layer |
| **Synthesis Tutor** | K-5 Math only | 5–11 | $29/mo or $119/yr | Extremely narrow (Math only); no adult learning; no marketplace; no language support |
| **Photomath** | Math problem scanning & solving | 10–25 | Free / $69.99/yr | Passive answer-giving, not active tutoring; no other subjects; no human connection |
| **Khanmigo (Khan Academy)** | Broad K-12 curriculum, AI assistant | 5–18 | Free / ~$4/mo | No live tutoring platform; no AI Knowledge Studio; limited adult use cases; no monetization for teachers |
| **Quizlet** | Flashcard-based study & test prep | 10–25 | Free / Plus | Tool-based, not a tutor; no live instruction; no teacher monetization |
| **Brainly** | Homework help Q&A community | 10–20 | Free / Plus | Community answers, not personalized; no AI tutor; no live tutoring platform |

### 1:1 Tutoring Marketplaces

| Product | Focus | Scale | Pricing | Weakness vs. BeQuizzy |
|---|---|---|---|---|
| **Preply** | Languages + corporate training | 100,000+ tutors | Per lesson ($8–$80+/hr) | Language-only; no AI tutor as fallback; no AI Knowledge Studio; no interactive learning tools |
| **italki** | 150+ languages | 20,000+ teachers | Per lesson ($8+/hr) | Language-only; community-driven content but no AI tutoring; no AI Knowledge Studio |
| **Wyzant** | Multi-subject K-12 + test prep | Large US-focused | Per lesson ($35–$100+/hr) | No AI; US-only; no creator economy; expensive for SEA market |
| **Superprof** | Multi-subject global | Millions of tutors | Per lesson | No AI; platform is a directory, not a true learning environment |

### Course Creation & Knowledge Monetization Platforms

| Product | Focus | Scale | Pricing | Weakness vs. BeQuizzy |
|---|---|---|---|---|
| **Teachable** | Online course creation & coaching | 150,000+ schools | $0–$299/mo | Self-directed video courses only; no AI tutor; no live adaptive learning; no AI Knowledge Studio |
| **Thinkific** | Online course + community | 35,000+ businesses | Free–$149/mo | Asynchronous content; no AI tutoring interaction; no student-facing adaptive AI |
| **Maven** | Cohort-based expert courses | Large | Revenue share | Focused on professionals; high ticket; no kids/school learning; no AI Knowledge Studio |
| **Udemy** | Course marketplace | 62M+ students | Revenue share | One-size-fits-all courses; no personalization; no adaptive AI tutor; no 1:1 human connection |
| **Coursera** | University/professional certificates | Large | $399+/yr | Adult professionals only; no AI tutor interaction; no AI Knowledge Studio; no K-12 |

### Language Learning Platforms

| Product | Approach | Languages | Pricing | Weakness vs. BeQuizzy |
|---|---|---|---|---|
| **Duolingo** | Gamified self-study | 40+ languages | Free / $7/mo | Language-only; gamification ≠ real conversational fluency; no human tutor; no creator economy |
| **Babbel** | Structured lessons | 14 languages | ~$7/mo | Language-only; no AI tutor; no live tutoring platform; limited interactivity |
| **Busuu** | Lessons + native speaker feedback | 12 languages | ~$10/mo | Language-only; feedback is community-based; no AI Knowledge Studio |

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
                                                         [BeQuizzy + AI Knowledge Studio]
```

**BeQuizzy's unique intersection:** Broadest subject coverage + Adaptive AI Tutor (Agentic RAG) + Teaching Platform for Tutors + BeQuizzy Marketplace (AI Knowledge economy) — all in one platform.

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
| Interactive Simulation Engine — Sciences (Chemistry, Physics, Biology) | ✓ | ✓ | | | Limited | Full | ✓ | ✓ |
| Interactive Simulation Engine — Math & Programming | ✓ | ✓ | | | Limited | Full | ✓ | ✓ |
| Interactive Simulation Engine — Humanities (History, Geography, Civics, Literature) | ✓ | ✓ | | | Limited | Full | ✓ | ✓ |
| Interactive Simulation Engine — Arts, Health, Economics | | ✓ | ✓ | | ✗ | ✓ | ✓ | ✓ |
| Scientific Discoveries Lab | | ✓ | | | 3 scenarios | All | ✓ | ✓ |
| Reflex Training Arena (5 types) | | ✓ | | ✓ | 2 types | All 5 | ✓ | ✓ |
| AI Personal Tutor (conversational) | ✓ | | | | 5/month | Unlimited | ✓ | ✓ |
| Adaptive Learning Path | ✓ | | ✓ | ✓ | Basic | Full | ✓ | ✓ |
| Spaced Repetition Engine | ✓ | | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Learning Record (full history) | ✓ | | | ✓ | 30 days | Unlimited | ✓ | ✓ |
| Streak & Gamification System | ✓ | | | ✓ | ✓ | Enhanced | ✓ | ✓ |
| Tutor Teaching Platform (workspace, scheduling, virtual classroom) | ✓ | | | | ✓ | ✓ | ✓ | ✓ |
| Parent Dashboard | | | ✓ | ✓ | Basic | Full weekly reports | ✓ | ✓ |
| Exam Prep Mode (IELTS/SAT/GMAT/GRE) | | | ✓ | | Preview | Full | ✓ | ✓ |
| Language Conversation Mode + Pronunciation AI | | ✓ | ✓ | | ✗ | ✓ | ✓ | ✓ |
| Progress Analytics & Mastery Heatmap | | | ✓ | ✓ | Basic | Full | ✓ | ✓ |
| Typing & Morse Code Trainer | ✓ | | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Extended Simulations (Music, Astronomy, Life Skills, Arts) | | ✓ | ✓ | | ✗ | ✓ | ✓ | ✓ |
| Group Class Management | | | ✓ | | ✗ | ✗ | ✓ | ✓ |
| Homework & Assignment Manager | | | ✓ | | ✗ | ✗ | ✓ | ✓ |
| Tutor Class Recording + AI Summary | | | ✓ | | ✗ | ✗ | ✓ | ✓ |
| AI Knowledge Studio (build AI Knowledge Set) | | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| AI Knowledge Marketplace (purchase access) | | ✓ | ✓ | ✓ | Preview | Per license | Per license | ✓ |
| Reflex Rank Progression (Apprentice → Legendary) | | ✓ | | ✓ | 2 types | All 5 | ✓ | ✓ |
| Peer Learning Groups | | | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| Certificate & Credential Engine | | | ✓ | | ✗ | ✓ | ✓ | ✓ |
| White-Label Portal | | | ✓ | | ✗ | ✗ | ✗ | Custom |
| Corporate Language Training (B2B) | | | ✓ | | ✗ | ✗ | ✗ | Custom |
| API & Integrations (Google Classroom, Zapier) | | | ✓ | | ✗ | ✗ | ✗ | ✓ |
| **Assessment Engine** — 14 question types (MCQ, essay, code, audio, hotspot…) | ✓ | | | | Basic (3 types) | All 14 types | ✓ | ✓ |
| **Assessment Engine** — Code Execution Sandbox (25+ languages) | | ✓ | ✓ | | ✗ | ✓ | ✓ | ✓ |
| **Assessment Engine** — AI Essay & Audio Grader | | ✓ | ✓ | | ✗ | ✓ | ✓ | ✓ |
| **Assessment Engine** — Anti-Cheat & Proctoring | | ✓ | ✓ | | Basic | Standard | Full | Full |
| **Assessment Engine** — Item Analytics & Mastery Detection | | | ✓ | ✓ | ✗ | Basic | Full | Full |
| **Assessment Engine** — Verifiable Certification | | | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| **Smart Schedule** — Learner Calendar & Daily Plan | ✓ | | | ✓ | Basic | Full | ✓ | ✓ |
| **Smart Schedule** — Goal Wizard & Mastery Map | | | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| **Smart Schedule** — Tutor Curriculum Planner | | | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| **Smart Schedule** — Grade Book & Progress Alerts | | | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| **Smart Schedule** — Q&A Discussion Board | ✓ | | | ✓ | ✗ | ✓ | ✓ | ✓ |
| **Smart Schedule** — iCal / Google Calendar Sync | ✓ | | | ✓ | ✗ | ✓ | ✓ | ✓ |

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

#### AI Personal Tutor — Dynamic Agentic RAG Architecture

> **BeQuizzy không học về "doanh nghiệp/SME" của người dùng như một sales AI. BeQuizzy học về từng learner — thông qua từng hành vi học — để chọn đúng cách giải thích phù hợp nhất cho người đó, ở chủ đề đó, lúc đó. Và quan trọng hơn tất cả: đảm bảo kiến thức được nhớ lâu, không phải chỉ hiểu một lần rồi quên.**

**Free: 5 sessions/month → Pro: Unlimited**

---

##### Triết lý thiết kế: 3 tầng cốt lõi

```
Tầng 1 — HIỂU LEARNER:
  Không dựa vào profile tĩnh.
  AI quan sát hành vi học liên tục → xây dựng mô hình động về learner.
  "Learner này hiểu tốt nhất khi dùng ví dụ thực tế trước rồi mới trừu tượng hóa."
  "Learner này hay nhầm lẫn giữa điện thế và cường độ dòng điện vì lý do cụ thể X."

Tầng 2 — CHỌN CÁCH GIẢI THÍCH:
  Mỗi khái niệm có 6–8 cách giải thích khác nhau (phong cách, độ sâu, ngôn ngữ).
  AI chọn variant dựa trên Learner Model: cái gì đã hiệu quả trước đây?
  Nếu variant đầu không hiệu quả → thử variant khác ngay trong session.

Tầng 3 — ĐẢM BẢO NHỚ LÂU:
  Hiểu một lần ≠ nhớ lâu. Đây là vấn đề lớn nhất trong giáo dục.
  Retention System chủ động kéo kiến thức ra khỏi trí nhớ đúng lúc quên.
  "Bạn học phản ứng axit-bazơ 8 ngày trước — thử nhớ lại trước khi đọc lại nhé."
```

---

##### System Architecture

```
Learner input (text / voice / simulation action / quiz answer)
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│           Supervisor / Planner Layer (LangGraph)          │
│  • Intent: EXPLAIN / QUESTION / PRACTICE /               │
│            ASSESS / GUIDE / MOTIVATE /                   │
│            PATH / EXAM_PREP / RECALL_TRIGGER             │
│  • Subject & topic detection                              │
│  • Learner state detection:                               │
│    (struggling / confident / bored /                     │
│     time-pressured / exam-approaching /                  │
│     forgetting-curve-due)                                │
│  • Selects explanation variant from Learner Model        │
│  • Routes to appropriate Sub-Agent(s)                    │
└────────────────────────┬─────────────────────────────────┘
                         │ parallel retrieval
         ┌───────────────┴────────────────┐
         ▼                                ▼
  Curriculum Tools                 Learner Model Tools
  (subject knowledge)              (this specific learner)
  • subject_curriculum             • learner_model
  • concept_library                  (dynamic behavioral model)
    [6–8 variants per concept]     • explanation_log
  • misconception_handler            (which variants worked)
  • exam_playbook                  • session_history
  • discovery_scenarios            • mastery_map
  • knowledge_set                  • retention_map
    [if license purchased]           (decay curves per topic)
                                   • spaced_repetition_queue
                                   • assignment_context
                                   • simulation_state
         │                                │
         └───────────────┬────────────────┘
                         ▼
               Action Sub-Agents
  (each runs Draft → Self-Critique → Revise loop)
  • ExplainerAgent          — selects + delivers explanation variant
  • SocraticQuestionerAgent — asks the question that triggers discovery
  • PracticeGeneratorAgent  — generates problems with progressive hints
  • FeedbackAgent           — diagnoses root misconception, not just "wrong"
  • PathAdvisorAgent        — next-step recommendation based on mastery map
  • SimulationGuideAgent    — narrates simulation actions in real time
  • ExamCoachAgent          — IELTS/SAT/THPT strategy + timed mock feedback
  • RecallAgent             — generates retrieval prompts at optimal intervals
                         │
                         ▼
            ┌────────────────────────┐
            │    Pedagogy Gate       │
            │  (independent judge)   │
            │  • Curriculum aligned? │
            │  • Factually correct?  │
            │  • Socratic integrity? │
            │    (not giving answers │
            │     too directly)      │
            │  • Right difficulty?   │
            │  • Age-appropriate?    │
            │  • COPPA compliant?    │
            └────────────┬───────────┘
                         │
               Pass → Return to learner
               Fail → Retry (up to 3×)
               Fail 3× → Best attempt + flag for tutor review

── BACKGROUND PROCESSES (always running) ──────────────────
  Learner Model Builder  — updates learner_model after every interaction
  Retention Scheduler    — queues recall prompts at forgetting-curve peaks
  Mastery Tracker        — updates mastery_map as evidence accumulates
───────────────────────────────────────────────────────────
```

---

##### Tầng 1 — Learner Model: Hiểu Learner Qua Hành Vi

> Không phải bảng câu hỏi điền form. BeQuizzy quan sát những gì learner làm và xây dựng mô hình động từ hành vi thực.

| Signal quan sát | Ý nghĩa với AI |
|---|---|
| **Đường đi trong simulation** | Learner thử gì trước? Họ thoát ra ở bước nào? Điểm dừng = điểm khó |
| **Câu trả lời sai cụ thể** | Không chỉ "sai" mà "sai theo cách nào" — chọn đáp án B thay vì C cho thấy nhầm lẫn cụ thể gì |
| **Thời gian trên từng khái niệm** | Đọc nhanh = tự tin hoặc bỏ qua; đọc lại nhiều lần = đang cố hiểu |
| **Từ nào họ hỏi nghĩa** | Từ vựng nào còn thiếu — giúp AI điều chỉnh ngôn ngữ giải thích |
| **Hiệu quả của từng explanation variant** | Sau khi dùng cách giải thích "ví dụ thực tế" → learner trả lời đúng ngay lần sau? |
| **Tốc độ phản hồi trong Reflex Arena** | Working memory capacity — ảnh hưởng đến lượng thông tin AI đưa mỗi lần |
| **Pattern code-switching ngôn ngữ** | Khi nào learner tự nhiên chuyển sang tiếng Anh? Khi nào tiếng Việt thoải mái hơn? |
| **Tham gia peer group** | Câu hỏi trong group = điểm yếu thực sự; câu trả lời trong group = điểm mạnh cần consolidate |

Kết quả: sau ~10 sessions, AI có model đủ cụ thể để nói: *"Learner này hiểu tốt nhất qua analogies với thứ gì đó hữu hình, cần ví dụ cụ thể trước rồi mới trừu tượng, hay nhầm lẫn về chiều dòng điện, làm tốt nhất lúc 8–10 tối, tiếng Việt mặc định trừ khi hỏi về thuật ngữ kỹ thuật."*

---

##### Tầng 2 — Explanation Engine: Đúng Cách Giải Thích Cho Đúng Người

> Mỗi khái niệm không có một cách giải thích. Mỗi khái niệm có nhiều cách — AI chọn cái phù hợp nhất với learner này, lúc này.

**6 loại explanation variant trong concept_library:**

| Variant | Mô tả | Phù hợp với learner |
|---|---|---|
| **Analogy** | So sánh với thứ learner đã biết ("Điện thế giống như áp lực nước trong ống") | Người học thiên về liên tưởng; học tốt qua so sánh |
| **Story / Narrative** | Nhúng khái niệm vào câu chuyện thực tế có nhân vật và context | Trẻ nhỏ; người học thiên về ngữ cảnh; tất cả khi muốn tạo ký ức cảm xúc |
| **Step-by-step procedural** | Hướng dẫn từng bước làm gì, không giải thích tại sao trước | Người cần kết quả nhanh; học sinh cần làm bài thi trước, hiểu sâu sau |
| **First principles** | Xây từ nền tảng ("Tại sao 2+2=4? Vì số là ký hiệu đại diện cho lượng...") | Learner muốn hiểu sâu gốc rễ; người học triết học, toán, lý |
| **Concrete → Abstract** | Ví dụ thực tế rõ ràng trước → rút ra quy tắc chung sau | Học sinh cụ thể hóa tốt hơn trừu tượng hóa trực tiếp |
| **Visual description** | Mô tả bức tranh/sơ đồ bằng lời (hoặc chỉ vào simulation) | Learner có spatial/visual thinking mạnh |

**Quy trình chọn variant:**

```
Bước 1: Tra cứu explanation_log — variant nào đã thử? Kết quả thế nào?
Bước 2: Tra learner_model — learning style ưu thế là gì?
Bước 3: Xem xét topic — chủ đề này phù hợp với variant nào nhất?
Bước 4: Chọn variant cao điểm nhất → ExplainerAgent soạn
Bước 5: Nếu learner không hiểu sau lần đầu → thử variant khác ngay trong session
Bước 6: Ghi lại hiệu quả vào explanation_log để lần sau dùng lại
```

---

##### Tầng 3 — Long-Term Retention System (Quan Trọng Nhất)

> **Hiểu một lần ≠ nhớ lâu.** Đường cong quên lãng Ebbinghaus chỉ ra: không được nhắc lại đúng lúc, 80% kiến thức mới học biến mất trong 30 ngày. BeQuizzy giải quyết đây bằng một hệ thống retention chủ động.

**Nguyên lý khoa học:**

```
Forgetting Curve (Ebbinghaus):
  Sau 1 ngày:  mất ~40% nếu không ôn
  Sau 7 ngày:  mất ~65%
  Sau 30 ngày: mất ~80%
  
Spaced Repetition (giải pháp):
  Ôn lại đúng lúc SAP quên → đường cong dần phẳng hơn
  Lần 1 → ôn lại sau 1 ngày → lần 2 sau 3 ngày → lần 3 sau 7 ngày...
  Sau 5–6 lần ôn đúng chu kỳ: kiến thức vào long-term memory

Testing Effect (tăng cường hơn nữa):
  Chủ động recall (nhớ lại) > đọc lại (passive review) × 2–4 lần
  Ngay cả fail recall vẫn giúp nhớ lâu hơn đọc lại thụ động
```

**Cơ chế retention của BeQuizzy:**

| Cơ chế | Cách hoạt động | Khi nào kích hoạt |
|---|---|---|
| **Spaced Repetition Queue** | `retention_map` lưu lần cuối học + performance score per topic; `Retention Scheduler` tính thời điểm optimal để review | Background process, luôn chạy |
| **Retrieval-Before-Review** | Khi session mở ra một topic đã học: AI hỏi "Bạn nhớ gì về X không?" → đợi learner trả lời → rồi mới giải thích lại | Mỗi khi learner trở lại topic cũ |
| **Micro-Quiz Reminders** | Push notification tới app: "3 câu hỏi nhỏ về Định luật Ohm — 2 phút thôi" — xuất hiện đúng lúc forgetting curve đang dốc | 1 ngày / 3 ngày / 7 ngày sau khi học lần đầu |
| **Daily Review Card** | Mỗi sáng: card hiển thị 3–5 items due for recall từ `spaced_repetition_queue` — có thể trả lời ngay mà không cần mở full session | Mỗi ngày khi mở app |
| **Interleaved Practice** | Khi luyện tập chủ đề mới, AI xen kẽ câu hỏi từ các chủ đề đã học trước — không chỉ drill cùng một topic | Trong mọi practice session |
| **Elaborative Interrogation** | AI hỏi "Tại sao điều này đúng?" thay vì chỉ xác nhận đáp án — buộc learner kết nối khái niệm với kiến thức nền | Sau khi learner trả lời đúng |
| **Contextual Re-encountering** | Khi học topic mới có liên quan, AI tự nhiên dẫn về topic cũ: "Điều này nhắc bạn nhớ gì về phản ứng oxi hóa-khử không?" | Khi curriculum map phát hiện liên kết |
| **Simulation Recall Mode** | Mở lại một simulation đã làm trước đây, nhưng thêm biến mới — learner phải áp dụng kiến thức đã học vào tình huống khác | Trong review sessions |

**Retention Map — Lưu Trữ Tình Trạng Từng Khái Niệm:**

```
retention_map[topic] = {
  last_learned:      "2026-06-20",
  last_recalled:     "2026-06-23",
  recall_success_rate: 0.75,        // 3/4 lần recall thành công
  forgetting_curve_stage: 3,        // cần ôn lại sau 7 ngày
  next_review_due:   "2026-06-30",  // hôm nay!
  explanation_variant_used: "analogy",
  misconception_resolved: false     // còn nhầm về chiều dòng điện
}
```

**Progression từ Short-term → Long-term Memory:**

```
Lần 1 (học mới):      Hiểu trong session → vào working memory
Recall 1 (sau 1 ngày): Micro-quiz 2 phút → strengthen trace
Recall 2 (sau 3 ngày): Daily Review Card → reinforce
Recall 3 (sau 7 ngày): Interleaved question trong session mới → generalize
Recall 4 (sau 14 ngày): Simulation recall mode → apply to new context
Recall 5 (sau 30 ngày): Elaborative interrogation → connect to wider network
────────────────────────────────────────────────────────────
Kết quả: kiến thức vào long-term memory, khó quên ngay cả khi bỏ học 3 tháng
```

---

##### Sub-Agent Self-Critique Loop

Mỗi Sub-Agent chạy loop — không generate một lần và xong:

1. **Draft** — tạo response ban đầu từ context đã retrieve
2. **Self-Critique** — phù hợp với level learner? Đúng Socratic principles? Dùng đúng explanation variant không?
3. **Revise** — cải thiện dựa trên critique
4. **Emit với confidence score** (0–1)

Confidence < 0.7 → Pedagogy Gate reject → retry.

---

##### Core Capabilities

| Capability | Cách hoạt động | Tại sao quan trọng |
|---|---|---|
| **Socratic Questioning** | Không bao giờ cho đáp án thẳng; hỏi câu đúng để learner tự khám phá | Discovery-based retention: nhớ lâu hơn 2–4× so với được nói thẳng |
| **Adaptive Explanation** | 3 đúng liên tiếp → tăng độ khó; 2 sai liên tiếp → thử variant giải thích khác | Tránh boredom và tránh discouragement cùng lúc |
| **Simulation-Aware** | AI quan sát action learner làm trong simulation và phản hồi real-time | Đóng vòng lặp giữa doing và understanding ngay tức thì |
| **Voice + Text** | Nói hoặc gõ; AI transcribes và phản hồi tương ứng | Giảm friction cho học sinh nhỏ tuổi và mobile users |
| **Multilingual** | Tiếng Việt, tiếng Anh, bilingual mode; tự động switch theo learner | SEA learners thường code-switch; AI cũng vậy |
| **Session Summary** | Sau mỗi session: đã học gì, đã master gì, cần ôn gì, session tiếp theo nên làm gì | Learner và phụ huynh luôn biết learner đang ở đâu |
| **Safe Content Mode** | COPPA-compliant content filtering cho under-13 | Bắt buộc để được phụ huynh tin tưởng |




#### Tutor Teaching Platform

| Feature | What It Does | Why It's Core |
|---|---|---|
| **Tutor Workspace & Profile** | Tutor sets up their professional profile (subjects, experience, qualifications, video intro); profile is shared with their own students — not publicly listed in a price-comparison directory | Tutors need a professional home inside BeQuizzy, not a stall in a marketplace |
| **Student Connection Flow** | Tutors invite students via private link or QR code; students can also find a tutor through in-app search (by subject and location) but the relationship is initiated and controlled by the tutor | Keeps the dynamic professional: gia sư manages their own student roster, not a crowd |
| **1:1 & Group Class Scheduling** | Tutor creates sessions (1:1 or group), sets availability, students book into open slots; calendar syncs with iCal/Google Calendar | Without frictionless scheduling, tutors revert to WhatsApp back-and-forth |
| **Virtual Classroom** | Video call, screen share, interactive whiteboard, and all BeQuizzy simulation tools available live in session — inside BeQuizzy, not Zoom | Session happens inside BeQuizzy to capture data, build the learning record, and keep the relationship on-platform |
| **Tutor Wallet & Payout** | Weekly automated payouts; MoMo, VNPay, payOS, Stripe; tutor sets their own rates | Tutors won't adopt a new platform if payment is unreliable or opaque |

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
| **Dynamic Agentic RAG Tutor** | Multi-agent architecture with Supervisor/Planner, 7 Knowledge Tools (RAG retrievers), 7 Context Tools (live learner data), and 8 Action Sub-Agents each running a self-critique loop — topped by a Pedagogy Gate. Competitors (Duolingo, Khan Academy, Khanmigo) use a single LLM with a system prompt. BeQuizzy's architecture deepens with every session the learner takes — the context tools accumulate irreplaceable personal history. |
| **Interactive Simulation Engine** (full breadth) | Chemistry + Physics + Biology + Math + History + Geography + Literature + Civics + Computer Science + Economics + Music + Visual Arts + Health + Language + Reflex as live simulations requires enormous engineering investment. Competitors (Duolingo, Khan Academy, Synthesis) each cover 1–3 simulation domains. BeQuizzy covers every major subject in the SEA K-12 curriculum (excluding physical education) — 30+ simulation modules at full launch. |
| **Scientific Discoveries Lab** | Requires curation of primary-source papers + interactive experiment design per discovery. Not a template — each scenario is hand-crafted. Grows into a library that compounds as a moat. |
| **Reflex Training Arena** | Nobody else pairs cognitive reflex training (visual/auditory/hand/verbal/cognitive) with academic subject learning. The cross-skill insight (ear training → tonal language fluency) is a unique positioning. |
| **AI Knowledge Studio** | Network effect: more tutors build Knowledge Sets → richer BeQuizzy Marketplace → more learner demand → more tutors want to join. The tutor's entire knowledge contribution (curriculum, Q&A, teaching logic) is stored on BeQuizzy — they lose all of it if they leave. First mover in structured edu-knowledge packaging for AI. |
| **Language Conversation Mode + Pronunciation AI** | Real-time phoneme-level pronunciation feedback requires specialized ASR models trained per language. Competitors (Duolingo) have this for a few languages. BeQuizzy targets SEA languages (Vietnamese, Thai, Bahasa, Tagalog) that others ignore. |

#### How the AI Knowledge Studio Works

> A tutor's Knowledge Set is **not** a personality clone. It is a structured, subject-complete knowledge architecture — built contribution by contribution — that the AI uses to teach students systematically.

**The 6-Layer Knowledge Contribution Model:**

| Layer | What the Tutor Contributes | How the AI Uses It |
|---|---|---|
| **1. Curriculum Architecture** | Define subject scope, units, topics, learning sequence, prerequisites (e.g., "fractions before algebra") | AI maps a personalized learning path for each student based on their level and goal |
| **2. Concept Library** | Topic-by-topic explanations, analogies, real-world examples, diagrams — in the tutor's teaching style | AI explains concepts to students using the tutor's chosen approach and language |
| **3. Question Bank** | MCQ, open-ended, simulation-linked questions; model answers; common wrong answers + why they're wrong | AI assigns the right questions at the right difficulty; recognizes misconceptions and corrects them |
| **4. Teaching Logic Trees** | "If student answers X → explain Y. If student struggles with Z → try this alternative approach" | AI adapts its tutoring path in real time based on student responses |
| **5. Common Mistakes Library** | Documented errors from years of real teaching; why each mistake happens; how to fix it | AI proactively catches errors before they become habits; explains the root cause |
| **6. Assessment Framework** | How to test mastery per topic; what score = ready to advance; capstone challenge design | AI gates advancement until mastery is proven; generates appropriate final assessments |

**Publishing Flow:**

```
TUTOR BUILDS KNOWLEDGE SET:
  Create subject → add curriculum map → fill concept library → build question bank
  → define teaching logic → log common mistakes → set assessment rubrics
  → Preview as student → Publish to marketplace → Set license price

STUDENT ACCESSES:
  Browse **BeQuizzy Marketplace** → preview (3 free interactions)
  → Purchase license (monthly or lifetime)
  → AI teaches using tutor's full knowledge system
  → Combined with BeQuizzy's simulation engine (e.g., IELTS AI uses Speaking Simulator)
  → Progress tracked in BeQuizzy Learning Record
  → Tutor receives passive income + sees aggregate anonymized learning analytics
```

**What makes a Knowledge Set valuable:**
- **Depth** — a tutor with 10 years teaching IELTS Writing has documented 200+ common student mistakes; that library is irreplaceable
- **Curation** — not all content is equal; a trusted tutor's question bank outperforms generic AI-generated questions
- **Methodology** — a specific teaching sequence (e.g., "grammar before vocabulary before conversation") reflects hard-won pedagogical experience
- **Network effect** — as more students use a Knowledge Set, their interaction data improves the AI's teaching logic (with consent), making the Set smarter over time

**Revenue model:**
- Tutor earns **70%** of every license sale
- BeQuizzy earns **30%** (platform + AI infrastructure)
- Tutor can set: price tier, preview depth, license duration (monthly / lifetime), age restriction
- Top Knowledge Sets are featured in the marketplace; quality signal = student completion rate + score improvement delta



#### Moat Feature Details

| Feature | Access | Notes |
|---|---|---|
| **Scientific Discoveries Lab** | Free: 3 scenarios · Pro: all 12+ | Re-live Newton, Curie, Darwin, Watson-Crick, Hubble, Tesla + more; hypothesis-first; linked to original papers/patents |
| **Reflex Training Arena** | Free: 2 types · Pro: all 5 | Visual, Auditory, Hand Speed, Verbal Speed, Cognitive; baseline benchmark; Apprentice → Legendary ranked system |
| **AI Knowledge Studio** | Academy plan only | Tutor builds complete Knowledge Set subject by subject (curriculum map → explanations → Q&A bank → teaching logic → assessments) → published on marketplace as a licensable AI teaching product |
| **AI Knowledge Marketplace** | Free preview · Purchase per license | Browse, preview (3 free interactions), purchase monthly or lifetime license; tutor earns 70% of license revenue |
| **Language Conversation Mode** | Learner Pro | Immersive AI role-play scenes; real-time waveform pronunciation comparison; phoneme-level scoring |
| **Extended Simulations** | Learner Pro | Music Studio (piano/guitar/drums), Cosmology & Astronomy Explorer — complementing the dedicated subject simulation modules |
| **AI Music Tutor** | Learner Pro | AI listens via microphone; feedback on pitch, timing, posture; works with piano, guitar, drums |
| **Visual Arts & Design Studio** | Learner Pro | Full drawing, color theory, design thinking, art history gallery, photography composition, calligraphy — now its own dedicated simulation module; see Section 1.5 |

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
| **AI Knowledge Studio** | Academy | Tutors build structured AI Knowledge Sets (not clones — curriculum + Q&A + teaching logic); publish on marketplace; earn passive income per license |
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
           AI Knowledge Set license purchased → active daily usage
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
| **AI Knowledge Set License** | Learner has purchased access to a tutor's AI Knowledge Set; using it daily for subject learning | Sunk cost + genuine curriculum progression; license and learning history are platform-bound |
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

### 5.6 — 📝 Assessment & Testing Engine

> **Inspired by Codility, HackerRank, and Google Forms — but built for every subject, every age, and every type of knowledge.**
> BeQuizzy's Assessment Engine is a first-class, exam-grade testing platform embedded natively in the learning experience. Tutors use it to evaluate students. The platform uses it to gate mastery progression. Students use it to self-assess and earn credentials. All results feed directly into the Learning Record and the AI's adaptive model.

#### Design Philosophy

```
CODILITY / HACKERRANK MODEL (inspiration):
  Code-only → execution-based → hiring context → corporate

BEQUIZZY ASSESSMENT ENGINE (adaptation):
  All subjects → multi-modal → learning context → K-12 to adult
  Code tests + MCQ + essay + audio + simulation-linked → one unified engine
  Anti-cheat without surveillance culture — proportional to stakes
```

---

#### 5.6.1 — Question Types

BeQuizzy supports 14 question types, covering every form of knowledge expression from rote recall to creative synthesis:

| # | Question Type | Description | Auto-Graded |
|---|---|---|:---:|
| 1 | **Multiple Choice (MCQ)** | Single correct answer from 2–8 options; image or text options | ✓ |
| 2 | **Multiple Select** | One or more correct answers; partial scoring supported | ✓ |
| 3 | **True / False** | Binary assertion; can chain into multi-statement sequences | ✓ |
| 4 | **Fill in the Blank** | One or more blanks in a sentence; accepts synonym list; case-insensitive option | ✓ |
| 5 | **Matching Pairs** | Drag left column items to match right column items; supports image-to-text, text-to-text | ✓ |
| 6 | **Ordering / Ranking** | Drag items into correct sequence (steps, timeline events, priority order) | ✓ |
| 7 | **Hotspot** | Click on the correct region(s) in an image (e.g., label a cell organelle, identify a map location, mark a circuit fault) | ✓ |
| 8 | **Short Answer** | 1–3 sentence response; AI-assisted grading with teacher override | ⚠️ AI + human |
| 9 | **Essay / Long Form** | Structured written response; AI scores against rubric dimensions (thesis, evidence, coherence, grammar); teacher can override | ⚠️ AI + human |
| 10 | **Code Execution** | Write and run code in 25+ languages; test cases validate output; AI detects logical errors beyond pass/fail | ✓ |
| 11 | **Audio Response** | Learner records spoken answer (language pronunciation, oral history, debate argument); AI transcribes and scores against rubric | ⚠️ AI + human |
| 12 | **Simulation-Linked** | Test embedded in a simulation (e.g., "mix these chemicals — which reaction occurs?"); answer derived from simulation state | ✓ |
| 13 | **Drag & Drop Labeling** | Drag labels onto a diagram (anatomy, geography maps, chemistry diagrams, circuit schematics) | ✓ |
| 14 | **Agreement Scale** | Likert-scale survey questions for self-reflection, learning style assessment, or course feedback | ✓ |

---

#### 5.6.2 — Test Builder

| Feature | Detail |
|---|---|
| **Drag-and-Drop Test Constructor** | Assemble questions from the question bank or write new ones inline; drag to reorder; group into sections (e.g., Part A: MCQ 20 pts · Part B: Essay 30 pts) |
| **Question Bank Library** | Centralized bank per tutor and per subject; tag each question by topic, difficulty (Easy/Medium/Hard), Bloom's Taxonomy level (Remember → Create), and learning objective |
| **AI Question Generator** | Describe a topic and target difficulty → AI proposes draft questions in any supported type; tutor reviews and approves before adding to bank |
| **Random Question Pool** | Set a pool of 20 questions; system randomly selects 10 per student → every test is unique; configure pool per section |
| **Question Version History** | Track edits to questions; see which version was used in which test; revert if needed |
| **Import / Export** | Import questions from CSV or formatted DOCX; export test as PDF for offline use or print |
| **Section Configuration** | Set per-section time limits, instructions, point weights, and navigation rules (can student go back?) |
| **Prerequisite Lock** | A test can only be unlocked after the learner completes a prior module or achieves a minimum score on a prior test |

---

#### 5.6.3 — Test Settings & Delivery

| Setting | Options |
|---|---|
| **Timing** | Untimed · Fixed countdown (per test) · Per-question countdown · Flexible (total time distributed across questions by student) |
| **Attempt Policy** | 1 attempt · N attempts · Unlimited · Best score / Last score / Average score counted |
| **Window** | Available always · Open from date/time X to date/time Y · Rolling window (start anytime, complete within N hours) |
| **Question Order** | Fixed · Randomized per student · Randomized within sections |
| **Answer Order** | Fixed · Randomized (MCQ/Multiple Select options shuffled) |
| **Result Visibility** | Show score immediately · Show after all students submit · Show only after manual review · Never show (blind assessment) |
| **Partial Scoring** | On/Off for Multiple Select and Code questions |
| **Calculator / Tools** | Enable/disable on-screen calculator, ruler, periodic table, or formula sheet per test |
| **Accessibility** | Extended time mode for learners with flagged accessibility needs; font size override; screen reader compatible |

---

#### 5.6.4 — Code Execution Sandbox

> **Inspired by Codility and HackerRank — generalized for BeQuizzy's Computer Science module and any subject involving logical reasoning.**

| Feature | Detail |
|---|---|
| **Language Support** | Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Ruby, Rust, PHP, Swift, Kotlin, R, SQL, HTML/CSS, Bash — 25+ languages at launch |
| **In-Browser IDE** | Syntax highlighting, auto-indentation, line numbers, basic autocomplete; no install required |
| **Test Case Runner** | Tutor defines N test cases (hidden from student); student's code is executed against all; pass/fail per case displayed; final score = cases passed / total cases |
| **Custom Test Cases** | Student can write and run own test cases during the attempt (visible only to them) before final submission |
| **Execution Limits** | Configurable per question: CPU time limit (1s–30s), memory limit (64MB–512MB) |
| **Error Display** | Runtime errors, compile errors, and timeout messages shown verbatim; AI explains the error in plain language on request |
| **Code Review Scoring** | Beyond pass/fail: AI assesses code readability, efficiency (Big-O estimation), use of appropriate patterns; optional tutor rubric override |
| **SQL Mode** | Full SQL sandbox with pre-seeded database schema; queries execute against the schema; results compared to expected output |

---

#### 5.6.5 — Anti-Cheat & Academic Integrity

> **Proportional to stakes — lightweight monitoring for practice, robust proctoring for certification-level exams.**

| Mechanism | Practice Tests | Graded Assignments | Certification Exams |
|---|:---:|:---:|:---:|
| **Attempt time tracking** | ✓ | ✓ | ✓ |
| **Tab / window focus loss alert** | — | ✓ | ✓ |
| **Copy-paste from external source detection** | — | ✓ | ✓ |
| **Browser lockdown mode** (can't open other tabs) | — | Optional | ✓ |
| **AI-generated content detection** | — | ✓ | ✓ |
| **Plagiarism check** (against previous submissions in the platform) | — | ✓ | ✓ |
| **Code similarity detection** across submissions | — | ✓ | ✓ |
| **Webcam proctoring (opt-in)** | — | — | Optional |
| **IP consistency check** (flag if IP changes mid-test) | — | — | ✓ |
| **VPN/Proxy detection** | — | — | ✓ |
| **Randomized question pools** | — | ✓ | ✓ |
| **Randomized answer order** | ✓ | ✓ | ✓ |

> **Privacy note:** Webcam proctoring is opt-in only, requires explicit learner consent before the exam begins, and video is processed locally (face presence detection only — no recording stored unless flagged event occurs). COPPA-compliant: no webcam proctoring for learners under 13.

---

#### 5.6.6 — Auto-Grading & AI Scoring

| Feature | Detail |
|---|---|
| **Instant Auto-Grading** | Objective question types graded at submission; score and feedback available immediately |
| **AI Essay Scorer** | Evaluates essay responses against a configurable rubric (up to 6 dimensions: e.g., Argument, Evidence, Structure, Grammar, Originality, Relevance); each dimension scored 0–10; AI provides specific, sentence-level feedback |
| **AI Audio Scorer** | Transcribes spoken response; evaluates content against rubric; pronunciation scored separately using phoneme comparison (same engine as Language Pronunciation AI) |
| **Tutor Override** | Tutor can review any AI-graded response and override the score; override recorded in audit log; AI notes the disagreement for future calibration |
| **Rubric Builder** | Visual rubric editor: define criteria, performance levels (Excellent/Good/Satisfactory/Needs Improvement), and point values per level; attach rubric to any Essay or Audio question |
| **Partial Credit Engine** | For code: proportion of test cases passed = proportion of points earned. For matching/ordering: partial credit per correct element |
| **Regrading** | If a question is found to have an error after distribution, tutor can mark it void (all students receive full points) or update the correct answer and trigger automatic regrading |

---

#### 5.6.7 — Results, Analytics & Reporting

| Report | Audience | Key Data |
|---|---|---|
| **Learner Score Report** | Learner + Parent | Total score, per-question result, time spent, comparison to class average, detailed AI feedback per wrong answer, correct answer explanation |
| **Class Performance Dashboard** | Tutor | Score distribution histogram, mean/median/standard deviation, per-question difficulty (% correct), fastest and slowest completers, at-risk students (scored below threshold) |
| **Question Item Analysis** | Tutor | Discrimination index (does this question separate high from low performers?), distractor analysis (which wrong answer was most popular and why), average time per question |
| **Mastery Detection Report** | Tutor + AI | Which learning objectives does the class clearly understand? Which are gaps requiring reteaching? Mapped to BeQuizzy's knowledge graph |
| **Attempt Timeline** | Tutor (for academic integrity) | Time-stamped log of every answer change, tab-switch event, copy-paste event, and submission — full audit trail |
| **Cohort Comparison** | Academy admin | Compare class A vs class B on the same test; compare current cohort to historical average |
| **Exportable Data** | Tutor / Academy | CSV export of all scores and metadata; PDF gradebook; API endpoint for external SIS integration |

---

#### 5.6.8 — Certification System

> **Tests that matter should produce credentials that mean something.**

| Feature | Detail |
|---|---|
| **Pass Threshold Setting** | Tutor defines the minimum score to "pass" a test (e.g., 80%); learners below threshold are prompted to review and retry |
| **Auto-Certificate Generation** | On passing a designated certification test: platform auto-generates a signed, verifiable PDF certificate with learner name, subject, score, date, and BeQuizzy seal |
| **Unique Verification ID** | Each certificate has a URL-accessible verification page; anyone can verify authenticity by entering the certificate ID |
| **LinkedIn Share Button** | One-click to add the credential to a LinkedIn profile's Certifications section |
| **Expiry Policy** | Tutor can set certificate validity period (e.g., IELTS prep certificate valid 2 years); expired certificates prompt renewal |
| **Certificate Gallery** | Learner's profile page shows all earned certificates in a visual gallery; shareable public link |
| **Tutor-Branded Certificates** | Tutors on Academy plan can add their logo and signature to auto-generated certificates |

---

### 5.7 — 📅 Smart Learning Hub (Mini LMS)

> **BeQuizzy's Mini LMS is not an add-on. It is the operating system that makes teaching a solo business and learning a managed habit.**
> Inspired by Google Classroom's simplicity, Canvas's curriculum structure, and Notion's flexibility — distilled to what actually moves outcomes: clarity about what to do next, visibility into whether it's working, and connection between people who are learning together.

The Mini LMS serves three distinct roles simultaneously:

| Role | What it solves | Key outcome |
|---|---|---|
| **Tutor — Solo Business** | A qualified gia sư today runs their business across WhatsApp, Zalo, Google Sheets, and Zoom. BeQuizzy replaces all of them with one professional workspace | Tutor operates like a 5-person studio — alone |
| **Learner — Self-Management** | Without structure, learners default to whatever's easiest; weak spots never get addressed | Learner has a personal curriculum, daily plan, and mastery map |
| **Learner — Peer Study Groups** | Learning in isolation is slower and lonelier; learners often study better with accountability from peers at the same level | Learners form their own study circles, quiz each other, and co-own their progress |

---

#### The Scheduling Problem BeQuizzy Solves

```
WITHOUT A SCHEDULE:                    WITH BEQUIZZY MINI LMS:
  Learner opens app                      Learner opens app
  → "What should I study?"               → "Today: 20 min Chemistry (AI)
  → Browses randomly                          30 min IELTS Writing practice
  → Does what's easiest                       Review: 5 flashcards due today"
  → Forgets about weak spots             → Everything queued, no decision fatigue
  → Learning is reactive, not strategic  → Learning is proactive and goal-driven

TUTOR WITHOUT BEQUIZZY:                TUTOR WITH BEQUIZZY:
  WhatsApp for updates                   Class announcements inside BeQuizzy
  Google Sheets for grades               Grade book auto-populated from submissions
  Tutor improvises each session          Sessions follow a planned curriculum arc
  No visibility into student gaps        Dashboard flags: "3 students failed Quiz 3"
  Separate tools for everything          One professional workspace for everything

LEARNERS WITHOUT PEER GROUPS:          LEARNERS WITH PEER GROUPS:
  Study alone, lose motivation           Form a study circle with 3–5 peers
  No one to ask questions between        Async Q&A within the group
  tutor sessions                         Group quiz battles, shared flashcard decks
  Can't tell if they're falling behind   Progress visible to the group (opt-in)
```

---

#### 5.7.1 — Learner: Personal Learning Calendar

| Feature | Detail |
|---|---|
| **Weekly & Monthly Calendar View** | Visual calendar showing all scheduled events: AI tutor sessions, booked human tutor sessions, assignment due dates, test windows, spaced repetition review reminders |
| **AI-Generated Daily Plan** | Each morning, AI assembles a recommended daily learning plan based on: current goals, available time declared by learner, upcoming deadlines, spaced repetition schedule, weak topics detected from recent tests |
| **Subject Time Budget** | Learner sets a weekly time budget per subject (e.g., "Math: 3h/week, English: 2h/week"); progress bar fills as time is logged; AI warns if a subject is falling behind |
| **Time Logging** | Sessions auto-log time spent (AI tutor sessions, simulation time, test attempts); manual log option for offline study |
| **Upcoming Events Widget** | Home screen card: "Next: IELTS Mock Test — tomorrow 9:00 AM · Assignment due: History Essay — in 2 days" |
| **Deadline Radar** | Scrollable timeline showing all upcoming deadlines sorted by urgency; overdue items flagged in red |
| **Holiday & Exam Season Mode** | Learner can flag exam dates; AI automatically intensifies review schedule in the 2–4 weeks prior using spaced repetition acceleration |

---

#### 5.7.2 — Learner: Goal Setting & Progress Tracking

| Feature | Detail |
|---|---|
| **Goal Wizard** | Setup flow: choose goal type (exam prep, subject mastery, skill building, exploration); set target date; AI back-calculates weekly milestones |
| **Goal Progress Card** | Per-goal progress bar: "IELTS 7.0 by September: 64% ready — 14 weeks remaining"; broken down by skill (Reading 72%, Listening 68%, Writing 51%, Speaking 55%) |
| **Milestone Celebrations** | When a learner hits a milestone (e.g., "finished Unit 3", "first week streak complete"), an in-app celebration triggers with XP reward |
| **Weekly Learning Report (Self)** | Every Monday: "Last week you studied 4h 20min across 3 subjects. Top subject: Math. Weakest area: Quadratic Equations. Suggested focus this week: 2 more sessions on Quadratics." |
| **Streak Calendar** | Duolingo-style streak heatmap showing days studied; streak broken means XP multiplier reset but progress never lost |
| **Mastery Map** | Visual heatmap of all topics across all enrolled subjects; green = mastered, yellow = reviewed, red = not started or failed; click any cell to jump directly to that topic |

---

#### 5.7.3 — Learner: Assignment & Test Management

| Feature | Detail |
|---|---|
| **My Tasks** | Unified inbox of all pending work across all subjects and tutors: assignments, tests, practice sets, reading materials |
| **Submission Flow** | Open assignment → complete inline (essay, MCQ, code, audio) or upload file → submit with one tap; late submission marked automatically |
| **Draft Autosave** | All in-progress assignment work is autosaved every 30 seconds; learner can return to draft from any device |
| **Feedback Viewer** | After grading: see score, per-question AI feedback, tutor comments with annotation, and comparison to rubric; request clarification with one click |
| **Re-attempt Tracker** | For assignments with multiple attempts: see score history across all attempts; AI highlights what improved and what still needs work |
| **Peer Review (opt-in)** | For essay assignments: anonymized peer review mode — learner grades 2 peers' essays using the same rubric before seeing their own score (builds metacognition) |

---

#### 5.7.4 — Tutor: Curriculum Planner

> **Think of it as a lesson plan that lives and breathes — connected to content, assignments, and student data in real time.**

| Feature | Detail |
|---|---|
| **Course / Class Creator** | Create a named course (e.g., "IELTS Intensive — Cohort June 2026"); add description, subject tags, target level, duration; enroll students or set open enrollment |
| **Curriculum Timeline** | Visual week-by-week lesson plan: drag-and-drop weeks, add topics per week, attach content (simulation module, video, external link, document), link assignments and tests |
| **Unit & Topic Hierarchy** | Organize into Units → Lessons → Topics; each topic can have a completion status (Not Started / In Progress / Completed) updated by student activity |
| **Content Library** | Tutor's personal library of reusable content: links to BeQuizzy simulations, uploaded PDFs, custom video links, question bank tests; tag and search |
| **Pacing Recommendations** | AI analyzes class average progress and warns if the class is ahead or behind the planned curriculum pace; suggests adjustments |
| **Class Duplication** | Clone a full curriculum (units, topics, assignments, tests) to start a new cohort — no rebuilding from scratch |
| **Lesson Plan Template Gallery** | Pre-built curriculum templates for common courses (IELTS 3-month intensive, Grade 10 Math semester, Python beginner 8-week); customize and launch |

---

#### 5.7.5 — Tutor: Session Management & Calendar

| Feature | Detail |
|---|---|
| **Tutor Master Calendar** | Full-month view of all sessions, classes, office hours, and blocked times across all students and groups |
| **Availability Manager** | Set recurring weekly availability blocks (e.g., Mon/Wed/Fri 18:00–21:00 Vietnam time); automatically opens booking slots for students |
| **Session Types** | 1:1 (private), Group (2–20 students), Office Hours (drop-in, first-come-first-served), Workshop (open enrollment event) |
| **Buffer Time** | Set automatic buffer between sessions (5/10/15/30 min) to prevent back-to-back bookings |
| **Pre-Session Agenda** | Before each session: auto-populated with: student's recent performance, topics due for coverage, previous session notes, and unresolved questions from the student |
| **Post-Session Notes** | After each session: tutor writes session summary (what was covered, what to follow up); auto-sent to student and parent; archived in student's Learning Record |
| **No-Show & Cancellation Policy** | Tutor sets policy (e.g., "cancel 24h in advance or lose the booking fee"); BeQuizzy enforces automatically; credit refund or deduction applied |
| **Recurring Sessions** | Book a recurring 1:1 (e.g., every Tuesday 7:00 PM for 8 weeks); one-click cancel or reschedule individual sessions |
| **iCal Sync** | Export tutor calendar to Google Calendar, Apple Calendar, or Outlook; two-way sync for availability updates |

---

#### 5.7.6 — Tutor: Assignment Creator & Grade Book

| Feature | Detail |
|---|---|
| **Assignment Builder** | Create assignments using the Assessment Engine (any question type); add instructions, attach resources, set due date, configure late submission policy |
| **Distribution** | Assign to: all students in a class · specific students (differentiated assignment) · a group |
| **Auto-Grading + Queue** | Objective questions graded instantly; essay and audio questions appear in a grading queue; sort by submission time or student name |
| **Inline Annotation** | On essay submissions: highlight text and add a comment; works like Google Docs review mode |
| **Bulk Feedback** | Write a single comment that applies to all students (common mistake observed); send alongside individual feedback |
| **Grade Book** | Spreadsheet-style view: rows = students, columns = assignments/tests; cells show score as percentage and raw points; overall average auto-calculated; filter by date, assignment type, or score range |
| **Grade Categories & Weights** | Define grade categories (Homework 20%, Quizzes 30%, Tests 50%); assignments tagged to category; weighted average auto-calculated |
| **Grade Export** | Export grade book as CSV or formatted Excel; or push to an external Student Information System via API |
| **Progress Alert** | Auto-flag students who: scored below X on 2+ consecutive tests · haven't submitted 2+ assignments · have not logged in for N days → tutor sees alert in dashboard |

---

#### 5.7.7 — Tutor: Student Progress Dashboard

| Panel | What the Tutor Sees |
|---|---|
| **Class Overview** | All enrolled students; each row shows: attendance rate, average test score, assignment submission rate, last active date, current goal progress |
| **Student Deep-Dive** | Click any student → full profile: mastery map (topic by topic), assignment history, test score timeline, session history with notes, AI tutor usage, reflex rank |
| **At-Risk Students** | Automatically surfaced: students whose score trend is declining, attendance is dropping, or assignment submission rate is below 60% — with suggested intervention actions |
| **Engagement Heatmap** | Calendar heatmap showing when each student was active; identify who studies consistently vs. cramming before tests |
| **Test Analytics** | Per-test: class distribution, question item analysis, common mistakes; AI identifies "teaching gap" — questions the whole class failed, suggesting the concept needs reteaching |
| **Comparison View** | Compare two students side-by-side; or compare current cohort performance to the tutor's historical cohort average |

---

#### 5.7.8 — Tutor: Communication & Announcements

| Feature | Detail |
|---|---|
| **Class Announcements** | Post a text/image/video announcement to all students in a class; appears in student's notifications and on the class home page |
| **Direct Messaging** | 1:1 chat between tutor and student; 1:1 chat between tutor and parent; all messages archived and visible to the Academy admin |
| **Parent Notification Bridge** | Tutor can send a structured weekly summary to all parents of students in a class: attendance, latest test scores, upcoming assignments; auto-formatted as an email or in-app notification |
| **Announcement Scheduling** | Draft an announcement and schedule it to send at a future time (e.g., "Send exam reminder next Friday at 7 AM") |
| **Q&A Discussion Board** | Per-class discussion board where students post questions; other students can reply; tutor can mark a reply as "best answer"; AI can auto-answer common questions using the Knowledge Set if available |
| **Reaction & Poll** | Post a quick poll (e.g., "Ready for the test? Yes / Almost / Need more practice"); see real-time results; use to calibrate upcoming session |

---

#### 5.7.9 — Learner: Peer Study Groups

> **The best accountability partner is someone learning the same thing at the same time. Peer study groups turn solo learning into a shared mission.**

| Feature | Detail |
|---|---|
| **Group Creation** | Any learner can create a study group: name it, set the subject and target (e.g., "IELTS 7.0 by September — Study Circle"), and invite peers via private link or in-app username |
| **Group Size** | 2–10 members; intentionally small for accountability, not a classroom |
| **Shared Progress Wall** | Opt-in: each member's mastery progress in the shared subject is visible to the group; see who's ahead and who needs help |
| **Async Q&A Board** | Post a question to the group; any member can answer; AI can also respond if no human answers within 24h; tutor (if enrolled) can be looped in |
| **Group Quiz Battles** | Challenge another member or the whole group to a live quiz on any topic; results shown immediately; leaderboard resets weekly |
| **Shared Flashcard Deck** | Members contribute cards to a group deck; spaced repetition runs individually but from the shared pool |
| **Study Session Rooms** | Members can open a shared focus room (video off, ambient sound, countdown timer); keeps each other accountable for a timed study block |
| **Group Streak** | Group earns a collective daily streak when all members log a session; breaking the group streak is a stronger motivator than breaking an individual streak |
| **Group Challenges** | AI generates weekly group challenges (e.g., "Complete 3 Chemistry simulations this week"); group earns XP together |
| **Invite a Tutor** | Group can invite any BeQuizzy tutor to their group for a one-off Q&A session or to observe their progress and give feedback |

---

#### 5.7.10 — Shared: Notifications & Integrations

| Feature | Detail |
|---|---|
| **Notification Engine** | Push (mobile), email, and in-app notifications; user controls which channels per event type |
| **Smart Reminders** | AI learns learner's study patterns; sends reminders at the optimal time (e.g., "You usually study at 8 PM — your Chemistry review is due tomorrow") |
| **Event Types** | Session starting in 30 min · Assignment due in 24h · Test window opens · Grade posted · New announcement · New message · Streak about to break · Goal milestone reached |
| **Do Not Disturb** | Schedule quiet hours per day; emergency-only mode for test start notifications |
| **Calendar Integration** | Export personal schedule to Google Calendar, Apple Calendar, Outlook via iCal; events auto-update when tutor reschedules |
| **Attendance Tracking** | For group classes: tutor marks attendance in-app; absent students receive automatic make-up resources (recording link + summary); attendance record visible to parents |
| **Session Recording Archive** | Group class sessions auto-recorded (with student consent); AI generates a 5-bullet summary of what was covered; recording + summary stored in class library for 90 days |
| **Waiting List** | For popular group classes: if seats are full, students join a waiting list; auto-notified if a seat opens |

---

### 5.8 — Out of Scope

| Not Built | Reason |
|---|---|
| **Physical merchandise / textbooks** | BeQuizzy is a digital platform; physical goods are out of scope |
| **Full Enterprise LMS for universities** | Moodle/Canvas replacement with SCORM/xAPI, LTI, SIS integration, and accreditation reporting is a different product with a different sales cycle; BeQuizzy builds a purposeful Mini LMS, not an enterprise replacement |
| **Degree-granting programs** | Accreditation is a regulatory challenge outside the product scope |
| **Cold outreach / marketing automation for tutors** | BeQuizzy is a teaching tool, not a sales CRM; tutors connect with students through their existing network and BeQuizzy's in-app search, not through mass outreach |
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
| AI Knowledge Set license purchases | One-time or subscription license purchase for individual AI Knowledge Sets |
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
| Content moderation | AI moderation on all user-generated content (tutor profiles, session notes, Knowledge Set training data) |
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

### Referral Program

| Feature | Notes |
|---|---|
| Referral link | Unique per-user link (learner and tutor) with 30-day cookie tracking |
| Reward structure | Free Learner Pro days per referral event (signup, first paid session, plan upgrade) |
| Tutor referral bonus | Tutor earns bonus payout % on first 3 months of each referred student's subscription |
| Fraud prevention | Same IP / device fingerprint detection |
| Referral dashboard | Clicks, signups, upgrades, rewards earned |

---

### Customer Lifecycle & Growth

*How BeQuizzy retains subscribers and expands revenue — internal SaaS operations, not customer-facing product features.*

**Retain — Learners**

| Feature | Notes |
|---|---|
| **Milestone Celebration System** | In-app celebration at key learning moments: first AI session completed, first simulation mastered, first streak week, first exam mock passed, first Knowledge Set licensed. Each milestone surfaces a suggested next action (e.g., \"Try Chemistry next — it pairs with your Physics progress\"). |
| **Weekly Learning Digest** | Automated weekly email + push: sessions completed, topics mastered, streak status, spaced repetition queue for the week. Sent only when there is learning activity. Included for parents of child learners. |
| **Streak Break Rescue** | When a streak is about to break (no activity in 20+ hours): push notification + one free \"streak freeze\" per month. Streak loss is the #1 churn trigger for habit-based learning apps. |
| **Smart Re-engagement Reminders** | AI learns each learner's active hours from session patterns; schedules reminders at the optimal time (e.g., \"You usually study at 8 PM — your spaced repetition review is due tonight\"). |
| **At-Risk Learner Detection** | Internal scoring: login frequency + session completion rate + spaced repetition queue backlog. At-risk learners get a personalized in-app check-in card (\"It's been 10 days — your Chemistry streak is at risk\") and an automated email. |
| **Cancellation Intervention Flow** | 4-step flow on cancel: (1) show learning progress summary (topics mastered, streak, improvement delta) → (2) offer Pause (keep data and rank, freeze billing) → (3) offer downgrade to Free → (4) one-time 30% discount for 3 months. Each step shown only if previous is declined. |
| **Win-Back Sequences** | Automated email lifecycle for churned learners: Day 7 (progress preservation reminder), Day 30 (what's new + streak can restart), Day 60 (limited re-activation offer). |
| **BeQuizzy NPS** | In-app survey at: first month completed, Day 90, post-exam. Promoters → referral ask. Detractors → routed to support immediately with context-aware message. |
| **Feature Discovery Nudges** | If a paying learner has not used a feature within 14 days of unlock (e.g., Exam Prep, Reflex Arena), surface a contextual in-app nudge with a 60-second quick-start guide. |

**Retain — Tutors**

| Feature | Notes |
|---|---|
| **Tutor Revenue Dashboard** | Weekly summary: sessions taught, income earned, student progress highlights. Tutors who see their income growing don't leave. |
| **Knowledge Set Performance Digest** | Monthly email for Academy tutors: licenses sold, learner completion rate, score improvement delta, revenue earned. Makes the passive income tangible and motivating. |
| **Student Milestone Alerts** | Tutor receives in-app notification when a student they teach achieves a milestone (first mastery, exam score improvement). Reinforces emotional investment in the platform. |
| **Tutor Cancellation Flow** | 3-step: (1) show student roster + income earned → (2) offer Pause (student relationships preserved, no new bookings) → (3) offer downgrade to Tutor Starter (free with commission). |

**Upsell / Expansion — Learners**

| Feature | Notes |
|---|---|
| **Session Limit Smart Alert** | In-app banner + email when a Free learner hits 4/5 monthly AI sessions. Shown at peak frustration moment: contextual upgrade CTA, not a generic pop-up. |
| **Feature-Gate Upgrade Moments** | When a Free/Learner Pro user touches a locked feature (Exam Prep, extended simulation, full Parent Dashboard): show a live preview + value prop + upgrade CTA — not a disabled button. |
| **Annual Plan Conversion Nudge** | Triggered at month 3–4 of monthly subscription: in-app banner + email showing cumulative monthly spend vs. annual cost and exact savings (e.g., \"You've paid $36 in 3 months — switch to annual and pay $99 for the year\"). |
| **Exam Deadline Urgency** | If a learner's profile shows an upcoming exam (IELTS, THPT, SAT), surface a contextual upgrade CTA starting 90 days before: \"Your IELTS is in 90 days — unlock the full prep track now.\" |
| **Family Plan Upsell** | When a parent adds a second child account: auto-surface the Family Plan as the cheaper option vs. two individual Learner Pro subscriptions. |
| **Knowledge Set Purchase Funnel** | When a learner views a Knowledge Set preview and uses all 3 free interactions: show progress made, what's locked, and a one-click license purchase. Momentum from learning drives conversion. |

**Upsell / Expansion — Tutors**

| Feature | Notes |
|---|---|
| **Student Roster Limit Alert** | Tutor Starter users hit the 5-student cap → contextual upgrade CTA: \"You have 5 students and 3 more waiting — upgrade to Tutor Pro for unlimited students.\" |
| **AI Knowledge Studio Teaser** | Academy-locked feature visible (but locked) on Tutor Pro dashboards. On hover: preview of Knowledge Set builder + estimated monthly passive income based on the tutor's subject and student count. |
| **Group Class Unlock Moment** | When a Tutor Starter or Tutor Pro attempts to create a group class beyond their limit: upgrade CTA with clear value prop (\"Teach 20 students in one session instead of 20 separate ones\"). |
| **Revenue Attribution** | Academy plan tutors see their total passive income from Knowledge Set licenses on the main dashboard — the strongest retention lever for high-value tutors. |

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

CONNECT WITH A TUTOR
  Find a tutor via in-app search (subject, location) or accept an invitation link from a tutor
  → Book 1:1 or join a group class directly from the tutor’s availability calendar
  → Session in Virtual Classroom (video + whiteboard + simulation tools)
  → AI summarizes session and assigns follow-up practice

ACCESS AI KNOWLEDGE SETS (Phase 2)
  Browse **BeQuizzy Marketplace**
  → Preview a tutor's AI Knowledge Set (3 free interactions)
  → Purchase license → learn from tutor's structured AI curriculum any time

TRACK PROGRESS
  Learning Record: all sessions, mastery levels, streaks
  Weekly Report (learner + parent)
  Predicted exam readiness for standardized tests
```

### For Tutors

```
SIGN UP (< 10 minutes)
  Profile: subjects, experience, qualifications, video intro
  → Identity verification (background check for new tutors)
  → Set hourly rate, availability, age groups served

CONNECT WITH STUDENTS
  Invite students via private link or QR code; students can also find tutors via subject search
  → Session in BeQuizzy Virtual Classroom
  → Assign homework; AI auto-grades MCQ, flags for manual review

OPEN GROUP CLASSES
  Create class: name, subject, price per seat, schedule, max students
  → Students enroll → Live group sessions with interactive tools
  → Auto-record → AI summary → share with enrolled students

BUILD AI KNOWLEDGE SET (Phase 2 — Academy plan)
  Open AI Knowledge Studio → select subject
  → Layer 1: Define curriculum map (units, topics, sequence, prerequisites)
  → Layer 2: Write concept explanations per topic (text + examples + analogies)
  → Layer 3: Build question bank (MCQ + open-ended + model answers + wrong-answer explanations)
  → Layer 4: Define teaching logic trees ("if student struggles with X → try Y")
  → Layer 5: Log common mistakes library (from real teaching experience)
  → Layer 6: Set assessment framework (mastery thresholds + capstone challenge)
  → Preview as a student → Publish to **BeQuizzy Marketplace** → set license price
  → Earn 70% of every license sale passively
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
| Duolingo | 40+ languages, 500M downloads, brand recognition | Simulation engine + human tutors + AI Knowledge Studio — Duolingo is a vocabulary drill; BeQuizzy is a learning world |
| Synthesis Tutor | SpaceX origin story, excellent UX, math only | BeQuizzy covers 20x more subjects; same depth of simulation |
| Khan Academy / Khanmigo | Free, trusted, broad curriculum | BeQuizzy is interactive simulation — watching a video ≠ running an experiment |
| Preply / italki | 100k+ tutors, language-focused | BeQuizzy wraps human tutors inside a full platform with AI, tools, and a structured Knowledge Set economy |
| Coursera / Udemy | Massive course libraries | Static video courses vs. BeQuizzy's living simulations and AI tutor |

**Global product requirements:**
- Full English-first product (already built from day 1)
- Localization pipeline: new language UI in < 4 weeks using AI translation + native review
- Regional curriculum tagging (Common Core USA, National Curriculum UK, CBSE India, MEXT Japan)
- International payment stack (Stripe global, Apple Pay, Google Pay)
- GDPR (EU), COPPA (USA), PDPA (Thailand/Singapore), compliance-by-design
- Global tutor onboarding in any timezone

**Phase 3 North Star:** 10M Weekly Active Learners globally; AI Knowledge Marketplace with 10,000+ listed Knowledge Sets.

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
| **Academy** | $79/mo | 1,990,000₫/mo | All Tutor Pro features · **AI Knowledge Studio** (build & publish Knowledge Sets) · Knowledge Set marketplace listing · Center management (up to 5 teachers) · 8% commission |
| **Center Enterprise** | Custom | Custom | Unlimited teachers · White-label portal · Priority support · API access · Custom commission rate |

### AI Knowledge Set Licenses (Student-Facing)

> A Knowledge Set license gives the student access to a specific tutor's AI — their full curriculum, Q&A bank, teaching logic, and assessment system — for a chosen subject.

| License Type | Price (USD) | Price (VND) | Notes |
|---|---|---|---|
| **Single Knowledge Set – Monthly** | $5–$30/mo | 120,000–750,000₫/mo | Tutor sets price within platform limits based on subject depth and demand |
| **Single Knowledge Set – Lifetime** | $25–$199 one-time | 600,000–4,990,000₫ | Tutor option; includes all future updates the tutor adds to the Knowledge Set |
| **Subject Bundle** | $15–$50/mo | 350,000–1,250,000₫/mo | Coming Phase 2 — one tutor's complete curriculum across multiple subjects |
| **Knowledge Set Bundle** | Custom | Custom | Coming Phase 3 — curated bundles from multiple tutors (e.g., "IELTS Complete Pack") |

**Marketplace quality signals (what drives a Knowledge Set's price and ranking):**
- Student completion rate (% of learners who finish the curriculum)
- Score improvement delta (average test score before vs. after)
- Learner retention (% still active after 90 days)
- Depth score (how many of the 6 knowledge layers are fully built)
- Review ratings (post-completion student feedback)

> BeQuizzy takes **30%** of AI Knowledge Set license revenue; tutor earns **70%**.
> Tutors on the Academy plan can publish; Learner Pro users can purchase.

---

*This document is a living overview and will be updated as the product evolves.*
