# Railway Reservation System — OS Algorithm Visualizer
### Operating Systems Mini-Project & Interactive Laboratory

**Student Name:** Vaishnavi Satone  
**UID:** 24003164  
**Branch:** Computer Engineering, 5th Semester, Section B  
**Academic Year:** 2026–2027  

---

## 📌 Project Overview

**RailOS Visualizer** is a high-performance, interactive, educational web application created for the 5th Semester Operating Systems mini-project. It models how four core Operating Systems concepts govern the backend architecture of a large-scale railway reservation platform (inspired by Indian Railways / IRCTC):

1. **CPU Scheduling:** Deciding which passenger request (Train Search, Seat Check, Payment, Confirmation) gets CPU burst execution time, and for how long.
2. **Producer–Consumer Synchronization:** Coordinating how booking requests enter a shared bounded queue without data corruption or double-booking, managed via Dijkstra's Semaphores (`Mutex`, `Empty`, `Full`).
3. **Deadlock Avoidance using Banker’s Algorithm:** Dynamically validating resource allocations (Booking Slots, Payment Gateways, SMS Dispatchers) to guarantee the reservation system never enters an unsafe deadlock state.
4. **Memory Management (First Fit & Best Fit):** Allocating server RAM partitions to concurrent railway caching services and tracking both internal and external fragmentation.

---

## 🚀 Key Features

- **High-End Railway Technology Dashboard:** Modern dark navy, railway blue, white, and glowing teal command-center aesthetic.
- **Light & Dark Mode:** Accessible theme toggle with persistent `localStorage` preference.
- **Interactive Guided Demo (Viva Mode):** A dedicated presentation controller dock providing a 7-step walkthrough with exact speaking scripts tailored for external/internal examiners.
- **Bilingual Explanations:** Real-time toggling between natural English and Hinglish explanations for every module.
- **Teacher Speaking Scripts:** "🎓 How to Explain to My Teacher" button in every module providing ready-to-speak responses and anticipated viva questions.
- **Automated Verification Test Suite:** 9 live algorithmic unit tests that execute real mathematical assertions and report 100% PASS status.
- **Synthesized Audio Feedback:** Web Audio API sound generator providing subtle tactile feedback (no external sound files required).
- **Zero External Dependencies:** Built with pure semantic HTML5, modern CSS3 (Custom Properties & Flex/Grid), and modular ES6 JavaScript. Runs instantly in any browser.

---

## 🛠️ The Four OS Modules in Detail

### 1. CPU Scheduling Laboratory
- **Algorithms:**
  - **Round Robin (RR):** Cyclic preemptive scheduling with adjustable Time Quantum (e.g. 2 ms).
  - **Priority Scheduling (Non-Preemptive & Preemptive):** Priority 1 = Highest priority (critical operations like Payment Gateway).
- **Visuals & Tools:**
  - Animated multi-colored Gantt timeline with execution cursor and time markings.
  - Live Ready Queue tracker and step-by-step description card.
  - Calculated Metrics Table: Completion Time (CT), Turnaround Time ($TAT = CT - AT$), Waiting Time ($WT = TAT - BT$).
  - Summary stats: Average Turnaround Time, Average Waiting Time, and a comparative vertical bar chart.
- **Railway Tasks:**
  - $P_1$: Search Trains (Normal priority)
  - $P_2$: Check Seats (Medium priority)
  - $P_3$: Book Ticket (High priority)
  - $P_4$: Process Payment (Highest priority — VIP)
  - $P_5$: Confirm PNR (High priority)

---

### 2. Producer–Consumer Synchronization
- **The Concept:**
  - **Producer (Passenger Mobile/Web App):** Submits new ticket reservation requests into the queue.
  - **Shared Bounded Buffer:** Fixed-capacity queue (adjustable from 3 to 10 slots).
  - **Consumer (IRCTC Backend Booking Engine):** Dequeues requests, allocates berths, and confirms PNRs.
- **Semaphores & Rules:**
  - `Mutex` (Binary Semaphore = 1): Guarantees mutual exclusion so only one thread accesses the buffer at any instant.
  - `Empty` (Counting Semaphore = Capacity): Tracks free slots. Producer is BLOCKED when `Empty = 0` (Buffer Full).
  - `Full` (Counting Semaphore = 0): Tracks occupied bookings. Consumer is BLOCKED when `Full = 0` (Buffer Empty).
- **Visuals & Tools:**
  - Visual railway reservation cards showing Train Number, Train Name, Passenger Name, and Class.
  - Real-time Semaphore gauges and worker state tags (`IDLE`, `CRITICAL_SECTION`, `BLOCKED`).
  - Auto-run simulation mode and live Activity Log with timestamps.

---

### 3. Banker’s Algorithm (Deadlock Avoidance)
- **The Concept:**
  - Allocating three finite railway resources without deadlock:
    - **$R_1$:** Booking Server Threads
    - **$R_2$:** Payment Gateway Channels
    - **$R_3$:** SMS & PNR Dispatchers
- **Mathematical Formulations:**
  $$\text{Need}[i][j] = \text{Maximum}[i][j] - \text{Allocation}[i][j]$$
  $$\text{Condition to Allocate: } \text{Need}[i] \le \text{Work}$$
  $$\text{After Execution: } \text{Work} = \text{Work} + \text{Allocation}[i]$$
- **Visuals & Tools:**
  - Editable Allocation, Maximum, and dynamically calculated Need matrices.
  - Editable Available vector cards.
  - **Safe Sequence Banner:** Displays the valid execution sequence (e.g., $P_1 \rightarrow P_3 \rightarrow P_0 \rightarrow P_2 \rightarrow P_4$) in glowing green.
  - **Unsafe State Warning:** Detects when available resources cannot satisfy any remaining process, preventing circular wait.
  - One-click presets for Safe State and Unsafe State demonstrations.

---

### 4. Memory Management (First Fit & Best Fit)
- **The Concept:**
  - Assigning passenger services (Seat Layout Cache, PNR Lookup Index, Payment Tokens, Ticket PDF Generator) to server RAM blocks.
- **Algorithms:**
  - **First Fit:** Scans from Block 1 and allocates to the *first* partition that satisfies $\text{Block Size} \ge \text{Process Size}$. (Fastest execution).
  - **Best Fit:** Scans all partitions and allocates to the *smallest* partition that satisfies $\text{Block Size} \ge \text{Process Size}$. (Preserves large blocks).
- **Visuals & Tools:**
  - Segmented visual memory blocks displaying allocated processes, partition sizes, and leftover free holes.
  - RAM Utilization Gauge and metrics cards (Total, Allocated, Free).
  - Direct side-by-side comparison table between First Fit and Best Fit.
  - Explicit analysis of **Internal Fragmentation** vs **External Fragmentation**.

---

## 🧪 Automated Test Suite (100% Pass)

The project includes an in-browser test suite verifying the algorithms against standard computer science test cases:

| Test ID | Category | Test Name | Result |
|---|---|---|---|
| **TEST-01** | CPU Scheduling | Round Robin Calculation Test ($TQ = 2$) | **PASS** |
| **TEST-02** | CPU Scheduling | Non-Preemptive Priority Order Verification | **PASS** |
| **TEST-03** | Producer–Consumer | Buffer Full Semaphore Enforcement (`Empty = 0`) | **PASS** |
| **TEST-04** | Producer–Consumer | Buffer Empty Semaphore Enforcement (`Full = 0`) | **PASS** |
| **TEST-05** | Banker’s Algorithm | Safe State & Sequence Resolution ($P_1 \rightarrow P_3 \dots$) | **PASS** |
| **TEST-06** | Banker’s Algorithm | Unsafe State (Deadlock Threat) Detection | **PASS** |
| **TEST-07** | Memory Management | First Fit Strategy Selection | **PASS** |
| **TEST-08** | Memory Management | Best Fit Minimal Leftover Hole Allocation | **PASS** |
| **TEST-09** | Input Validation | Banker Matrix Validation ($\text{Alloc} > \text{Max}$ Error Catch) | **PASS** |

---

## 💻 How to Run the Project Locally

### Option 1: Direct File Launch
Simply double-click `index.html` in your file explorer to open the project in Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave.

### Option 2: Local HTTP Server (Recommended)
Using Python (pre-installed on most systems):
```bash
python -m http.server 8080
```
Then navigate to `http://localhost:8080` in your browser.

Using Node.js / npx:
```bash
npx serve .
```

---

## 🎓 Teacher Viva Presentation Guide (Quick Cheat Sheet)

| Question | Short Answer for Examiner |
|---|---|
| **Why Round Robin in Railways?** | RR gives every passenger equal time slices so long searches don't freeze quick payment confirmations. |
| **What does Mutex do in Producer-Consumer?** | Mutex enforces mutual exclusion so two threads never modify the seat queue simultaneously, preventing double-booking. |
| **Is an Unsafe State equal to Deadlock?** | **No!** An unsafe state means deadlock is *possible* if all processes claim maximum needs at once, but deadlock has not necessarily occurred yet. |
| **First Fit vs Best Fit — which is better?** | Neither is universally better. First Fit is faster with less search overhead; Best Fit leaves smaller holes but can create unusable external fragments. |
| **How to eliminate External Fragmentation?** | By using **Paging** (non-contiguous memory allocation with fixed frames) or **Memory Compaction**. |

---

*Submitted by Vaishnavi Satone (UID: 24003164) for Computer Engineering 5th Semester Mini-Project Examination.*
