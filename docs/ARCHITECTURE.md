# BeQuizzy — System Architecture

**Version:** 0.1  
**Last Updated:** 2026-05-19

---

## Status
This file is being reset because the previous contents no longer match BeQuizzy.

## Current architecture direction
Based on the current repository setup, BeQuizzy is expected to use:
- **Frontend:** Next.js 14 + TypeScript + Tailwind
- **Backend:** Go + Gin services
- **Database:** PostgreSQL
- **Cache / queue support:** Redis
- **Auth:** Supabase Auth

## Product architecture implications
Because BeQuizzy is an AI-native assessment platform, the backend will likely need these bounded areas:
- candidate assessment delivery
- AI scoring and feedback generation
- profile and evidence storage
- employer hiring workflow
- marketplace / matching logic
- content and notification systems

## Near-term recommendation
Do not finalize the detailed service architecture until the v1 product scope is locked around:
1. Sales/BD candidate assessments
2. modular multimodal delivery
3. scorecard generation
4. employer shortlist workflow

## Next architecture draft should cover
- frontend app structure
- assessment session flow
- media handling for voice/video tasks
- AI scoring pipeline
- evidence profile schema
- employer dashboard boundaries
- analytics and auditability for scoring decisions
