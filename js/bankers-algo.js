/**
 * RailOS Banker's Algorithm Deadlock Avoidance Laboratory
 * Real-time calculation of Need Matrix, Safe Sequence, and Step-by-Step execution
 */

class BankersAlgorithm {
  constructor() {
    this.resourceNames = [
      { id: 'R1', name: 'Booking Slots', icon: '🎫', desc: 'IRCTC Booking Server Threads' },
      { id: 'R2', name: 'Payment Gateways', icon: '💳', desc: 'Secure Banking Payment Channels' },
      { id: 'R3', name: 'SMS Dispatchers', icon: '📱', desc: 'PNR Confirmation SMS Engines' }
    ];

    this.processNames = [
      'P0: Tatkal Booking Bot',
      'P1: VIP Quota Allocation',
      'P2: General Counter Booking',
      'P3: Foreign Tourist Quota',
      'P4: Bulk Group Booking'
    ];

    this.numProcesses = 5;
    this.numResources = 3;

    // Classic Safe State Matrix Preset
    this.safePreset = {
      available: [3, 3, 2],
      allocation: [
        [0, 1, 0], // P0
        [2, 0, 0], // P1
        [3, 0, 2], // P2
        [2, 1, 1], // P3
        [0, 0, 2]  // P4
      ],
      maximum: [
        [7, 5, 3], // P0
        [3, 2, 2], // P1
        [9, 0, 2], // P2
        [2, 2, 2], // P3
        [4, 3, 3]  // P4
      ]
    };

    // Unsafe State Matrix Preset (leads to deadlock threat)
    this.unsafePreset = {
      available: [1, 0, 0],
      allocation: [
        [1, 1, 0], // P0
        [2, 0, 1], // P1
        [3, 0, 2], // P2
        [2, 1, 1], // P3
        [0, 0, 2]  // P4
      ],
      maximum: [
        [7, 5, 3], // P0
        [3, 2, 2], // P1
        [9, 0, 2], // P2
        [4, 2, 2], // P3
        [5, 3, 3]  // P4
      ]
    };

    // Active state
    this.available = [];
    this.allocation = [];
    this.maximum = [];
    this.need = [];

    // Step-by-step state
    this.steps = [];
    this.currentStepIdx = -1;
    this.safeSequence = [];
    this.isSafe = null;
    this.activeCheckProcess = null;
    this.workVector = [];
    this.finishedSet = new Set();

    this.loadPreset('safe');
  }

  loadPreset(type = 'safe') {
    const src = type === 'safe' ? this.safePreset : this.unsafePreset;
    this.available = [...src.available];
    this.allocation = src.allocation.map(row => [...row]);
    this.maximum = src.maximum.map(row => [...row]);
    this.calculateNeed();
    this.resetStepState();
  }

  calculateNeed() {
    this.need = [];
    for (let i = 0; i < this.numProcesses; i++) {
      const row = [];
      for (let j = 0; j < this.numResources; j++) {
        // Need[i][j] = Max[i][j] - Alloc[i][j]
        const maxVal = this.maximum[i] ? this.maximum[i][j] : 0;
        const allocVal = this.allocation[i] ? this.allocation[i][j] : 0;
        row.push(Math.max(0, maxVal - allocVal));
      }
      this.need.push(row);
    }
  }

  updateAllocation(pIdx, rIdx, val) {
    val = Math.max(0, parseInt(val) || 0);
    if (this.allocation[pIdx]) {
      this.allocation[pIdx][rIdx] = val;
      this.calculateNeed();
      this.resetStepState();
    }
  }

  updateMaximum(pIdx, rIdx, val) {
    val = Math.max(0, parseInt(val) || 0);
    if (this.maximum[pIdx]) {
      this.maximum[pIdx][rIdx] = val;
      this.calculateNeed();
      this.resetStepState();
    }
  }

  updateAvailable(rIdx, val) {
    val = Math.max(0, parseInt(val) || 0);
    this.available[rIdx] = val;
    this.resetStepState();
  }

  resetStepState() {
    this.steps = [];
    this.currentStepIdx = -1;
    this.safeSequence = [];
    this.isSafe = null;
    this.activeCheckProcess = null;
    this.workVector = [...this.available];
    this.finishedSet = new Set();
  }

  /**
   * Validate matrices to make sure Allocation <= Maximum
   */
  validate() {
    for (let i = 0; i < this.numProcesses; i++) {
      for (let j = 0; j < this.numResources; j++) {
        if (this.allocation[i][j] > this.maximum[i][j]) {
          return {
            valid: false,
            error: `Invalid input: Process P${i} has Allocation of ${this.resourceNames[j].id} (${this.allocation[i][j]}) greater than Maximum (${this.maximum[i][j]})!`
          };
        }
      }
    }
    return { valid: true };
  }

  /**
   * Runs the complete Safety Algorithm and generates step-by-step trace
   */
  checkSafety() {
    const val = this.validate();
    if (!val.valid) {
      this.isSafe = false;
      this.safeSequence = [];
      return { success: false, error: val.error };
    }

    this.calculateNeed();
    this.steps = [];
    const work = [...this.available];
    const finish = new Array(this.numProcesses).fill(false);
    const seq = [];

    this.steps.push({
      step: 0,
      title: 'Initialization',
      process: null,
      work: [...work],
      finish: [...finish],
      seq: [],
      reason: `Safety Algorithm initiated. Work vector initialized to Available: [${work.join(', ')}]. All processes marked Finish = false.`
    });

    let count = 0;
    while (count < this.numProcesses) {
      let found = false;

      for (let p = 0; p < this.numProcesses; p++) {
        if (!finish[p]) {
          // Check if Need[p] <= Work
          let canAllocate = true;
          for (let j = 0; j < this.numResources; j++) {
            if (this.need[p][j] > work[j]) {
              canAllocate = false;
              break;
            }
          }

          if (canAllocate) {
            // Process can finish
            const oldWork = [...work];
            for (let j = 0; j < this.numResources; j++) {
              work[j] += this.allocation[p][j];
            }
            finish[p] = true;
            seq.push(`P${p}`);
            found = true;
            count++;

            this.steps.push({
              step: this.steps.length,
              title: `Execute P${p}`,
              process: p,
              work: [...work],
              oldWork,
              finish: [...finish],
              seq: [...seq],
              canAllocate: true,
              need: [...this.need[p]],
              alloc: [...this.allocation[p]],
              reason: `Process P${p} Need [${this.need[p].join(', ')}] ≤ Work [${oldWork.join(', ')}]. Resources allocated! P${p} finishes and releases its allocated resources [${this.allocation[p].join(', ')}]. New Work: [${work.join(', ')}].`
            });

            break; // Restart loop to check all unfinished processes again
          } else {
            // Cannot satisfy Need currently
            this.steps.push({
              step: this.steps.length,
              title: `Evaluate P${p}`,
              process: p,
              work: [...work],
              finish: [...finish],
              seq: [...seq],
              canAllocate: false,
              need: [...this.need[p]],
              alloc: [...this.allocation[p]],
              reason: `Process P${p} Need [${this.need[p].join(', ')}] > Work [${work.join(', ')}]. Cannot safely allocate. Moving to check next process.`
            });
          }
        }
      }

      if (!found) {
        break; // Deadlock or unsafe state detected
      }
    }

    const allFinished = finish.every(f => f === true);
    this.isSafe = allFinished;
    this.safeSequence = seq;

    this.steps.push({
      step: this.steps.length,
      title: allFinished ? 'System is in SAFE STATE' : 'System is in UNSAFE STATE',
      process: null,
      work: [...work],
      finish: [...finish],
      seq: [...seq],
      isSafe: allFinished,
      reason: allFinished
        ? `✅ Success! A Safe Sequence [${seq.join(' ➔ ')}] exists. The system can satisfy all resource requests without entering a deadlock.`
        : `⚠️ Warning! No safe sequence could be found. Remaining processes cannot be satisfied with available resources. System is in an UNSAFE STATE (potential deadlock hazard).`
    });

    return {
      success: true,
      isSafe: allFinished,
      safeSequence: seq,
      steps: this.steps
    };
  }

  stepForward() {
    if (this.steps.length === 0) {
      this.checkSafety();
      this.currentStepIdx = 0;
    } else if (this.currentStepIdx < this.steps.length - 1) {
      this.currentStepIdx++;
    }
    return this.getCurrentStep();
  }

  getCurrentStep() {
    if (this.currentStepIdx === -1 || !this.steps[this.currentStepIdx]) {
      return {
        title: 'Ready to Check Safety',
        reason: 'Click "Check Safe State" or "Run Step-by-Step" to evaluate resource allocation.',
        work: [...this.available],
        seq: [],
        process: null
      };
    }
    return this.steps[this.currentStepIdx];
  }

  /**
   * Bilingual explanation
   */
  getExplanation() {
    const en = `
      <p><strong>1. What does Banker's Algorithm do?</strong><br>
      Developed by Edsger Dijkstra, Banker’s Algorithm is a <em>deadlock avoidance</em> algorithm. Before allocating any resource, the OS simulates the allocation to test if the system remains in a <strong>Safe State</strong> (a state where at least one execution sequence exists that allows every process to complete without deadlocking).</p>

      <p><strong>2. Understanding the Matrices in Railway Terms:</strong><br>
      - <strong>R1, R2, R3:</strong> Railway resources: <em>Booking Threads</em>, <em>Payment Gateways</em>, and <em>SMS Confirmation Engines</em>.<br>
      - <strong>Allocation Matrix:</strong> Resources currently locked/held by each process.<br>
      - <strong>Maximum Matrix:</strong> Worst-case maximum resources each process might ever ask for before completing its booking.<br>
      - <strong>Need Matrix:</strong> Calculated as <code>Need = Maximum − Allocation</code>. Represents remaining resources each process still needs to finish.<br>
      - <strong>Available Vector:</strong> Unallocated free resources currently in the pool.</p>

      <p><strong>3. Step-by-Step Logic:</strong><br>
      1. Set <code>Work = Available</code>.<br>
      2. Find an unfinished process <code>Pi</code> such that <code>Need[i] ≤ Work</code>.<br>
      3. If found, pretend <code>Pi</code> completes: <code>Work = Work + Allocation[i]</code>, mark <code>Finish[i] = true</code>, append <code>Pi</code> to Safe Sequence.<br>
      4. Repeat until all processes finish (Safe State) or no process can be satisfied (Unsafe State).</p>

      <p><strong>4. Critical Distinction (Viva Favorite Question!):</strong><br>
      <em>Is an Unsafe State equal to a Deadlock?</em> <strong>No!</strong> An unsafe state merely indicates that the system cannot guarantee that a deadlock will NOT happen if all processes demand their maximum resources simultaneously. A deadlock is a subset of unsafe states.</p>
    `;

    const hi = `
      <p><strong>1. Banker's Algorithm kya karta hai?</strong><br>
      Ye ek <em>Deadlock Avoidance</em> algorithm hai. Kisi bhi process ko resource assign karne se pehle ye check karta hai ki system Safe State mein rahega ya nahi.</p>

      <p><strong>2. Formulas aur Matrices (Viva Cheat Sheet):</strong><br>
      - <code>Need = Maximum − Allocation</code> (Har process ko finish hone ke liye kitne aur resources chahiye).<br>
      - <code>Work = Available</code> (Suru mein free resources ke barabar hota hai).<br>
      - Agar kisi process ka <code>Need ≤ Work</code> ho jaye, toh hum maan lete hain ki wo process successfully execute hokar apne saare pakde hue resources release kar dega (<code>Work = Work + Allocation</code>).</p>

      <p><strong>3. Safe Sequence vs Deadlock:</strong><br>
      Agar sabhi processes kisi order mein safely finish ho jayein (jaise <strong>P1 ➔ P3 ➔ P4 ➔ P0 ➔ P2</strong>), toh system Safe State mein hai.<br>
      Agar koi process pura na ho sake, toh system <strong>Unsafe State</strong> mein chala jata hai.</p>

      <p><strong>4. Examiner ko kya bolna hai?</strong><br>
      "Sir, Railway booking mein agar hum limited payment gateways bina safety check ke sabhi users ko aadha-aadha baant denge, toh koi bhi payment complete nahi hogi aur circular wait (deadlock) ho jayega. Banker's algorithm ensure karta hai ki resources safely allocate hon."</p>
    `;

    return { en, hi };
  }
}

window.BankersAlgorithm = BankersAlgorithm;
window.bankersAlgorithm = new BankersAlgorithm();
