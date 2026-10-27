/**
 * RailOS Interactive Guided Demo & Teacher Viva Controller
 * Provides an on-screen interactive walk-through for examination presentation
 */

class GuidedDemo {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;

    this.steps = [
      {
        stepNumber: 1,
        title: 'CPU Scheduling — Round Robin Simulation',
        targetTab: 'cpu',
        instruction: 'Click "Round Robin", ensure Time Quantum = 2, and click "▶ Run Simulation".',
        autoAction: () => {
          if (window.app) window.app.switchTab('cpu');
          if (window.cpuScheduler) {
            window.cpuScheduler.setAlgorithm('rr');
            window.cpuScheduler.setTimeQuantum(2);
            window.cpuScheduler.loadSampleTasks('default');
            if (window.app) window.app.renderCPU();
          }
        },
        observe: 'Watch how each railway task executes for up to 2 ms before being preempted to the back of the Ready Queue. Observe the animated timeline filling up.',
        teacherScript: '"Good morning Ma\'am/Sir. In this first module, we model how IRCTC CPU cores schedule simultaneous user requests. Here, Round Robin ensures fair time-sharing so that long tasks like Train Search do not block quick tasks like Payment."'
      },
      {
        stepNumber: 2,
        title: 'CPU Scheduling — Gantt Chart & Waiting Time Metrics',
        targetTab: 'cpu',
        instruction: 'Examine the calculated Completion Time (CT), Turnaround Time (TAT), and Waiting Time (WT) table below the Gantt chart.',
        autoAction: () => {
          if (window.app) window.app.switchTab('cpu');
          const resultsSec = document.getElementById('cpu-results-section');
          if (resultsSec) resultsSec.scrollIntoView({ behavior: 'smooth' });
        },
        observe: 'Verify mathematical accuracy: Turnaround Time = CT − AT, and Waiting Time = TAT − BT. Notice the comparative waiting time bar chart.',
        teacherScript: '"As you can see from the results table, Turnaround Time is Completion Time minus Arrival Time, and Waiting Time is Turnaround minus Burst. The average waiting time for this passenger workload is clearly displayed and verified."'
      },
      {
        stepNumber: 3,
        title: 'CPU Scheduling — Priority Scheduling',
        targetTab: 'cpu',
        instruction: 'Select "Priority (Non-Preemptive)" or "Priority (Preemptive)", then click "▶ Run Simulation".',
        autoAction: () => {
          if (window.app) window.app.switchTab('cpu');
          if (window.cpuScheduler) {
            window.cpuScheduler.setAlgorithm('priority_non_preempt');
            window.cpuScheduler.loadSampleTasks('default');
            if (window.app) window.app.renderCPU();
          }
        },
        observe: 'Observe that P4 (Process Payment, Priority 1 = Highest) takes precedence over lower-priority train searching tasks.',
        teacherScript: '"Now switching to Priority Scheduling, we treat Priority 1 as highest. In a real railway system, critical banking and seat-locking tasks must run ahead of general browse queries to prevent customer session expiration."'
      },
      {
        stepNumber: 4,
        title: 'Producer–Consumer — Semaphores & Queue Buffer',
        targetTab: 'pc',
        instruction: 'Click "Add Booking" repeatedly until buffer is full (5/5), then click "Process Booking" until empty.',
        autoAction: () => {
          if (window.app) window.app.switchTab('pc');
          if (window.producerConsumer) {
            window.producerConsumer.reset();
            if (window.app) window.app.renderPC();
          }
        },
        observe: 'When buffer is full (Empty = 0), Producer gets BLOCKED. When empty (Full = 0), Consumer gets BLOCKED. Mutex binary lock protects shared array access.',
        teacherScript: '"In Module 2, passengers act as Producers submitting ticket requests into a bounded queue buffer, while booking engines act as Consumers. Semaphores Empty, Full, and Mutex prevent race conditions such as duplicate ticket generation."'
      },
      {
        stepNumber: 5,
        title: 'Banker’s Algorithm — Safe vs Unsafe State (Deadlock Avoidance)',
        targetTab: 'banker',
        instruction: 'First click "Load Safe Example" and "Check Safe State". Then click "Load Unsafe Example" and test again.',
        autoAction: () => {
          if (window.app) window.app.switchTab('banker');
          if (window.bankersAlgorithm) {
            window.bankersAlgorithm.loadPreset('safe');
            window.bankersAlgorithm.checkSafety();
            if (window.app) window.app.renderBanker();
          }
        },
        observe: 'In safe state, a valid sequence (P1 ➔ P3 ➔ P4 ➔ P0 ➔ P2) guarantees zero deadlocks. In unsafe state, no sequence exists, warning the administrator.',
        teacherScript: '"In Module 3, Banker\'s Algorithm checks if allocating Booking Slots, Payment Channels, and SMS Dispatchers keeps the system in a Safe State. Importantly, an unsafe state does not mean deadlock has already occurred, but rather that deadlock cannot be avoided if processes request their maximum needs."'
      },
      {
        stepNumber: 6,
        title: 'Memory Management — First Fit vs Best Fit',
        targetTab: 'memory',
        instruction: 'Toggle between "First Fit" and "Best Fit" algorithms and examine the memory block layouts.',
        autoAction: () => {
          if (window.app) window.app.switchTab('memory');
          if (window.memoryManagement) {
            window.memoryManagement.loadPreset('default');
            if (window.app) window.app.renderMemory();
          }
        },
        observe: 'First Fit places tasks in the first partition that fits. Best Fit searches all blocks to find the tightest fit, preserving larger partitions for large tasks.',
        teacherScript: '"In Module 4, we allocate server memory to passenger services. First Fit is faster with less search overhead, whereas Best Fit minimizes leftover block holes. We also track Internal and External fragmentation accurately."'
      },
      {
        stepNumber: 7,
        title: 'Test Suite & Conclusion',
        targetTab: 'tests',
        instruction: 'Open the Test Cases tab and click "▶ Run All Test Cases" to run live automated verification.',
        autoAction: () => {
          if (window.app) window.app.switchTab('tests');
          if (window.testSuite) {
            window.testSuite.runAll();
            if (window.app) window.app.renderTests();
          }
        },
        observe: 'All 9 algorithmic unit tests evaluate live and report 100% PASS with execution durations in milliseconds.',
        teacherScript: '"To conclude my project demonstration, this automated test suite verifies all mathematical outputs and edge cases across all four OS modules. Thank you, Ma\'am/Sir! I am ready for any questions."'
      }
    ];
  }

  start() {
    this.isActive = true;
    this.currentStep = 0;
    this.applyStep();
  }

  stop() {
    this.isActive = false;
    const modal = document.getElementById('guided-demo-overlay');
    if (modal) modal.style.display = 'none';
  }

  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.applyStep();
    } else {
      this.stop();
    }
  }

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.applyStep();
    }
  }

  applyStep() {
    const step = this.steps[this.currentStep];
    if (!step) return;

    if (step.autoAction) {
      step.autoAction();
    }

    if (window.soundFx) window.soundFx.step();
    this.renderOverlay();
  }

  renderOverlay() {
    let overlay = document.getElementById('guided-demo-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'guided-demo-overlay';
      overlay.className = 'guided-demo-dock';
      document.body.appendChild(overlay);
    }

    const step = this.steps[this.currentStep];
    const isFirst = this.currentStep === 0;
    const isLast = this.currentStep === this.steps.length - 1;

    overlay.style.display = 'block';
    overlay.innerHTML = `
      <div class="demo-dock-content">
        <div class="demo-dock-header">
          <div class="demo-dock-badge">
            <span class="live-dot"></span> VIVA DEMO MODE &bull; Step ${step.stepNumber} of ${this.steps.length}
          </div>
          <button class="btn-icon demo-close-btn" onclick="window.guidedDemo.stop()" title="Exit Demo Mode">✕</button>
        </div>

        <div class="demo-dock-body">
          <h4 class="demo-dock-title">${step.title}</h4>
          
          <div class="demo-dock-instruction">
            <strong>👉 What to do:</strong> ${step.instruction}
          </div>

          <div class="demo-dock-observe">
            <strong>👀 What to observe:</strong> ${step.observe}
          </div>

          <div class="demo-dock-script">
            <div class="script-header">
              <span class="script-icon">🗣️</span>
              <strong>Say to Teacher / Examiner:</strong>
            </div>
            <p class="script-text">${step.teacherScript}</p>
          </div>
        </div>

        <div class="demo-dock-footer">
          <button class="btn btn-sm btn-outline" onclick="window.guidedDemo.prev()" ${isFirst ? 'disabled' : ''}>← Previous</button>
          <div class="demo-progress-dots">
            ${this.steps.map((s, idx) => `<span class="demo-dot ${idx === this.currentStep ? 'active' : (idx < this.currentStep ? 'completed' : '')}"></span>`).join('')}
          </div>
          <button class="btn btn-sm btn-primary" onclick="window.guidedDemo.next()">${isLast ? 'Finish Demo 🎉' : 'Next Step →'}</button>
        </div>
      </div>
    `;
  }
}

window.guidedDemo = new GuidedDemo();
