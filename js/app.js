/**
 * RailOS Main Application Controller
 * Handles Navigation, Theme, Modals, Audio, and UI Binding for all 4 OS Modules
 */

class RailOSApp {
  constructor() {
    this.currentTab = 'home';
    this.theme = localStorage.getItem('railos_theme') || 'dark';
    this.lang = 'en'; // 'en' or 'hi'
  }

  init() {
    this.applyTheme(this.theme);
    this.bindEvents();
    this.switchTab('home');

    // Run initial algorithms to prepare data
    if (window.cpuScheduler) window.cpuScheduler.calculate();
    if (window.bankersAlgorithm) window.bankersAlgorithm.checkSafety();
    if (window.memoryManagement) window.memoryManagement.runAllocation();
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('railos_theme', theme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  }

  toggleTheme() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    if (window.soundFx) window.soundFx.click();
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update nav buttons
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.tab === tabId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update tab sections
    document.querySelectorAll('.tab-section').forEach(section => {
      if (section.id === `tab-${tabId}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Render active tab content
    if (tabId === 'cpu') this.renderCPU();
    if (tabId === 'pc') this.renderPC();
    if (tabId === 'banker') this.renderBanker();
    if (tabId === 'memory') this.renderMemory();
    if (tabId === 'tests') this.renderTests();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.soundFx) window.soundFx.click();
  }

  setLanguage(lang) {
    this.lang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Re-render explanations if visible
    if (this.currentTab === 'cpu') this.renderCPUExplanation();
    if (this.currentTab === 'pc') this.renderPCExplanation();
    if (this.currentTab === 'banker') this.renderBankerExplanation();
    if (this.currentTab === 'memory') this.renderMemoryExplanation();
  }

  // ==========================================
  // MODULE 1: CPU SCHEDULING UI
  // ==========================================
  renderCPU() {
    const s = window.cpuScheduler;
    if (!s) return;

    // Algorithm selector
    const algoSelect = document.getElementById('cpu-algo-select');
    if (algoSelect) algoSelect.value = s.algorithm;

    // Time quantum input container visibility
    const tqContainer = document.getElementById('cpu-tq-group');
    if (tqContainer) {
      tqContainer.style.display = s.algorithm === 'rr' ? 'flex' : 'none';
      const tqInput = document.getElementById('cpu-tq-input');
      if (tqInput) tqInput.value = s.timeQuantum;
    }

    // Process Table
    this.renderCPUProcessTable();

    // Gantt Chart
    this.renderCPUGantt();

    // Results Table & Summary
    this.renderCPUResults();

    // Understand This Result
    this.renderCPUExplanation();
  }

  renderCPUProcessTable() {
    const s = window.cpuScheduler;
    const tbody = document.getElementById('cpu-process-table-body');
    if (!tbody) return;

    tbody.innerHTML = s.processes.map((p, idx) => `
      <tr style="border-left: 4px solid ${p.color};">
        <td><strong style="color: ${p.color}">${p.id}</strong></td>
        <td><input type="text" class="input-inline" value="${p.name}" onchange="window.cpuScheduler.updateProcess(${idx}, 'name', this.value); window.app.renderCPU();"></td>
        <td><input type="number" min="0" max="50" class="input-inline-num" value="${p.at}" onchange="window.cpuScheduler.updateProcess(${idx}, 'at', this.value); window.app.renderCPU();"></td>
        <td><input type="number" min="1" max="50" class="input-inline-num" value="${p.bt}" onchange="window.cpuScheduler.updateProcess(${idx}, 'bt', this.value); window.app.renderCPU();"></td>
        <td><input type="number" min="1" max="10" class="input-inline-num" value="${p.priority}" onchange="window.cpuScheduler.updateProcess(${idx}, 'priority', this.value); window.app.renderCPU();"></td>
        <td>
          <button class="btn-icon-danger" onclick="window.cpuScheduler.removeProcess(${idx}); window.app.renderCPU();" title="Delete Task" ${s.processes.length <= 1 ? 'disabled' : ''}>🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  renderCPUGantt() {
    const s = window.cpuScheduler;
    const container = document.getElementById('cpu-gantt-timeline');
    if (!container) return;

    if (s.timeline.length === 0) {
      container.innerHTML = `<div class="empty-state">No execution timeline yet. Click "▶ Run Simulation".</div>`;
      return;
    }

    const totalDuration = s.timeline[s.timeline.length - 1].end || 1;
    const currentStep = s.getCurrentStep();

    container.innerHTML = `
      <div class="gantt-blocks-wrapper">
        ${s.timeline.map((block, idx) => {
          const widthPct = Math.max(3, (block.duration / totalDuration) * 100);
          const isActive = currentStep && currentStep.activePid === block.pid && currentStep.time >= block.start && currentStep.time <= block.end;
          return `
            <div class="gantt-block ${isActive ? 'gantt-active-pulse' : ''}" style="flex: ${block.duration}; background: ${block.color};" title="${block.name} (T = ${block.start} to ${block.end})">
              <span class="gantt-pid">${block.pid}</span>
              <span class="gantt-dur">${block.duration}ms</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="gantt-time-axis">
        <span class="time-mark">0</span>
        ${s.timeline.map(block => `<span class="time-mark" style="flex: ${block.duration}; text-align: right;">${block.end}</span>`).join('')}
      </div>
    `;

    // Step info / Ready Queue display
    const stepInfoBox = document.getElementById('cpu-step-info-box');
    if (stepInfoBox) {
      stepInfoBox.innerHTML = `
        <div class="step-card">
          <div class="step-card-header">
            <span>⏱️ Current Simulation Time: <strong>T = ${currentStep.time} ms</strong></span>
            <span>Active: <strong style="color: var(--color-teal);">${currentStep.activePid ? currentStep.activePid : 'None'}</strong></span>
          </div>
          <div class="step-card-queue">
            <strong>Ready Queue:</strong>
            ${currentStep.readyQueue.length > 0
              ? currentStep.readyQueue.map(pid => `<span class="queue-chip">${pid}</span>`).join(' ➔ ')
              : '<span class="empty-chip">Empty</span>'
            }
          </div>
          <p class="step-desc">${currentStep.description}</p>
        </div>
      `;
    }
  }

  renderCPUResults() {
    const s = window.cpuScheduler;
    const tbody = document.getElementById('cpu-results-table-body');
    if (tbody) {
      tbody.innerHTML = s.results.map(r => `
        <tr>
          <td><strong style="color: ${r.color}">${r.id}</strong></td>
          <td>${r.name}</td>
          <td>${r.at} ms</td>
          <td>${r.bt} ms</td>
          <td>${r.priority}</td>
          <td><strong style="color: var(--color-blue);">${r.ct} ms</strong></td>
          <td><strong>${r.tat} ms</strong></td>
          <td><strong style="color: var(--color-teal);">${r.wt} ms</strong></td>
        </tr>
      `).join('');
    }

    // Averages
    const avgTAT = document.getElementById('cpu-avg-tat');
    if (avgTAT) avgTAT.innerText = `${s.stats.avgTAT} ms`;

    const avgWT = document.getElementById('cpu-avg-wt');
    if (avgWT) avgWT.innerText = `${s.stats.avgWT} ms`;

    // Visual Waiting Time Comparison Chart
    const chartContainer = document.getElementById('cpu-wt-chart');
    if (chartContainer && s.results.length > 0) {
      const maxWT = Math.max(1, ...s.results.map(r => r.wt));
      chartContainer.innerHTML = s.results.map(r => {
        const heightPct = Math.max(8, (r.wt / maxWT) * 100);
        return `
          <div class="wt-bar-col" title="${r.id} Waiting Time: ${r.wt} ms">
            <div class="wt-bar-val">${r.wt}ms</div>
            <div class="wt-bar-fill" style="height: ${heightPct}%; background: ${r.color};"></div>
            <div class="wt-bar-label">${r.id}</div>
          </div>
        `;
      }).join('');
    }
  }

  renderCPUExplanation() {
    const exp = window.cpuScheduler.generateExplanation();
    const box = document.getElementById('cpu-explanation-content');
    if (box) {
      box.innerHTML = this.lang === 'en' ? exp.en : exp.hi;
    }
  }

  playCPUSimulation() {
    const playBtn = document.getElementById('cpu-play-btn');
    if (window.cpuScheduler.isPlaying) {
      window.cpuScheduler.pauseSimulation();
      if (playBtn) playBtn.innerHTML = '▶ Play Simulation';
    } else {
      if (playBtn) playBtn.innerHTML = '⏸ Pause Simulation';
      window.cpuScheduler.playSimulation(
        (step) => {
          this.renderCPUGantt();
        },
        () => {
          if (playBtn) playBtn.innerHTML = '▶ Play Simulation';
          this.renderCPUGantt();
          this.renderCPUResults();
          this.renderCPUExplanation();
        }
      );
    }
  }

  stepCPUForward() {
    window.cpuScheduler.stepForward((step) => {
      this.renderCPUGantt();
    });
  }

  resetCPUSimulation() {
    window.cpuScheduler.resetSimulation();
    const playBtn = document.getElementById('cpu-play-btn');
    if (playBtn) playBtn.innerHTML = '▶ Play Simulation';
    this.renderCPU();
  }

  // ==========================================
  // MODULE 2: PRODUCER-CONSUMER UI
  // ==========================================
  renderPC() {
    const sim = window.producerConsumer;
    if (!sim) return;

    // Semaphores
    const mutexVal = document.getElementById('pc-mutex-val');
    if (mutexVal) {
      mutexVal.innerText = sim.mutex;
      mutexVal.className = `stat-badge ${sim.mutex === 1 ? 'badge-success' : 'badge-danger'}`;
    }

    const emptyVal = document.getElementById('pc-empty-val');
    if (emptyVal) emptyVal.innerText = `${sim.emptySlots} / ${sim.capacity}`;

    const fullVal = document.getElementById('pc-full-val');
    if (fullVal) fullVal.innerText = `${sim.fullSlots} / ${sim.capacity}`;

    // Worker states
    const prodState = document.getElementById('pc-producer-state');
    if (prodState) {
      prodState.innerText = sim.producerState;
      prodState.className = `worker-state-tag state-${sim.producerState.toLowerCase()}`;
    }

    const consState = document.getElementById('pc-consumer-state');
    if (consState) {
      consState.innerText = sim.consumerState;
      consState.className = `worker-state-tag state-${sim.consumerState.toLowerCase()}`;
    }

    const prodReason = document.getElementById('pc-producer-reason');
    if (prodReason) prodReason.innerText = sim.producerBlockReason || 'Ready to produce ticket';

    const consReason = document.getElementById('pc-consumer-reason');
    if (consReason) consReason.innerText = sim.consumerBlockReason || 'Ready to process booking';

    // Bounded Buffer Slots
    const bufferSlots = document.getElementById('pc-buffer-slots');
    if (bufferSlots) {
      const slotsHtml = [];
      for (let i = 0; i < sim.capacity; i++) {
        const item = sim.buffer[i];
        if (item) {
          slotsHtml.push(`
            <div class="buffer-slot occupied-slot" title="${item.id}: ${item.trainName}">
              <div class="slot-badge">${item.id}</div>
              <div class="slot-train-no">${item.trainNo}</div>
              <div class="slot-passenger">${item.passenger}</div>
              <div class="slot-class-tag">${item.coachClass}</div>
            </div>
          `);
        } else {
          slotsHtml.push(`
            <div class="buffer-slot empty-slot">
              <div class="slot-index">Slot ${i + 1}</div>
              <span class="slot-empty-label">Empty</span>
            </div>
          `);
        }
      }
      bufferSlots.innerHTML = slotsHtml.join('');
    }

    // Activity Log
    const logBox = document.getElementById('pc-log-list');
    if (logBox) {
      logBox.innerHTML = sim.logs.map(l => `
        <div class="log-item log-${l.type}">
          <span class="log-time">[${l.time}]</span>
          <span class="log-msg">${l.msg}</span>
        </div>
      `).join('');
    }

    // Auto-run button text
    const autoBtn = document.getElementById('pc-auto-btn');
    if (autoBtn) {
      autoBtn.innerHTML = sim.isAutoRunning ? '⏹ Stop Auto-Run' : '⚡ Auto-Run Simulation';
    }

    this.renderPCExplanation();
  }

  renderPCExplanation() {
    const exp = window.producerConsumer.getExplanation();
    const box = document.getElementById('pc-explanation-content');
    if (box) {
      box.innerHTML = this.lang === 'en' ? exp.en : exp.hi;
    }
  }

  // ==========================================
  // MODULE 3: BANKER'S ALGORITHM UI
  // ==========================================
  renderBanker() {
    const b = window.bankersAlgorithm;
    if (!b) return;

    // Available Vector cards
    const availContainer = document.getElementById('banker-avail-cards');
    if (availContainer) {
      availContainer.innerHTML = b.resourceNames.map((res, j) => `
        <div class="resource-card">
          <div class="res-icon">${res.icon}</div>
          <div class="res-info">
            <span class="res-name">${res.id}: ${res.name}</span>
            <span class="res-desc">${res.desc}</span>
          </div>
          <div class="res-input-wrapper">
            <label>Available:</label>
            <input type="number" min="0" max="20" class="res-avail-input" value="${b.available[j]}" onchange="window.bankersAlgorithm.updateAvailable(${j}, this.value); window.app.renderBanker();">
          </div>
        </div>
      `).join('');
    }

    // Matrices Tables: Allocation, Maximum, Need
    this.renderBankerMatrices();

    // Safety status and sequence
    const statusBox = document.getElementById('banker-safety-status-box');
    if (statusBox) {
      if (b.isSafe === null) {
        statusBox.className = 'safety-banner banner-neutral';
        statusBox.innerHTML = `<span>ℹ️ System state not yet evaluated. Click <strong>"Check Safe State"</strong> or <strong>"Run Step-by-Step"</strong>.</span>`;
      } else if (b.isSafe === true) {
        statusBox.className = 'safety-banner banner-safe';
        statusBox.innerHTML = `
          <div class="banner-icon">🛡️ SAFE STATE DETECTED</div>
          <div class="banner-body">
            <p>The system is in a guaranteed <strong>Safe State</strong>. All resources can be allocated without causing a deadlock.</p>
            <div class="safe-sequence-flow">
              <strong>Safe Sequence:</strong>
              ${b.safeSequence.map(p => `<span class="seq-chip">${p}</span>`).join(' ➔ ')}
            </div>
          </div>
        `;
      } else {
        statusBox.className = 'safety-banner banner-unsafe';
        statusBox.innerHTML = `
          <div class="banner-icon">⚠️ UNSAFE STATE WARNING</div>
          <div class="banner-body">
            <p>The system is in an <strong>Unsafe State</strong>! No safe sequence could be found to satisfy remaining process requirements.</p>
            <p class="banner-subtext">Note: An unsafe state indicates deadlock <em>risk</em> if processes request maximum claims. Prevent allocation to avoid deadlock.</p>
          </div>
        `;
      }
    }

    // Step-by-step trace
    const stepBox = document.getElementById('banker-step-trace-box');
    if (stepBox) {
      const step = b.getCurrentStep();
      stepBox.innerHTML = `
        <div class="banker-step-card">
          <div class="step-card-header">
            <strong>${step.title || 'Ready'}</strong>
            <span>Work Vector: <strong>[${(step.work || b.available).join(', ')}]</strong></span>
          </div>
          <p class="step-card-reason">${step.reason || 'Click "Run Step-by-Step" to trace process evaluations.'}</p>
          ${step.seq && step.seq.length > 0 ? `<div class="current-seq">Progress: ${step.seq.map(p => `<span class="seq-chip">${p}</span>`).join(' ➔ ')}</div>` : ''}
        </div>
      `;
    }

    this.renderBankerExplanation();
  }

  renderBankerMatrices() {
    const b = window.bankersAlgorithm;
    const tbody = document.getElementById('banker-matrix-tbody');
    if (!tbody) return;

    tbody.innerHTML = Array.from({ length: b.numProcesses }).map((_, i) => {
      const pName = b.processNames[i] || `P${i}`;
      return `
        <tr>
          <td><strong>${pName}</strong></td>
          <!-- Allocation R1, R2, R3 -->
          <td><input type="number" min="0" max="15" class="matrix-input" value="${b.allocation[i][0]}" onchange="window.bankersAlgorithm.updateAllocation(${i}, 0, this.value); window.app.renderBanker();"></td>
          <td><input type="number" min="0" max="15" class="matrix-input" value="${b.allocation[i][1]}" onchange="window.bankersAlgorithm.updateAllocation(${i}, 1, this.value); window.app.renderBanker();"></td>
          <td><input type="number" min="0" max="15" class="matrix-input" value="${b.allocation[i][2]}" onchange="window.bankersAlgorithm.updateAllocation(${i}, 2, this.value); window.app.renderBanker();"></td>
          
          <!-- Maximum R1, R2, R3 -->
          <td class="col-divider-left"><input type="number" min="0" max="15" class="matrix-input" value="${b.maximum[i][0]}" onchange="window.bankersAlgorithm.updateMaximum(${i}, 0, this.value); window.app.renderBanker();"></td>
          <td><input type="number" min="0" max="15" class="matrix-input" value="${b.maximum[i][1]}" onchange="window.bankersAlgorithm.updateMaximum(${i}, 1, this.value); window.app.renderBanker();"></td>
          <td><input type="number" min="0" max="15" class="matrix-input" value="${b.maximum[i][2]}" onchange="window.bankersAlgorithm.updateMaximum(${i}, 2, this.value); window.app.renderBanker();"></td>
          
          <!-- Need = Max - Alloc -->
          <td class="col-divider-left"><span class="matrix-calc-cell">${b.need[i][0]}</span></td>
          <td><span class="matrix-calc-cell">${b.need[i][1]}</span></td>
          <td><span class="matrix-calc-cell">${b.need[i][2]}</span></td>
        </tr>
      `;
    }).join('');
  }

  renderBankerExplanation() {
    const exp = window.bankersAlgorithm.getExplanation();
    const box = document.getElementById('banker-explanation-content');
    if (box) {
      box.innerHTML = this.lang === 'en' ? exp.en : exp.hi;
    }
  }

  // ==========================================
  // MODULE 4: MEMORY MANAGEMENT UI
  // ==========================================
  renderMemory() {
    const mm = window.memoryManagement;
    if (!mm) return;

    // Algorithm selector
    const algoSelect = document.getElementById('mm-algo-select');
    if (algoSelect) algoSelect.value = mm.algorithm;

    // Summary metrics cards
    const totalMem = document.getElementById('mm-stat-total');
    if (totalMem) totalMem.innerText = `${mm.metrics.totalMemory} KB`;

    const allocMem = document.getElementById('mm-stat-allocated');
    if (allocMem) allocMem.innerText = `${mm.metrics.totalAllocated} KB`;

    const freeMem = document.getElementById('mm-stat-free');
    if (freeMem) freeMem.innerText = `${mm.metrics.totalFree} KB`;

    const utilRate = document.getElementById('mm-stat-util');
    if (utilRate) utilRate.innerText = `${mm.metrics.utilization}%`;

    // Utilization Progress Bar
    const utilBar = document.getElementById('mm-util-bar');
    if (utilBar) {
      utilBar.style.width = `${mm.metrics.utilization}%`;
    }

    // Visual Memory Block Map
    this.renderMemoryBlockMap();

    // Tables: Memory Blocks & Processes
    this.renderMemoryTables();

    // Side-by-side comparison table
    this.renderMemoryComparison();

    this.renderMemoryExplanation();
  }

  renderMemoryBlockMap() {
    const mm = window.memoryManagement;
    const container = document.getElementById('mm-blocks-visual-map');
    if (!container) return;

    container.innerHTML = mm.blockStates.map((b, idx) => {
      const isOccupied = b.allocatedProcesses.length > 0;
      const allocatedTotal = b.allocatedProcesses.reduce((sum, p) => sum + p.size, 0);
      const allocPct = ((allocatedTotal / b.originalSize) * 100).toFixed(0);

      return `
        <div class="memory-partition-card ${isOccupied ? 'partition-occupied' : 'partition-free'}">
          <div class="part-header">
            <strong>${b.id} (${b.originalSize} KB)</strong>
            <span class="part-name">${b.name}</span>
          </div>

          <div class="part-bar-container">
            ${b.allocatedProcesses.map(p => {
              const widthPct = (p.size / b.originalSize) * 100;
              return `
                <div class="part-subsegment-proc" style="width: ${widthPct}%; background: ${p.color};" title="${p.id} (${p.name}): ${p.size} KB">
                  <span class="proc-inner-label">${p.id} (${p.size}KB)</span>
                </div>
              `;
            }).join('')}
            ${b.availableSize > 0 ? `
              <div class="part-subsegment-free" style="width: ${(b.availableSize / b.originalSize) * 100}%;">
                <span>Free ${b.availableSize} KB</span>
              </div>
            ` : ''}
          </div>

          <div class="part-footer">
            <span>Used: ${allocatedTotal} KB (${allocPct}%)</span>
            <span>Free: ${b.availableSize} KB</span>
          </div>
        </div>
      `;
    }).join('');

    // Unallocated Processes warning
    const unallocBox = document.getElementById('mm-unallocated-box');
    if (unallocBox) {
      if (mm.unallocated.length > 0) {
        unallocBox.style.display = 'block';
        unallocBox.innerHTML = `
          <div class="alert-box alert-warning">
            <strong>⚠️ Unallocated Tasks (${mm.unallocated.length}):</strong>
            ${mm.unallocated.map(p => `<span class="unalloc-chip">${p.id}: ${p.name} (${p.size} KB)</span>`).join(' ')}
            <p class="unalloc-note">These tasks could not find a contiguous block with sufficient memory.</p>
          </div>
        `;
      } else {
        unallocBox.style.display = 'none';
      }
    }
  }

  renderMemoryTables() {
    const mm = window.memoryManagement;

    // Blocks table
    const blockTbody = document.getElementById('mm-blocks-table-body');
    if (blockTbody) {
      blockTbody.innerHTML = mm.blocks.map((b, idx) => `
        <tr>
          <td><strong>${b.id}</strong></td>
          <td><input type="text" class="input-inline" value="${b.name}" onchange="window.memoryManagement.blocks[${idx}].name = this.value; window.app.renderMemory();"></td>
          <td><input type="number" min="10" max="2000" class="input-inline-num" value="${b.size}" onchange="window.memoryManagement.updateBlockSize(${idx}, this.value); window.app.renderMemory();"></td>
          <td>
            <button class="btn-icon-danger" onclick="window.memoryManagement.removeBlock(${idx}); window.app.renderMemory();" title="Remove Block" ${mm.blocks.length <= 1 ? 'disabled' : ''}>🗑️</button>
          </td>
        </tr>
      `).join('');
    }

    // Processes table
    const procTbody = document.getElementById('mm-proc-table-body');
    if (procTbody) {
      procTbody.innerHTML = mm.processes.map((p, idx) => `
        <tr style="border-left: 3px solid ${p.color}">
          <td><strong style="color: ${p.color}">${p.id}</strong></td>
          <td><input type="text" class="input-inline" value="${p.name}" onchange="window.memoryManagement.processes[${idx}].name = this.value; window.app.renderMemory();"></td>
          <td><input type="number" min="10" max="2000" class="input-inline-num" value="${p.size}" onchange="window.memoryManagement.updateProcessSize(${idx}, this.value); window.app.renderMemory();"></td>
          <td>
            <button class="btn-icon-danger" onclick="window.memoryManagement.removeProcess(${idx}); window.app.renderMemory();" title="Remove Task" ${mm.processes.length <= 1 ? 'disabled' : ''}>🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }

  renderMemoryComparison() {
    const mm = window.memoryManagement;
    const box = document.getElementById('mm-comparison-table-body');
    if (!box || !mm.comparison) return;

    const ff = mm.comparison.firstFit.metrics;
    const bf = mm.comparison.bestFit.metrics;

    box.innerHTML = `
      <tr>
        <td><strong>Strategy Approach</strong></td>
        <td>First partition that fits (Fast)</td>
        <td>Smallest partition that fits (Tight)</td>
      </tr>
      <tr>
        <td><strong>Tasks Allocated</strong></td>
        <td><strong style="color: var(--color-teal)">${ff.allocatedCount} / ${mm.processes.length}</strong></td>
        <td><strong style="color: var(--color-teal)">${bf.allocatedCount} / ${mm.processes.length}</strong></td>
      </tr>
      <tr>
        <td><strong>Memory Allocated</strong></td>
        <td>${ff.totalAllocated} KB (${ff.utilization}%)</td>
        <td>${bf.totalAllocated} KB (${bf.utilization}%)</td>
      </tr>
      <tr>
        <td><strong>Remaining Free Space</strong></td>
        <td>${ff.totalFree} KB</td>
        <td>${bf.totalFree} KB</td>
      </tr>
      <tr>
        <td><strong>External Fragmentation Risk</strong></td>
        <td>${ff.hasExternalFragmentation ? '⚠️ High (Free space scattered)' : '✅ Low'}</td>
        <td>${bf.hasExternalFragmentation ? '⚠️ High (Leaves tiny holes)' : '✅ Low'}</td>
      </tr>
    `;
  }

  renderMemoryExplanation() {
    const exp = window.memoryManagement.getExplanation();
    const box = document.getElementById('mm-explanation-content');
    if (box) {
      box.innerHTML = this.lang === 'en' ? exp.en : exp.hi;
    }
  }

  // ==========================================
  // MODULE 5: TEST SUITE UI
  // ==========================================
  renderTests() {
    const ts = window.testSuite;
    if (!ts) return;

    const tbody = document.getElementById('test-results-tbody');
    if (!tbody) return;

    if (ts.results.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Click "▶ Run All Test Cases" to run live verification.</td></tr>`;
      return;
    }

    tbody.innerHTML = ts.results.map(t => `
      <tr class="${t.pass ? 'test-row-pass' : 'test-row-fail'}">
        <td><code>${t.id}</code></td>
        <td><span class="badge-cat">${t.category}</span><br><strong>${t.name}</strong></td>
        <td><small>${t.input}</small></td>
        <td><small>${t.expected}</small></td>
        <td><small>${t.actual}</small></td>
        <td>
          <span class="test-badge ${t.pass ? 'pass' : 'fail'}">${t.pass ? '✔ PASS' : '✖ FAIL'}</span>
          <br><small style="opacity: 0.7;">${t.duration}</small>
        </td>
      </tr>
    `).join('');

    const summaryCard = document.getElementById('test-summary-card');
    if (summaryCard) {
      const passed = ts.results.filter(r => r.pass).length;
      summaryCard.innerHTML = `
        <div class="test-stat-box">
          <div class="stat-number ${passed === ts.results.length ? 'text-success' : 'text-danger'}">${passed} / ${ts.results.length}</div>
          <div class="stat-label">Tests Passed (${((passed / ts.results.length) * 100).toFixed(0)}%)</div>
        </div>
      `;
    }
  }

  runAllTests() {
    if (window.soundFx) window.soundFx.step();
    window.testSuite.runAll();
    this.renderTests();
    if (window.soundFx) window.soundFx.success();
  }

  // ==========================================
  // MODALS: EXPLAIN MODULE & TEACHER VIVA GUIDE
  // ==========================================
  showExplainModal(moduleKey) {
    const modal = document.getElementById('generic-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalTitle || !modalBody) return;

    if (window.soundFx) window.soundFx.click();

    const explanations = {
      cpu: {
        title: 'Module 1: CPU Scheduling — Deep Dive',
        content: `
          <h4>1. What does this module do?</h4>
          <p>It simulates how the Operating System's CPU scheduler picks railway transactions (seat search, reservation, payment, confirmation) from a Ready Queue and assigns them CPU burst time.</p>

          <h4>2. Why is this useful for understanding a Railway Reservation System?</h4>
          <p>Millions of users access railway servers at 10:00 AM (Tatkal opening). If the OS used First-Come First-Served (FCFS), a user downloading a 100-page train schedule would freeze the CPU, causing payment timeouts for everyone else. Round Robin guarantees fair CPU time slicing, while Priority Scheduling ensures payments get processed before sessions expire!</p>

          <h4>3. Which algorithms are implemented?</h4>
          <ul>
            <li><strong>Round Robin:</strong> Cyclic preemptive scheduling with fixed Time Quantum.</li>
            <li><strong>Priority Scheduling:</strong> Non-preemptive and preemptive versions where Priority 1 is highest priority.</li>
          </ul>

          <h4>4. Step-by-Step Algorithm Walkthrough:</h4>
          <ol>
            <li>Track process arrivals at current simulation clock T.</li>
            <li>Select next eligible process from Ready Queue based on algorithm policy.</li>
            <li>Execute process on CPU, updating timeline block and remaining burst time.</li>
            <li>On completion, record Completion Time (CT), compute Turnaround Time (TAT = CT - AT), and Waiting Time (WT = TAT - BT).</li>
          </ol>

          <h4>5. Key Observations:</h4>
          <p>Notice how reducing the Time Quantum in Round Robin improves responsiveness (lower average waiting time for short tasks), but increases context-switching overhead in real operating systems.</p>
        `
      },
      pc: {
        title: 'Module 2: Producer–Consumer Synchronization — Deep Dive',
        content: `
          <h4>1. What does this module do?</h4>
          <p>It demonstrates how independent concurrent tasks share a bounded buffer safely using Mutex and Counting Semaphores without data corruption.</p>

          <h4>2. Why is this useful for a Railway System?</h4>
          <p>Without synchronization, if two passengers submit a booking for Berth #24 in Coach B1 at the exact same millisecond, both requests might see the berth as available and overwrite each other, leading to double-booking! The <strong>Mutex</strong> semaphore ensures that only one entity modifies the reservation queue at a time.</p>

          <h4>3. Synchronization Primitives:</h4>
          <ul>
            <li><strong>Mutex (Binary Semaphore = 1):</strong> Enforces mutual exclusion in the critical section.</li>
            <li><strong>Empty Semaphore (= Capacity):</strong> Prevents buffer overflow. Producer blocks when Empty = 0.</li>
            <li><strong>Full Semaphore (= 0):</strong> Prevents buffer underflow. Consumer blocks when Full = 0.</li>
          </ul>

          <h4>4. What to observe in the simulation:</h4>
          <p>Keep clicking "Add Booking" until the buffer reaches capacity. Notice how the Producer state immediately switches to <span class="badge-danger">BLOCKED</span> because <code>wait(empty)</code> halted the thread. Click "Process Booking" to see the consumer free a slot and unblock the producer.</p>
        `
      },
      banker: {
        title: 'Module 3: Banker’s Algorithm — Deadlock Avoidance',
        content: `
          <h4>1. What does this module do?</h4>
          <p>It tests whether granting resource allocations to booking processes will keep the system in a <strong>Safe State</strong> or push it into an <strong>Unsafe State</strong> that could trigger a circular wait (deadlock).</p>

          <h4>2. Railway Analogy:</h4>
          <p>Railway reservation involves three critical physical/logical resource types:
            <br>• <strong>R1:</strong> Booking Server Threads
            <br>• <strong>R2:</strong> Payment Gateway Channels
            <br>• <strong>R3:</strong> Confirmation / SMS Engines
            <br>If Process P0 holds Payment Gateway and waits for a Booking Slot, while Process P1 holds a Booking Slot and waits for Payment Gateway, neither can finish! Banker's algorithm prevents this situation.
          </p>

          <h4>3. Core Mathematical Relationships:</h4>
          <p><code>Need[i][j] = Maximum[i][j] − Allocation[i][j]</code><br>
          Condition to execute: <code>Need[i] ≤ Work</code>.<br>
          After execution: <code>Work = Work + Allocation[i]</code>.</p>

          <h4>4. Important Viva Clarification:</h4>
          <p><strong>Unsafe State does NOT mean Deadlock has occurred!</strong> It simply means the OS cannot guarantee that deadlock will be avoided if every process requests its maximum claim at once.</p>
        `
      },
      memory: {
        title: 'Module 4: Memory Management — First Fit vs Best Fit',
        content: `
          <h4>1. What does this module do?</h4>
          <p>It simulates contiguous memory allocation strategies (First Fit and Best Fit) placing passenger services and caching engines into server RAM blocks.</p>

          <h4>2. First Fit vs Best Fit:</h4>
          <ul>
            <li><strong>First Fit:</strong> Allocates the first partition that is big enough. Fast search, low computational overhead.</li>
            <li><strong>Best Fit:</strong> Allocates the smallest partition that is big enough. Leaves the smallest leftover hole, preserving large blocks for massive tasks.</li>
          </ul>

          <h4>3. Accurate Fragmentation Explanation:</h4>
          <ul>
            <li><strong>Internal Fragmentation:</strong> Space wasted inside an allocated partition when the partition is larger than the process requirement.</li>
            <li><strong>External Fragmentation:</strong> Total free memory across all blocks is sufficient to satisfy a pending process, but no single contiguous block is large enough.</li>
          </ul>
        `
      }
    };

    const exp = explanations[moduleKey] || { title: 'Module Explanation', content: 'No explanation found.' };
    modalTitle.innerHTML = exp.title;
    modalBody.innerHTML = exp.content;
    modal.style.display = 'flex';
  }

  showTeacherGuideModal(moduleKey) {
    const modal = document.getElementById('generic-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalTitle || !modalBody) return;

    if (window.soundFx) window.soundFx.click();

    const scripts = {
      cpu: {
        title: '🎓 Speaking Script: How to Explain CPU Scheduling to Teacher',
        script: `
          <div class="viva-script-box">
            <p><strong>Opening Sentence:</strong><br>
            "Good morning Ma'am/Sir. My name is Vaishnavi Satone. In this first module, I have demonstrated how Operating Systems schedule railway reservation tasks."</p>

            <p><strong>Walkthrough of Features:</strong><br>
            "Here, P1 to P5 represent railway operations like Train Searching, Seat Availability Checking, and Payment Processing.
            When I run <strong>Round Robin</strong> with a Time Quantum of 2 ms, the animated Gantt chart shows each task getting a fair slice of CPU time. This prevents starvation of short tasks."</p>

            <p><strong>Explaining the Math:</strong><br>
            "Below the Gantt chart, all metrics are mathematically calculated:
            Turnaround Time is calculated as Completion Time minus Arrival Time, and Waiting Time is Turnaround Time minus Burst Time. The system dynamically displays the average waiting time and a comparative bar chart."</p>

            <p><strong>Anticipated Teacher Questions & Answers:</strong><br>
            <em>Q1: What happens if Time Quantum is very small?</em><br>
            <strong>A:</strong> "The system behaves like processor sharing, but the context switching overhead increases, reducing overall CPU efficiency."<br>
            <em>Q2: Why use Priority Scheduling in Railway?</em><br>
            <strong>A:</strong> "Critical operations like payment gateway webhooks must have higher priority (lower priority number) than casual browse queries to avoid payment timeout failures."</p>
          </div>
        `
      },
      pc: {
        title: '🎓 Speaking Script: How to Explain Producer–Consumer to Teacher',
        script: `
          <div class="viva-script-box">
            <p><strong>Opening Sentence:</strong><br>
            "Sir/Ma'am, this module demonstrates inter-process synchronization using Dijkstra's classic Producer–Consumer bounded buffer problem."</p>

            <p><strong>Walkthrough of Features:</strong><br>
            "In our railway model, passengers booking tickets on IRCTC act as <strong>Producers</strong>, placing requests into a bounded queue buffer. The backend reservation engines act as <strong>Consumers</strong>, processing tickets and confirming PNRs."</p>

            <p><strong>Explaining the Semaphores:</strong><br>
            "We use three semaphores:
            1. <code>Mutex</code> (binary semaphore) ensures mutual exclusion so that two threads cannot access the queue simultaneously.
            2. <code>Empty</code> (counting semaphore) tracks free slots and blocks the Producer when the buffer is full.
            3. <code>Full</code> (counting semaphore) tracks occupied bookings and blocks the Consumer when the queue is empty."</p>

            <p><strong>Anticipated Teacher Questions & Answers:</strong><br>
            <em>Q1: What would happen without the Mutex lock?</em><br>
            <strong>A:</strong> "A race condition would occur. Two consumers could pick the exact same booking or allocate the same seat twice, causing double-booking."</p>
          </div>
        `
      },
      banker: {
        title: '🎓 Speaking Script: How to Explain Banker’s Algorithm to Teacher',
        script: `
          <div class="viva-script-box">
            <p><strong>Opening Sentence:</strong><br>
            "Ma'am/Sir, this module demonstrates Deadlock Avoidance using Banker's Algorithm applied to railway resource distribution."</p>

            <p><strong>Walkthrough of Features:</strong><br>
            "We have three finite resources: Booking Server Slots (R1), Payment Channels (R2), and SMS Dispatchers (R3).
            The algorithm calculates the <strong>Need Matrix</strong> dynamically as <code>Need = Maximum − Allocation</code>."</p>

            <p><strong>Demonstrating Safe vs Unsafe:</strong><br>
            "When I click 'Load Safe Example', the algorithm finds a safe sequence (e.g. P1 ➔ P3 ➔ P4 ➔ P0 ➔ P2) where every process's Need is less than or equal to available Work.
            When I load the 'Unsafe Example', the Available resources cannot satisfy any remaining process, warning of a potential deadlock hazard."</p>

            <p><strong>Anticipated Teacher Questions & Answers:</strong><br>
            <em>Q1: Does an Unsafe state guarantee that a deadlock has already occurred?</em><br>
            <strong>A:</strong> "No, Ma'am/Sir. An unsafe state only means that deadlock is possible if all processes simultaneously demand their maximum resource claims. The OS avoids entering unsafe states to guarantee safety."</p>
          </div>
        `
      },
      memory: {
        title: '🎓 Speaking Script: How to Explain Memory Management to Teacher',
        script: `
          <div class="viva-script-box">
            <p><strong>Opening Sentence:</strong><br>
            "Sir/Ma'am, this module demonstrates contiguous memory allocation using First Fit and Best Fit algorithms."</p>

            <p><strong>Walkthrough of Features:</strong><br>
            "We model server RAM partitions and place passenger tasks like Seat Layout Cache and PNR Index into blocks.
            <strong>First Fit</strong> selects the first partition that is large enough.
            <strong>Best Fit</strong> scans all partitions and selects the smallest partition that fits, leaving the minimal leftover space."</p>

            <p><strong>Explaining Fragmentation:</strong><br>
            "We demonstrate both Internal fragmentation (unused memory inside an allocated block) and External fragmentation (where total free space across partitions is enough for a task, but no single contiguous block can hold it)."</p>
          </div>
        `
      }
    };

    const sc = scripts[moduleKey] || { title: 'Teacher Speaking Script', script: 'No script found.' };
    modalTitle.innerHTML = sc.title;
    modalBody.innerHTML = sc.script;
    modal.style.display = 'flex';
  }

  closeModal() {
    const modal = document.getElementById('generic-modal');
    if (modal) modal.style.display = 'none';
  }

  bindEvents() {
    // Navigation tabs
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Audio toggle
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const enabled = window.soundFx.toggle();
        audioBtn.innerHTML = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      });
    }

    // Modal close
    const modalClose = document.getElementById('modal-close-btn');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeModal());
    }

    window.addEventListener('click', (e) => {
      const modal = document.getElementById('generic-modal');
      if (e.target === modal) this.closeModal();
    });

    // CPU Event listeners
    const cpuAlgoSelect = document.getElementById('cpu-algo-select');
    if (cpuAlgoSelect) {
      cpuAlgoSelect.addEventListener('change', (e) => {
        window.cpuScheduler.setAlgorithm(e.target.value);
        this.renderCPU();
      });
    }

    const cpuTqInput = document.getElementById('cpu-tq-input');
    if (cpuTqInput) {
      cpuTqInput.addEventListener('change', (e) => {
        window.cpuScheduler.setTimeQuantum(e.target.value);
        this.renderCPU();
      });
    }

    // Memory Algo Select
    const mmAlgoSelect = document.getElementById('mm-algo-select');
    if (mmAlgoSelect) {
      mmAlgoSelect.addEventListener('change', (e) => {
        window.memoryManagement.setAlgorithm(e.target.value);
        this.renderMemory();
      });
    }
  }
}

window.app = new RailOSApp();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
