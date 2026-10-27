/**
 * RailOS CPU Scheduling Laboratory
 * Round Robin & Priority Scheduling with accurate Gantt calculations
 */

class CPUScheduler {
  constructor() {
    this.processes = [];
    this.algorithm = 'rr'; // 'rr', 'priority_non_preempt', 'priority_preempt'
    this.timeQuantum = 2;
    this.priorityOrder = 'lower_higher'; // 1 = highest priority

    // Simulation state
    this.timeline = []; // [{ pid, name, color, start, end }]
    this.steps = []; // Detailed step-by-step snapshots
    this.currentStepIndex = -1;
    this.isPlaying = false;
    this.playbackTimer = null;
    this.playbackSpeed = 800; // ms per step

    this.results = []; // [{ pid, name, at, bt, priority, ct, tat, wt }]
    this.stats = { avgTAT: 0, avgWT: 0, cpuUtilization: 100 };

    this.defaultRailwayTasks = [
      { id: 'P1', name: 'Search Trains', at: 0, bt: 5, priority: 3, color: '#3a86ff' },
      { id: 'P2', name: 'Check Seats', at: 1, bt: 3, priority: 2, color: '#06d6a0' },
      { id: 'P3', name: 'Book Ticket', at: 2, bt: 6, priority: 2, color: '#ffbe0b' },
      { id: 'P4', name: 'Process Payment', at: 3, bt: 2, priority: 1, color: '#ef476f' },
      { id: 'P5', name: 'Confirm PNR', at: 4, bt: 4, priority: 3, color: '#8338ec' },
    ];

    this.loadSampleTasks();
  }

  loadSampleTasks(type = 'default') {
    if (type === 'tatkal') {
      this.processes = [
        { id: 'P1', name: 'Tatkal Login Auth', at: 0, bt: 4, priority: 2, color: '#3a86ff' },
        { id: 'P2', name: 'Captcha Verification', at: 1, bt: 2, priority: 1, color: '#06d6a0' },
        { id: 'P3', name: 'Payment UPI Hold', at: 2, bt: 3, priority: 1, color: '#ef476f' },
        { id: 'P4', name: 'Seat Quota Lock', at: 3, bt: 5, priority: 2, color: '#ffbe0b' },
        { id: 'P5', name: 'Ticket SMS Dispatch', at: 5, bt: 2, priority: 3, color: '#8338ec' }
      ];
    } else if (type === 'equal_arrival') {
      this.processes = [
        { id: 'P1', name: 'Search Trains', at: 0, bt: 4, priority: 3, color: '#3a86ff' },
        { id: 'P2', name: 'Check Seats', at: 0, bt: 3, priority: 2, color: '#06d6a0' },
        { id: 'P3', name: 'Book Ticket', at: 0, bt: 5, priority: 4, color: '#ffbe0b' },
        { id: 'P4', name: 'Process Payment', at: 0, bt: 2, priority: 1, color: '#ef476f' },
        { id: 'P5', name: 'Confirm PNR', at: 0, bt: 4, priority: 2, color: '#8338ec' }
      ];
    } else {
      this.processes = JSON.parse(JSON.stringify(this.defaultRailwayTasks));
    }
    this.resetSimulation();
  }

  addProcess(name = 'New Railway Task', at = 0, bt = 3, priority = 2) {
    const nextNum = this.processes.length + 1;
    const colors = ['#3a86ff', '#06d6a0', '#ffbe0b', '#ef476f', '#8338ec', '#fb5607', '#118ab2', '#073b4c'];
    const color = colors[(nextNum - 1) % colors.length];
    this.processes.push({
      id: `P${nextNum}`,
      name: name || `Task P${nextNum}`,
      at: parseInt(at) || 0,
      bt: Math.max(1, parseInt(bt) || 1),
      priority: parseInt(priority) || 1,
      color
    });
    this.resetSimulation();
  }

  removeProcess(index) {
    if (this.processes.length <= 1) return;
    this.processes.splice(index, 1);
    this.resetSimulation();
  }

  updateProcess(index, field, value) {
    if (!this.processes[index]) return;
    if (field === 'at') this.processes[index].at = Math.max(0, parseInt(value) || 0);
    if (field === 'bt') this.processes[index].bt = Math.max(1, parseInt(value) || 1);
    if (field === 'priority') this.processes[index].priority = Math.max(1, parseInt(value) || 1);
    if (field === 'name') this.processes[index].name = value;
    this.resetSimulation();
  }

  setTimeQuantum(q) {
    this.timeQuantum = Math.max(1, parseInt(q) || 1);
    this.resetSimulation();
  }

  setAlgorithm(algo) {
    this.algorithm = algo;
    this.resetSimulation();
  }

  /**
   * Run pure algorithm calculation to generate timeline, metrics, and step snapshots
   */
  calculate() {
    if (this.processes.length === 0) return;

    if (this.algorithm === 'rr') {
      this.calculateRoundRobin();
    } else if (this.algorithm === 'priority_non_preempt') {
      this.calculatePriorityNonPreemptive();
    } else if (this.algorithm === 'priority_preempt') {
      this.calculatePriorityPreemptive();
    }

    this.calculateMetrics();
  }

  calculateRoundRobin() {
    this.timeline = [];
    this.steps = [];

    // Clone processes
    const n = this.processes.length;
    const remBt = {};
    const procMap = {};
    this.processes.forEach(p => {
      remBt[p.id] = p.bt;
      procMap[p.id] = p;
    });

    let currentTime = 0;
    const readyQueue = [];
    const completed = new Set();
    const arrived = new Set();

    // Check who arrives at time 0
    const checkArrivals = (t) => {
      // Sort newly arrived by arrival time, then id
      const newlyArrived = this.processes
        .filter(p => p.at <= t && !arrived.has(p.id))
        .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));

      newlyArrived.forEach(p => {
        arrived.add(p.id);
        readyQueue.push(p.id);
      });
    };

    checkArrivals(0);

    // Initial state snapshot
    this.steps.push({
      time: 0,
      activePid: null,
      readyQueue: [...readyQueue],
      completed: Array.from(completed),
      description: `Simulation initialized at T = 0. Arrived processes added to Ready Queue: [${readyQueue.join(', ') || 'None'}].`
    });

    while (completed.size < n) {
      if (readyQueue.length === 0) {
        // CPU Idle
        const nextArrival = this.processes
          .filter(p => !arrived.has(p.id))
          .sort((a, b) => a.at - b.at)[0];

        if (nextArrival) {
          const idleStart = currentTime;
          currentTime = nextArrival.at;
          this.timeline.push({
            pid: 'IDLE',
            name: 'CPU Idle',
            color: 'rgba(150, 150, 150, 0.25)',
            start: idleStart,
            end: currentTime,
            duration: currentTime - idleStart
          });
          checkArrivals(currentTime);
          this.steps.push({
            time: currentTime,
            activePid: 'IDLE',
            readyQueue: [...readyQueue],
            completed: Array.from(completed),
            description: `CPU was IDLE from T = ${idleStart} to T = ${currentTime}. Now ${nextArrival.id} has arrived.`
          });
          continue;
        } else {
          break; // safety break
        }
      }

      const currentPid = readyQueue.shift();
      const p = procMap[currentPid];
      const executeTime = Math.min(this.timeQuantum, remBt[currentPid]);
      const startTime = currentTime;
      currentTime += executeTime;
      remBt[currentPid] -= executeTime;

      this.timeline.push({
        pid: p.id,
        name: p.name,
        color: p.color,
        start: startTime,
        end: currentTime,
        duration: executeTime,
        remBefore: remBt[currentPid] + executeTime,
        remAfter: remBt[currentPid]
      });

      // While current process was executing, new processes might have arrived
      checkArrivals(currentTime);

      if (remBt[currentPid] === 0) {
        completed.add(currentPid);
        p.ct = currentTime;
        this.steps.push({
          time: currentTime,
          activePid: currentPid,
          readyQueue: [...readyQueue],
          completed: Array.from(completed),
          description: `${p.id} (${p.name}) finished execution at T = ${currentTime}! Completion Time (CT) recorded.`
        });
      } else {
        // Put back in ready queue
        readyQueue.push(currentPid);
        this.steps.push({
          time: currentTime,
          activePid: currentPid,
          readyQueue: [...readyQueue],
          completed: Array.from(completed),
          description: `${p.id} executed for quantum of ${executeTime} units (Remaining: ${remBt[currentPid]}). Preempted & moved to back of Ready Queue.`
        });
      }
    }
  }

  calculatePriorityNonPreemptive() {
    this.timeline = [];
    this.steps = [];

    const n = this.processes.length;
    const completed = new Set();
    let currentTime = 0;

    // Snapshot at 0
    this.steps.push({
      time: 0,
      activePid: null,
      readyQueue: [],
      completed: [],
      description: 'Simulation started for Non-Preemptive Priority Scheduling (Priority 1 = Highest).'
    });

    while (completed.size < n) {
      // Find available processes
      const available = this.processes.filter(p => p.at <= currentTime && !completed.has(p.id));

      if (available.length === 0) {
        // Find next process to arrive
        const nextArrival = this.processes.filter(p => !completed.has(p.id)).sort((a, b) => a.at - b.at)[0];
        const idleStart = currentTime;
        currentTime = nextArrival.at;
        this.timeline.push({
          pid: 'IDLE',
          name: 'CPU Idle',
          color: 'rgba(150, 150, 150, 0.25)',
          start: idleStart,
          end: currentTime,
          duration: currentTime - idleStart
        });
        this.steps.push({
          time: currentTime,
          activePid: 'IDLE',
          readyQueue: [],
          completed: Array.from(completed),
          description: `CPU was IDLE from T = ${idleStart} to T = ${currentTime} awaiting process arrival.`
        });
        continue;
      }

      // Select highest priority (lowest number)
      available.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.at - b.at; // Tie-breaker: FCFS
      });

      const selected = available[0];
      const start = currentTime;
      currentTime += selected.bt;
      selected.ct = currentTime;
      completed.add(selected.id);

      this.timeline.push({
        pid: selected.id,
        name: selected.name,
        color: selected.color,
        start,
        end: currentTime,
        duration: selected.bt
      });

      this.steps.push({
        time: currentTime,
        activePid: selected.id,
        readyQueue: available.slice(1).map(p => p.id),
        completed: Array.from(completed),
        description: `${selected.id} (Priority: ${selected.priority}) ran from T = ${start} to T = ${currentTime} until completion.`
      });
    }
  }

  calculatePriorityPreemptive() {
    this.timeline = [];
    this.steps = [];

    const n = this.processes.length;
    const remBt = {};
    const procMap = {};
    this.processes.forEach(p => {
      remBt[p.id] = p.bt;
      procMap[p.id] = p;
    });

    let currentTime = 0;
    const completed = new Set();
    let currentExecuting = null;
    let blockStart = 0;

    const maxTime = 1000; // safety ceiling

    while (completed.size < n && currentTime < maxTime) {
      // Find available arrived processes
      const available = this.processes.filter(p => p.at <= currentTime && !completed.has(p.id));

      if (available.length === 0) {
        if (currentExecuting) {
          // Flush current block
          this.timeline.push({
            pid: currentExecuting.id,
            name: currentExecuting.name,
            color: currentExecuting.color,
            start: blockStart,
            end: currentTime,
            duration: currentTime - blockStart
          });
          currentExecuting = null;
        }

        const nextP = this.processes.filter(p => !completed.has(p.id)).sort((a, b) => a.at - b.at)[0];
        if (nextP) {
          const idleStart = currentTime;
          currentTime = nextP.at;
          this.timeline.push({
            pid: 'IDLE',
            name: 'CPU Idle',
            color: 'rgba(150, 150, 150, 0.25)',
            start: idleStart,
            end: currentTime,
            duration: currentTime - idleStart
          });
          continue;
        }
      }

      // Pick highest priority available
      available.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.at - b.at;
      });

      const best = available[0];

      if (currentExecuting && currentExecuting.id !== best.id) {
        // Preempt current!
        this.timeline.push({
          pid: currentExecuting.id,
          name: currentExecuting.name,
          color: currentExecuting.color,
          start: blockStart,
          end: currentTime,
          duration: currentTime - blockStart
        });
        currentExecuting = best;
        blockStart = currentTime;
      } else if (!currentExecuting) {
        currentExecuting = best;
        blockStart = currentTime;
      }

      // Run 1 time unit
      remBt[best.id] -= 1;
      currentTime += 1;

      if (remBt[best.id] === 0) {
        completed.add(best.id);
        best.ct = currentTime;
        this.timeline.push({
          pid: best.id,
          name: best.name,
          color: best.color,
          start: blockStart,
          end: currentTime,
          duration: currentTime - blockStart
        });
        currentExecuting = null;
        blockStart = currentTime;
      }
    }

    // Merge adjacent identical timeline blocks if any
    const merged = [];
    this.timeline.forEach(block => {
      if (merged.length > 0 && merged[merged.length - 1].pid === block.pid) {
        merged[merged.length - 1].end = block.end;
        merged[merged.length - 1].duration += block.duration;
      } else {
        merged.push({ ...block });
      }
    });
    this.timeline = merged;

    // Generate steps from timeline
    this.steps = [
      {
        time: 0,
        activePid: null,
        readyQueue: [],
        completed: [],
        description: 'Simulation started for Preemptive Priority Scheduling.'
      }
    ];

    const complSet = new Set();
    this.timeline.forEach(b => {
      if (b.pid !== 'IDLE') {
        const p = procMap[b.pid];
        if (b.end === p.ct) complSet.add(b.pid);
        this.steps.push({
          time: b.end,
          activePid: b.pid,
          readyQueue: this.processes.filter(pr => pr.at <= b.end && !complSet.has(pr.id) && pr.id !== b.pid).map(pr => pr.id),
          completed: Array.from(complSet),
          description: `${b.pid} executed from T = ${b.start} to T = ${b.end}.${complSet.has(b.pid) ? ' Completed!' : ' Preempted by higher priority.'}`
        });
      }
    });
  }

  calculateMetrics() {
    let totalTAT = 0;
    let totalWT = 0;
    const procStats = [];

    this.processes.forEach(p => {
      // TAT = CT - AT
      // WT = TAT - BT
      const ct = p.ct || 0;
      const tat = ct - p.at;
      const wt = Math.max(0, tat - p.bt);

      totalTAT += tat;
      totalWT += wt;

      procStats.push({
        id: p.id,
        name: p.name,
        at: p.at,
        bt: p.bt,
        priority: p.priority,
        ct,
        tat,
        wt,
        color: p.color
      });
    });

    this.results = procStats;
    const n = this.processes.length;
    this.stats = {
      avgTAT: (totalTAT / n).toFixed(2),
      avgWT: (totalWT / n).toFixed(2),
      totalExecutionTime: this.timeline.length > 0 ? this.timeline[this.timeline.length - 1].end : 0
    };
  }

  /**
   * Generates deep beginner-friendly English & Hinglish explanations
   */
  generateExplanation() {
    if (this.results.length === 0) return { en: '', hi: '' };

    const firstRun = this.timeline.find(t => t.pid !== 'IDLE');
    const longestWaiting = [...this.results].sort((a, b) => b.wt - a.wt)[0];
    const shortestWaiting = [...this.results].sort((a, b) => a.wt - b.wt)[0];
    const totalTime = this.stats.totalExecutionTime;

    let algoName = 'Round Robin';
    if (this.algorithm === 'priority_non_preempt') algoName = 'Priority Scheduling (Non-Preemptive)';
    if (this.algorithm === 'priority_preempt') algoName = 'Priority Scheduling (Preemptive)';

    const en = `
      <p><strong>1. Why did ${firstRun ? firstRun.pid : 'a process'} run first?</strong><br>
      In ${algoName}, process <strong>${firstRun ? firstRun.pid : 'P1'} (${firstRun ? firstRun.name : ''})</strong> was chosen first at T = ${firstRun ? firstRun.start : 0} because it had already arrived and ${this.algorithm === 'rr' ? 'was at the head of the Ready Queue.' : `had the highest priority value (Priority ${firstRun ? this.processes.find(p=>p.id===firstRun.pid).priority : 1}).`}</p>

      <p><strong>2. How is Waiting Time calculated?</strong><br>
      Standard OS Formula: <code>Turnaround Time (TAT) = Completion Time (CT) − Arrival Time (AT)</code><br>
      <code>Waiting Time (WT) = Turnaround Time (TAT) − Burst Time (BT)</code><br>
      For example, for <strong>${longestWaiting.id} (${longestWaiting.name})</strong>: CT = ${longestWaiting.ct}, AT = ${longestWaiting.at}, BT = ${longestWaiting.bt}.<br>
      TAT = ${longestWaiting.ct} − ${longestWaiting.at} = ${longestWaiting.tat} ms.<br>
      WT = ${longestWaiting.tat} − ${longestWaiting.bt} = <strong>${longestWaiting.wt} ms</strong>.</p>

      <p><strong>3. Longest vs Shortest Waiting Process:</strong><br>
      - <strong>Longest Waiting:</strong> <code>${longestWaiting.id}</code> waited for <strong>${longestWaiting.wt} ms</strong>.<br>
      - <strong>Shortest Waiting:</strong> <code>${shortestWaiting.id}</code> waited for only <strong>${shortestWaiting.wt} ms</strong>.</p>

      <p><strong>4. Railway System Context:</strong><br>
      In a real reservation system like IRCTC, critical transactions such as <em>Payment Gateway</em> and <em>Seat Locks</em> must have higher responsiveness than background <em>Search Queries</em>. Round Robin ensures that long search queries don't starve other users, while Priority Scheduling ensures payment tokens don't expire!</p>
    `;

    const hi = `
      <p><strong>1. Sabse pehle kaunsa task execute hua aur kyun?</strong><br>
      ${algoName} ke hisaab se, process <strong>${firstRun ? firstRun.pid : 'P1'}</strong> pehle run hua kyunki ye arrival time T = ${firstRun ? firstRun.start : 0} par ready tha aur ${this.algorithm === 'rr' ? 'Ready Queue ke front mein tha.' : 'iska Priority rank sabse high tha.'}</p>

      <p><strong>2. Waiting Time kaise calculate hua?</strong><br>
      Operating System ka fixed formula:<br>
      <code>TAT = Completion Time − Arrival Time</code><br>
      <code>Waiting Time = TAT − Burst Time</code><br>
      Example ke liye <strong>${longestWaiting.id}</strong>: Total time = ${longestWaiting.ct} ms par complete hua, arrival tha ${longestWaiting.at} ms. Iska waiting time nikla <strong>${longestWaiting.wt} ms</strong>.</p>

      <p><strong>3. Longest Waiting Process:</strong><br>
      Sabse zyada wait <strong>${longestWaiting.id} (${longestWaiting.name})</strong> ko karna pada (${longestWaiting.wt} ms). Average Waiting Time poore system ka <strong>${this.stats.avgWT} ms</strong> hai.</p>

      <p><strong>4. Railway Analogy (Viva Tip):</strong><br>
      Teacher ko samjhaiye ki jaise Tatkal booking ke time Payment request ko Tatkal Search se zyada priority milni chahiye taaki session timeout na ho, waise hi CPU scheduler highest priority railway tasks ko CPU assign karta hai.</p>
    `;

    return { en, hi };
  }

  /**
   * Reset simulation to beginning
   */
  resetSimulation() {
    this.pauseSimulation();
    this.currentStepIndex = -1;
    this.calculate();
  }

  playSimulation(onStepCallback, onFinishCallback) {
    if (this.isPlaying) return;
    this.isPlaying = true;

    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = -1;
    }

    this.playbackTimer = setInterval(() => {
      if (this.currentStepIndex < this.steps.length - 1) {
        this.currentStepIndex++;
        if (window.soundFx) window.soundFx.step();
        if (onStepCallback) onStepCallback(this.getCurrentStep(), this.currentStepIndex);
      } else {
        this.pauseSimulation();
        if (window.soundFx) window.soundFx.success();
        if (onFinishCallback) onFinishCallback();
      }
    }, this.playbackSpeed);
  }

  pauseSimulation() {
    this.isPlaying = false;
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  stepForward(onStepCallback) {
    this.pauseSimulation();
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      if (window.soundFx) window.soundFx.step();
      if (onStepCallback) onStepCallback(this.getCurrentStep(), this.currentStepIndex);
    }
  }

  getCurrentStep() {
    if (this.currentStepIndex === -1) {
      return {
        time: 0,
        activePid: null,
        readyQueue: this.processes.filter(p => p.at === 0).map(p => p.id),
        completed: [],
        description: 'Ready to start. Click "Run Simulation" or "Step Forward".'
      };
    }
    return this.steps[this.currentStepIndex] || this.steps[this.steps.length - 1];
  }
}

window.CPUScheduler = CPUScheduler;
window.cpuScheduler = new CPUScheduler();
