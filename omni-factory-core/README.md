# Omni-Factory: The Ultimate Satisfactory Calculator

**Welcome, Director.**
You have assumed command of the FICSIT Omni-Factory project. This tool is designed to optimize production chains with ruthless efficiency.

## 🚀 Features
*   **Production Wizard**: Auto-generate full factory chains from a single target item.
*   **Intelligent Recycling**: Automatically detects and closes loop dependencies (e.g. Water, Fuel).
*   **Construction Dashboard**: Real-time Machine counts, Bill of Materials, and Power Audits.
*   **Overclocking Matrix**: Fine-tune individual nodes (1% - 250%) to save space and power.
*   **Global Policies**: Batch-update recipes across the entire factory.

## 🛠 Troubleshooting Protocol
If the system becomes unstable, follow these FICSIT-mandated procedures:

### 1. Hydration Mismatch
*   **Symptom**: "Text content does not match server-rendered HTML".
*   **Cause**: LocalStorage state differs from server initial state.
*   **Fix**: The application uses a `useStore` hook to mitigate this. If it persists, refresh the page.

### 2. Infinite Render Loop
*   **Symptom**: The browser tab freezes or crashes.
*   **Cause**: Improper state selection in Zustand hooks creating new object references on every render.
*   **Fix**: Ensure `useFactoryStore` selectors pick atomic values (e.g., `state.nodes`) rather than returning new objects.

### 3. "System Failure" Screen
*   **Symptom**: A red "FICSIT SYSTEM FAILURE" screen appears.
*   **Fix**: Click the **"INITIATE FACTORY RESET"** button. This will clear corrupted LocalStorage data and reload the application.

### 4. Next.js Version Mismatch
*   **Symptom**: Odd build errors or missing features.
*   **Fix**: Run `npm install next@latest` to align dependencies.

## 📦 Tech Stack
*   **Framework**: Next.js 14 (App Router)
*   **State**: Zustand (w/ Persistence)
*   **Visuals**: React Flow, Tailwind CSS, Lucide Icons
*   **Logic**: Custom LP Solver & Graph Algorithms

---
*Compliance is mandatory. Efficiency is key.*
