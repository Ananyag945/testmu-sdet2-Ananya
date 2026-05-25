# 🤖 AI Assistant Collaboration & Decision Log

In alignment with modern software engineering practices, this framework was developed using a pair-programming methodology with the AI Coding Assistant (Antigravity). This log details what the AI produced, how it was reviewed, and the technical decisions owned and verified by the engineer.

---

| Tool / Assistant | Task | What It Produced | Decision Owned by Engineer |
| :--- | :--- | :--- | :--- |
| **Gemini 3.5 Flash**<br>(Antigravity) | **Project Scaffolding** | Structured directory layouts, `package.json` setup, TypeScript dependencies, and tsconfig paths aliases. | **Project Configuration**: Verified module compilation targets (ES2022/CommonJS) to guarantee node version compatibility. |
| **Gemini 3.5 Flash**<br>(Antigravity) | **Environment Management** | `config/env.config.ts` blueprint using Zod schemas to parse process environment properties. | **Fail-Fast Policy**: Commited to throwing immediate application load-time errors if variables are missing, instead of allowing tests to fail mid-execution. |
| **Gemini 3.5 Flash**<br>(Antigravity) | **Page Object Model (POM)** | `BasePage.ts`, `LoginPage.ts`, and `DashboardPage.ts` POM base classes with placeholders. | **Encapsulation Control**: Enforced a zero-leak policy where no raw CSS/XPath selectors or assertions are allowed within spec files. |
| **Gemini 3.5 Flash**<br>(Antigravity) | **Auth State Caching** | Playwright custom `authenticatedPage` fixture in `auth.fixtures.ts` saving local storage contexts. | **Session Optimization**: Decided to serialize auth states to `test-results/.auth/user.json` to bypass repetitive, high-latency UI sign-in steps in regression runs. |
| **Gemini 3.5 Flash**<br>(Antigravity) | **API Client Core** | `ApiClient.ts` REST CRUD client using Playwright's native `APIRequestContext`. | **Native Library Enforcements**: Rejected Axios/node-fetch dependencies in favor of native Playwright fetch mechanisms to reduce payload overhead. |
| **Gemini 3.5 Flash**<br>(Antigravity) | **Wait & Retry Engine** | Wait-poll utilities (`wait.ts`) and exponential backoff loops (`retry.ts`). | **Anti-Flakiness Standards**: Explicitly prohibited `page.waitForTimeout()` in the code to ensure we rely on dynamic conditions and stable assertions. |
| **Gemini 3.5 Flash**<br>(Antigravity) | **Test Spec Suites** | UI specs (login, dashboard, forms), API specs (auth, crud, error-handling), and hybrid integration specs. | **Validation & Assertions**: Verified all assertions test observable behavior, handle resource cleanup (`afterAll`), and assert response times (under 1000ms/2000ms). |
| **Gemini 3.5 Flash**<br>(Antigravity) | **CI/CD Orchestration** | GitHub Actions `.github/workflows/tests.yml` configuration utilizing 3-shard worker splits. | **Pipeline Selection (Option A)**: Selected push/PR CI gates over post-run analytics dashboards to provide immediate feedback to developers on every commit. |

---

## 💡 Engineering Commitments

1. **Pre-emptive Schema Guard**: Using Zod schemas at both the environment configuration layer and the API response assertion layer is an engineer-owned design choice. This protects the framework against silent contract changes.
2. **Resource Leaks Safeguard**: Every API spec implementing database writes incorporates an `afterAll` hook to register and delete resources. This maintains clean state isolation, even when assertions fail mid-suite.
3. **Traceability**: Enabled full HTML and Allure reporting, alongside automated video, screenshot, and console logs collection on failure, ensuring fast debugging of CI failures.
