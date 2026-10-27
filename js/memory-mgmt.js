/**
 * RailOS Memory Management Laboratory
 * First Fit and Best Fit dynamic memory allocation with accurate fragmentation analysis
 */

class MemoryManagement {
  constructor() {
    this.algorithm = 'first_fit'; // 'first_fit' or 'best_fit'

    // Initial railway memory blocks (in KB)
    this.initialBlocks = [
      { id: 'B1', name: 'Server RAM Partition 1', size: 200 },
      { id: 'B2', name: 'Server RAM Partition 2', size: 500 },
      { id: 'B3', name: 'Server RAM Partition 3', size: 150 },
      { id: 'B4', name: 'Server RAM Partition 4', size: 300 },
      { id: 'B5', name: 'Server RAM Partition 5', size: 600 }
    ];

    // Railway processes needing memory
    this.initialProcesses = [
      { id: 'P1', name: 'Seat Layout Cache', size: 212, color: '#3a86ff' },
      { id: 'P2', name: 'PNR Lookup Index', size: 417, color: '#06d6a0' },
      { id: 'P3', name: 'Payment Token Session', size: 112, color: '#ffbe0b' },
      { id: 'P4', name: 'Ticket PDF Generator', size: 426, color: '#ef476f' }
    ];

    this.blocks = [];
    this.processes = [];

    // Allocation state
    this.allocations = []; // [{ process, blockId, allocatedSize, remainingInBlock }]
    this.unallocated = []; // [process]
    this.blockStates = []; // Visual snapshot of blocks after allocation
    this.comparison = null; // Side-by-side First Fit vs Best Fit comparison

    this.loadPreset('default');
  }

  loadPreset(type = 'default') {
    if (type === 'tatkal_heavy') {
      this.blocks = [
        { id: 'B1', name: 'IRCTC Web Front-tier', size: 100 },
        { id: 'B2', name: 'Database Cache Block', size: 450 },
        { id: 'B3', name: 'Session Token Buffer', size: 200 },
        { id: 'B4', name: 'Payment Gateway Vault', size: 350 },
        { id: 'B5', name: 'SMS Dispatch Buffer', size: 550 }
      ];
      this.processes = [
        { id: 'P1', name: 'Tatkal User Sessions', size: 180, color: '#3a86ff' },
        { id: 'P2', name: 'Vande Bharat Berths', size: 420, color: '#06d6a0' },
        { id: 'P3', name: 'Captcha OCR Engine', size: 90, color: '#ffbe0b' },
        { id: 'P4', name: 'UPI Payment Webhooks', size: 300, color: '#ef476f' },
        { id: 'P5', name: 'Live Train GPS Cache', size: 250, color: '#8338ec' }
      ];
    } else {
      this.blocks = JSON.parse(JSON.stringify(this.initialBlocks));
      this.processes = JSON.parse(JSON.stringify(this.initialProcesses));
    }
    this.runAllocation();
  }

  addBlock(size = 250) {
    const nextIdx = this.blocks.length + 1;
    this.blocks.push({
      id: `B${nextIdx}`,
      name: `Server RAM Partition ${nextIdx}`,
      size: Math.max(10, parseInt(size) || 100)
    });
    this.runAllocation();
  }

  removeBlock(index) {
    if (this.blocks.length <= 1) return;
    this.blocks.splice(index, 1);
    this.runAllocation();
  }

  updateBlockSize(index, size) {
    if (!this.blocks[index]) return;
    this.blocks[index].size = Math.max(10, parseInt(size) || 10);
    this.runAllocation();
  }

  addProcess(name = 'New Railway Service', size = 150) {
    const nextIdx = this.processes.length + 1;
    const colors = ['#3a86ff', '#06d6a0', '#ffbe0b', '#ef476f', '#8338ec', '#fb5607', '#118ab2'];
    this.processes.push({
      id: `P${nextIdx}`,
      name: name || `Service P${nextIdx}`,
      size: Math.max(10, parseInt(size) || 50),
      color: colors[(nextIdx - 1) % colors.length]
    });
    this.runAllocation();
  }

  removeProcess(index) {
    if (this.processes.length <= 1) return;
    this.processes.splice(index, 1);
    this.runAllocation();
  }

  updateProcessSize(index, size) {
    if (!this.processes[index]) return;
    this.processes[index].size = Math.max(10, parseInt(size) || 10);
    this.runAllocation();
  }

  setAlgorithm(algo) {
    this.algorithm = algo;
    this.runAllocation();
  }

  /**
   * Internal algorithm executor that can run either First Fit or Best Fit
   */
  simulate(algoType, blocksInput, processesInput) {
    // Clone blocks
    const bState = blocksInput.map(b => ({
      id: b.id,
      name: b.name,
      originalSize: b.size,
      availableSize: b.size,
      allocatedProcesses: [] // [{ id, name, size, color }]
    }));

    const allocations = [];
    const unallocated = [];

    processesInput.forEach(p => {
      let chosenBlockIdx = -1;

      if (algoType === 'first_fit') {
        // First Fit: Find first block with availableSize >= p.size
        for (let i = 0; i < bState.length; i++) {
          if (bState[i].availableSize >= p.size) {
            chosenBlockIdx = i;
            break;
          }
        }
      } else if (algoType === 'best_fit') {
        // Best Fit: Find block with MINIMUM (availableSize - p.size) >= 0
        let minDiff = Infinity;
        for (let i = 0; i < bState.length; i++) {
          if (bState[i].availableSize >= p.size) {
            const diff = bState[i].availableSize - p.size;
            if (diff < minDiff) {
              minDiff = diff;
              chosenBlockIdx = i;
            }
          }
        }
      }

      if (chosenBlockIdx !== -1) {
        const blk = bState[chosenBlockIdx];
        blk.availableSize -= p.size;
        blk.allocatedProcesses.push({
          id: p.id,
          name: p.name,
          size: p.size,
          color: p.color
        });
        allocations.push({
          process: p,
          blockId: blk.id,
          allocatedSize: p.size,
          remainingInBlock: blk.availableSize
        });
      } else {
        unallocated.push(p);
      }
    });

    // Calculate metrics
    const totalMemory = bState.reduce((sum, b) => sum + b.originalSize, 0);
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedSize, 0);
    const totalFree = totalMemory - totalAllocated;
    const utilization = totalMemory > 0 ? ((totalAllocated / totalMemory) * 100).toFixed(1) : 0;

    // External fragmentation check:
    // If an unallocated process could fit in totalFree, but cannot fit in any single block
    const externalFragVictims = unallocated.filter(p => p.size <= totalFree);

    return {
      algo: algoType,
      blockStates: bState,
      allocations,
      unallocated,
      metrics: {
        totalMemory,
        totalAllocated,
        totalFree,
        utilization,
        allocatedCount: allocations.length,
        unallocatedCount: unallocated.length,
        hasExternalFragmentation: externalFragVictims.length > 0,
        externalFragVictims
      }
    };
  }

  /**
   * Run current selected allocation & generate comparison
   */
  runAllocation() {
    const currentRun = this.simulate(this.algorithm, this.blocks, this.processes);
    this.blockStates = currentRun.blockStates;
    this.allocations = currentRun.allocations;
    this.unallocated = currentRun.unallocated;
    this.metrics = currentRun.metrics;

    // Run both to generate side-by-side comparison
    const ffRun = this.simulate('first_fit', this.blocks, this.processes);
    const bfRun = this.simulate('best_fit', this.blocks, this.processes);

    this.comparison = {
      firstFit: ffRun,
      bestFit: bfRun
    };
  }

  /**
   * Bilingual explanation
   */
  getExplanation() {
    const algoName = this.algorithm === 'first_fit' ? 'First Fit' : 'Best Fit';
    const totalMem = this.metrics ? this.metrics.totalMemory : 0;
    const allocMem = this.metrics ? this.metrics.totalAllocated : 0;
    const freeMem = this.metrics ? this.metrics.totalFree : 0;
    const util = this.metrics ? this.metrics.utilization : 0;
    const unallocCount = this.unallocated.length;

    const en = `
      <p><strong>1. How does ${algoName} work?</strong><br>
      - <strong>First Fit:</strong> Scans memory partitions from the very first block (B1) and assigns the process to the <em>first</em> block large enough to hold it. It is fast because searching stops as soon as a match is found.<br>
      - <strong>Best Fit:</strong> Searches through <em>all</em> memory blocks and assigns the process to the <em>smallest</em> suitable block (leaving the smallest leftover hole). While it leaves small holes, it preserves large blocks for larger processes.</p>

      <p><strong>2. Current Allocation Summary:</strong><br>
      - <strong>Total Server Memory:</strong> ${totalMem} KB.<br>
      - <strong>Memory Allocated:</strong> ${allocMem} KB (${util}% Utilization).<br>
      - <strong>Free Memory Remaining:</strong> ${freeMem} KB across remaining block holes.<br>
      - <strong>Unallocated Tasks:</strong> ${unallocCount > 0 ? `${unallocCount} tasks (${this.unallocated.map(p => p.id).join(', ')}) could not fit into any single contiguous partition!` : 'All tasks successfully allocated!'}</p>

      <p><strong>3. Understanding Fragmentation (Viva Question!):</strong><br>
      - <strong>Internal Fragmentation:</strong> Occurs when memory is allocated in fixed-size blocks and a process does not use the entire partition.<br>
      - <strong>External Fragmentation:</strong> Total free memory (${freeMem} KB) may be greater than an unallocated process's requirement, but because memory is split non-contiguously across multiple blocks, the process cannot be loaded!</p>

      <p><strong>4. First Fit vs Best Fit — Which is better?</strong><br>
      Neither is universally superior! First Fit is generally faster in execution time, whereas Best Fit makes tighter fits but often produces tiny, unusable external memory fragments. Check the comparison table below to see how they perform on your specific inputs.</p>
    `;

    const hi = `
      <p><strong>1. First Fit aur Best Fit kaise kaam karte hain?</strong><br>
      - <strong>First Fit:</strong> B1 se shuru karta hai aur jo pehla block task se bada milta hai, usme allocate kar deta hai. Ye fast hota hai.<br>
      - <strong>Best Fit:</strong> Saare blocks check karta hai aur sabse chhota block dhoondhta hai jo task ko accommodate kar sake. Taaki bade blocks bache rahein.</p>

      <p><strong>2. Current Result (Viva Tip):</strong><br>
      Total Memory = <strong>${totalMem} KB</strong>. Allocated = <strong>${allocMem} KB</strong> (${util}%).<br>
      ${unallocCount > 0 ? `⚠️ ${unallocCount} processes (${this.unallocated.map(p => p.id).join(', ')}) allocate nahi ho paaye kyunki koi akela block itna bada nahi tha.` : 'Sabhi processes successfully place ho gaye!'}</p>

      <p><strong>3. Fragmentation ka concept (Important for Examiner):</strong><br>
      - <strong>External Fragmentation:</strong> Agar hamare paas total free memory 300 KB hai, lekin wo 100 KB aur 200 KB ke do alag-alag tukdon mein bati hui hai, toh ek 250 KB ka process nahi ghus sakta. Isko External Fragmentation kehte hain.<br>
      - Solution: <em>Compaction</em> ya <em>Paging</em> (Non-contiguous allocation).</p>
    `;

    return { en, hi };
  }
}

window.MemoryManagement = MemoryManagement;
window.memoryManagement = new MemoryManagement();
