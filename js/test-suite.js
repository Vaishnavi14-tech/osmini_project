/**
 * RailOS Automated Test Verification Suite
 * Executes live algorithmic verification against standard textbook & edge test cases
 */

class TestSuite {
  constructor() {
    this.tests = [
      {
        id: 'TEST-01',
        category: 'CPU Scheduling',
        name: 'Round Robin Calculation Test',
        description: 'Verify Turnaround Time & Waiting Time calculation for 3 tasks with Quantum = 2',
        input: 'P1(AT=0, BT=4), P2(AT=1, BT=3), P3(AT=2, BT=1), Quantum=2',
        expected: 'P1: CT=7, TAT=7, WT=3; P2: CT=8, TAT=7, WT=4; P3: CT=5, TAT=3, WT=2; Avg WT = 3.00',
        run: () => {
          const scheduler = new (window.CPUScheduler || CPUScheduler)();
          scheduler.processes = [
            { id: 'P1', name: 'Task 1', at: 0, bt: 4, priority: 1, color: '#3a86ff' },
            { id: 'P2', name: 'Task 2', at: 1, bt: 3, priority: 2, color: '#06d6a0' },
            { id: 'P3', name: 'Task 3', at: 2, bt: 1, priority: 3, color: '#ffbe0b' }
          ];
          scheduler.setAlgorithm('rr');
          scheduler.setTimeQuantum(2);
          scheduler.calculate();

          const r1 = scheduler.results.find(p => p.id === 'P1');
          const r2 = scheduler.results.find(p => p.id === 'P2');
          const r3 = scheduler.results.find(p => p.id === 'P3');

          const actual = `P1: CT=${r1.ct}, TAT=${r1.tat}, WT=${r1.wt}; P2: CT=${r2.ct}, TAT=${r2.tat}, WT=${r2.wt}; P3: CT=${r3.ct}, TAT=${r3.tat}, WT=${r3.wt}; Avg WT = ${scheduler.stats.avgWT}`;
          const pass = (r1.ct === 7 && r1.tat === 7 && r1.wt === 3 &&
                        r2.ct === 8 && r2.tat === 7 && r2.wt === 4 &&
                        r3.ct === 5 && r3.tat === 3 && r3.wt === 2 &&
                        parseFloat(scheduler.stats.avgWT) === 3.00);

          return { pass, actual };
        }
      },
      {
        id: 'TEST-02',
        category: 'CPU Scheduling',
        name: 'Non-Preemptive Priority Order Test',
        description: 'Verify processes execute in strict priority sequence (Priority 1 = Highest)',
        input: 'P1(AT=0, BT=3, Prio=3), P2(AT=0, BT=2, Prio=1), P3(AT=0, BT=4, Prio=2)',
        expected: 'Execution Order: P2 ➔ P3 ➔ P1 (P2 finishes at 2, P3 at 6, P1 at 9)',
        run: () => {
          const scheduler = new (window.CPUScheduler || CPUScheduler)();
          scheduler.processes = [
            { id: 'P1', name: 'Task 1', at: 0, bt: 3, priority: 3, color: '#3a86ff' },
            { id: 'P2', name: 'Task 2', at: 0, bt: 2, priority: 1, color: '#06d6a0' },
            { id: 'P3', name: 'Task 3', at: 0, bt: 4, priority: 2, color: '#ffbe0b' }
          ];
          scheduler.setAlgorithm('priority_non_preempt');
          scheduler.calculate();

          const order = scheduler.timeline.map(t => t.pid).join(' ➔ ');
          const r2 = scheduler.results.find(p => p.id === 'P2');
          const r3 = scheduler.results.find(p => p.id === 'P3');
          const r1 = scheduler.results.find(p => p.id === 'P1');

          const actual = `Execution Order: ${order} (P2 CT=${r2.ct}, P3 CT=${r3.ct}, P1 CT=${r1.ct})`;
          const pass = (order === 'P2 ➔ P3 ➔ P1' && r2.ct === 2 && r3.ct === 6 && r1.ct === 9);

          return { pass, actual };
        }
      },
      {
        id: 'TEST-03',
        category: 'Producer–Consumer',
        name: 'Buffer Full Semaphore Enforcement Test',
        description: 'Verify producer is blocked when buffer capacity is reached (Empty Semaphore = 0)',
        input: 'Buffer capacity = 3. Produce 4 consecutive booking requests.',
        expected: '3 items added, 4th item blocked with state = BLOCKED and reason = "Buffer FULL"',
        run: () => {
          const sim = new (window.ProducerConsumerSimulation || ProducerConsumerSimulation)();
          sim.setCapacity(3);
          sim.produce();
          sim.produce();
          sim.produce();
          sim.produce(); // 4th attempt

          const pass = (sim.buffer.length === 3 &&
                        sim.emptySlots === 0 &&
                        sim.producerState === 'BLOCKED' &&
                        sim.producerBlockReason.includes('Buffer FULL'));

          const actual = `Buffer size: ${sim.buffer.length}/3, Empty Semaphore: ${sim.emptySlots}, Producer State: ${sim.producerState} (${sim.producerBlockReason})`;
          return { pass, actual };
        }
      },
      {
        id: 'TEST-04',
        category: 'Producer–Consumer',
        name: 'Buffer Empty Semaphore Enforcement Test',
        description: 'Verify consumer is blocked when buffer has 0 items (Full Semaphore = 0)',
        input: 'Buffer capacity = 5. Reset to 0 items, then attempt consume.',
        expected: 'Consumer blocked with state = BLOCKED and reason = "Buffer EMPTY"',
        run: () => {
          const sim = new (window.ProducerConsumerSimulation || ProducerConsumerSimulation)();
          sim.reset();
          sim.consume(); // Attempt to consume from empty queue

          const pass = (sim.buffer.length === 0 &&
                        sim.fullSlots === 0 &&
                        sim.consumerState === 'BLOCKED' &&
                        sim.consumerBlockReason.includes('Buffer EMPTY'));

          const actual = `Buffer size: ${sim.buffer.length}, Full Semaphore: ${sim.fullSlots}, Consumer State: ${sim.consumerState} (${sim.consumerBlockReason})`;
          return { pass, actual };
        }
      },
      {
        id: 'TEST-05',
        category: 'Banker’s Algorithm',
        name: 'Safe State & Sequence Resolution Test',
        description: 'Verify safe state detection and valid safe sequence calculation on textbook matrix',
        input: 'Available = [3, 3, 2]; Allocation & Max standard 5-process matrix',
        expected: 'System Safe = true, Valid sequence starting with P1 (e.g. P1 ➔ P3 ➔ P4 ➔ P0 ➔ P2)',
        run: () => {
          const bankers = new (window.BankersAlgorithm || BankersAlgorithm)();
          bankers.loadPreset('safe');
          const res = bankers.checkSafety();

          const seqStr = res.safeSequence.join(' ➔ ');
          const pass = (res.isSafe === true &&
                        res.safeSequence.length === 5 &&
                        res.safeSequence[0] === 'P1');

          const actual = `System Safe: ${res.isSafe}, Safe Sequence: ${seqStr}`;
          return { pass, actual };
        }
      },
      {
        id: 'TEST-06',
        category: 'Banker’s Algorithm',
        name: 'Unsafe State (Deadlock Hazard) Test',
        description: 'Verify unsafe state detection when Available cannot satisfy remaining Needs',
        input: 'Available = [1, 0, 0]; High resource demand allocation matrix',
        expected: 'System Safe = false, Incomplete sequence, Warning of unsafe state',
        run: () => {
          const bankers = new (window.BankersAlgorithm || BankersAlgorithm)();
          bankers.loadPreset('unsafe');
          const res = bankers.checkSafety();

          const pass = (res.isSafe === false && res.safeSequence.length < 5);
          const actual = `System Safe: ${res.isSafe}, Completed Processes: [${res.safeSequence.join(', ') || 'None'}] (Unsafe State Triggered)`;
          return { pass, actual };
        }
      },
      {
        id: 'TEST-07',
        category: 'Memory Management',
        name: 'First Fit Allocation Strategy Test',
        description: 'Verify First Fit chooses first available block where block.size >= process.size',
        input: 'Blocks: [200, 500, 150, 300, 600]. Process P1(212 KB) and P2(417 KB)',
        expected: 'P1 allocated to B2 (500 KB block), P2 allocated to B5 (600 KB block)',
        run: () => {
          const mm = new (window.MemoryManagement || MemoryManagement)();
          mm.loadPreset('default');
          mm.setAlgorithm('first_fit');
          mm.runAllocation();

          const a1 = mm.allocations.find(a => a.process.id === 'P1');
          const a2 = mm.allocations.find(a => a.process.id === 'P2');

          const pass = (a1 && a1.blockId === 'B2' && a2 && a2.blockId === 'B5');
          const actual = `P1(212 KB) ➔ ${a1 ? a1.blockId : 'None'}, P2(417 KB) ➔ ${a2 ? a2.blockId : 'None'}`;
          return { pass, actual };
        }
      },
      {
        id: 'TEST-08',
        category: 'Memory Management',
        name: 'Best Fit Tightest Block Test',
        description: 'Verify Best Fit chooses the block leaving the minimum leftover hole',
        input: 'Blocks: [200, 500, 150, 300, 600]. Process P3(112 KB)',
        expected: 'P3(112 KB) allocated to B3 (150 KB block) because (150 - 112 = 38 KB) is smallest hole',
        run: () => {
          const mm = new (window.MemoryManagement || MemoryManagement)();
          mm.loadPreset('default');
          mm.setAlgorithm('best_fit');
          mm.runAllocation();

          const a3 = mm.allocations.find(a => a.process.id === 'P3');
          const pass = (a3 && a3.blockId === 'B3');
          const actual = `P3(112 KB) allocated to ${a3 ? a3.blockId : 'None'} (Leftover: ${a3 ? a3.remainingInBlock : '?'} KB)`;
          return { pass, actual };
        }
      },
      {
        id: 'TEST-09',
        category: 'Input Validation',
        name: 'Graceful Handling of Invalid Inputs',
        description: 'Verify Banker algorithm catches invalid Allocation > Maximum without crashing',
        input: 'Process P0 Allocation[0][0] = 10, Maximum[0][0] = 5',
        expected: 'Validation error caught: Allocation cannot exceed Maximum',
        run: () => {
          const bankers = new (window.BankersAlgorithm || BankersAlgorithm)();
          bankers.loadPreset('safe');
          bankers.allocation[0][0] = 10;
          bankers.maximum[0][0] = 5;

          const res = bankers.checkSafety();
          const pass = (res.success === false && res.error.includes('Allocation of R1'));
          const actual = `Caught gracefully: "${res.error}"`;
          return { pass, actual };
        }

      }
    ];

    this.results = [];
  }

  runAll() {
    this.results = this.tests.map(test => {
      const startTime = performance.now();
      try {
        const { pass, actual } = test.run();
        const duration = (performance.now() - startTime).toFixed(2);
        return {
          id: test.id,
          category: test.category,
          name: test.name,
          description: test.description,
          input: test.input,
          expected: test.expected,
          actual,
          pass,
          duration: `${duration} ms`
        };
      } catch (err) {
        return {
          id: test.id,
          category: test.category,
          name: test.name,
          description: test.description,
          input: test.input,
          expected: test.expected,
          actual: `Runtime Exception: ${err.message}`,
          pass: false,
          duration: '0 ms'
        };
      }
    });

    const passedCount = this.results.filter(r => r.pass).length;
    const totalCount = this.results.length;

    return {
      results: this.results,
      passedCount,
      totalCount,
      allPassed: passedCount === totalCount
    };
  }
}

window.TestSuite = TestSuite;
window.testSuite = new TestSuite();
