/**
 * RailOS Producer-Consumer Synchronization Laboratory
 * Bounded Buffer with Mutex, Empty & Full Semaphores
 */

class ProducerConsumerSimulation {
  constructor() {
    this.capacity = 5;
    this.buffer = []; // Array of { id, trainNo, trainName, passenger, quota, timestamp }
    this.nextBookingId = 101;

    // Synchronization primitives
    this.mutex = 1; // 1 = Unlocked, 0 = Locked
    this.emptySlots = this.capacity;
    this.fullSlots = 0;

    // Worker states: 'IDLE', 'REQUESTING', 'CRITICAL_SECTION', 'BLOCKED'
    this.producerState = 'IDLE';
    this.consumerState = 'IDLE';
    this.producerBlockReason = '';
    this.consumerBlockReason = '';

    // Auto-run simulation
    this.isAutoRunning = false;
    this.autoTimer = null;
    this.autoInterval = 1600; // ms

    this.logs = [];

    this.trainSamples = [
      { no: '12951', name: 'Mumbai Rajdhani Exp', class: '3A' },
      { no: '22436', name: 'Vande Bharat Exp', class: 'CC' },
      { no: '12259', name: 'Sealdah Duronto', class: '2A' },
      { no: '12002', name: 'Bhopal Shatabdi', class: 'EC' },
      { no: '12626', name: 'Kerala Express', class: 'SL' },
      { no: '12138', name: 'Punjab Mail', class: '2S' },
      { no: '20801', name: 'Magadh Express', class: '3E' }
    ];

    this.passengerNames = [
      'Vaishnavi Satone', 'Rahul Sharma', 'Sneha Patel', 'Amit Verma',
      'Priya Kulkarni', 'Rohan Gupta', 'Ananya Deshmukh', 'Vikram Joshi'
    ];

    this.init();
  }

  init() {
    this.reset();
  }

  setCapacity(newCap) {
    newCap = Math.max(3, Math.min(10, parseInt(newCap) || 5));
    if (this.buffer.length > newCap) {
      this.addLog(`⚠️ Cannot decrease capacity to ${newCap} while ${this.buffer.length} bookings are pending. Process items first.`, 'warning');
      return false;
    }
    this.capacity = newCap;
    this.emptySlots = this.capacity - this.buffer.length;
    this.addLog(`Buffer capacity changed to ${this.capacity} slots. Empty semaphore updated to ${this.emptySlots}.`, 'info');
    return true;
  }

  reset() {
    this.stopAutoRun();
    this.buffer = [];
    this.nextBookingId = 101;
    this.mutex = 1;
    this.emptySlots = this.capacity;
    this.fullSlots = 0;
    this.producerState = 'IDLE';
    this.consumerState = 'IDLE';
    this.producerBlockReason = '';
    this.consumerBlockReason = '';
    this.logs = [];
    this.addLog('Simulation reset. Buffer empty. Mutex = 1, Empty = ' + this.capacity + ', Full = 0.', 'system');
  }

  addLog(msg, type = 'info') {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs.unshift({ time, msg, type });
    if (this.logs.length > 30) this.logs.pop();
  }

  /**
   * Produce a booking request (Passenger submits reservation)
   */
  produce() {
    if (this.producerState === 'CRITICAL_SECTION') return;

    // Step 1: Check wait(empty)
    if (this.emptySlots === 0) {
      this.producerState = 'BLOCKED';
      this.producerBlockReason = 'Buffer FULL! (Empty Semaphore = 0). Producer must wait until Consumer frees a slot.';
      this.addLog(`🛑 PRODUCER BLOCKED: Buffer is completely full (${this.capacity}/${this.capacity}). wait(empty) suspended thread.`, 'danger');
      if (window.soundFx) window.soundFx.warning();
      return;
    }

    // Step 2: Check wait(mutex)
    if (this.mutex === 0) {
      this.producerState = 'BLOCKED';
      this.producerBlockReason = 'Critical section busy (Mutex = 0). Another thread is currently accessing the queue.';
      this.addLog('⏳ PRODUCER WAITING: Mutex is 0. Shared memory buffer is locked.', 'warning');
      return;
    }

    // Lock mutex
    this.mutex = 0;
    this.emptySlots--;
    this.producerState = 'CRITICAL_SECTION';
    this.producerBlockReason = '';

    const train = this.trainSamples[Math.floor(Math.random() * this.trainSamples.length)];
    const passenger = this.passengerNames[Math.floor(Math.random() * this.passengerNames.length)];
    const newBooking = {
      id: `BK-${this.nextBookingId++}`,
      trainNo: train.no,
      trainName: train.name,
      coachClass: train.class,
      passenger,
      pnr: `PNR-${Math.floor(1000000000 + Math.random() * 9000000000).toString().substring(0, 6)}`,
      timestamp: new Date().toLocaleTimeString()
    };

    this.addLog(`🔒 Mutex locked (0). wait(empty) decremented empty to ${this.emptySlots}. Adding ${newBooking.id}...`, 'info');

    // Simulate entry into buffer
    this.buffer.push(newBooking);
    this.fullSlots++;

    if (window.soundFx) window.soundFx.produce();

    // Release mutex
    this.mutex = 1;
    this.producerState = 'IDLE';

    this.addLog(`✅ PRODUCED ${newBooking.id} for "${passenger}" (${train.name}). signal(mutex) -> 1, signal(full) -> ${this.fullSlots}.`, 'success');

    // Unblock consumer if it was waiting on empty buffer
    if (this.consumerState === 'BLOCKED' && this.consumerBlockReason.includes('Buffer EMPTY')) {
      this.consumerState = 'IDLE';
      this.consumerBlockReason = '';
      this.addLog('🟢 CONSUMER UNBLOCKED: Item now available in buffer.', 'success');
    }
  }

  /**
   * Consume a booking request (IRCTC backend server processes reservation)
   */
  consume() {
    if (this.consumerState === 'CRITICAL_SECTION') return;

    // Step 1: Check wait(full)
    if (this.fullSlots === 0) {
      this.consumerState = 'BLOCKED';
      this.consumerBlockReason = 'Buffer EMPTY! (Full Semaphore = 0). Consumer must wait until Producer submits a request.';
      this.addLog('🛑 CONSUMER BLOCKED: Buffer is empty (0/' + this.capacity + '). wait(full) suspended thread.', 'danger');
      if (window.soundFx) window.soundFx.warning();
      return;
    }

    // Step 2: Check wait(mutex)
    if (this.mutex === 0) {
      this.consumerState = 'BLOCKED';
      this.consumerBlockReason = 'Critical section busy (Mutex = 0). Shared memory buffer locked by Producer.';
      this.addLog('⏳ CONSUMER WAITING: Mutex is 0. Waiting for lock release.', 'warning');
      return;
    }

    // Lock mutex
    this.mutex = 0;
    this.fullSlots--;
    this.consumerState = 'CRITICAL_SECTION';
    this.consumerBlockReason = '';

    this.addLog(`🔒 Mutex locked (0). wait(full) decremented full to ${this.fullSlots}. Reading queue...`, 'info');

    const item = this.buffer.shift();
    this.emptySlots++;

    if (window.soundFx) window.soundFx.consume();

    // Release mutex
    this.mutex = 1;
    this.consumerState = 'IDLE';

    this.addLog(`🎟️ CONSUMED & CONFIRMED ${item.id} (Passenger: ${item.passenger}). signal(mutex) -> 1, signal(empty) -> ${this.emptySlots}.`, 'success');

    // Unblock producer if it was waiting on full buffer
    if (this.producerState === 'BLOCKED' && this.producerBlockReason.includes('Buffer FULL')) {
      this.producerState = 'IDLE';
      this.producerBlockReason = '';
      this.addLog('🟢 PRODUCER UNBLOCKED: Free slot created in buffer.', 'success');
    }
  }

  toggleAutoRun() {
    if (this.isAutoRunning) {
      this.stopAutoRun();
    } else {
      this.startAutoRun();
    }
    return this.isAutoRunning;
  }

  startAutoRun() {
    this.isAutoRunning = true;
    this.autoTimer = setInterval(() => {
      // Semi-random: 55% produce, 45% consume to demonstrate both filling & draining
      const action = Math.random() < 0.55 ? 'produce' : 'consume';
      if (action === 'produce') {
        this.produce();
      } else {
        this.consume();
      }
    }, this.autoInterval);
  }

  stopAutoRun() {
    this.isAutoRunning = false;
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  /**
   * Bilingual explanation generator
   */
  getExplanation() {
    const en = `
      <p><strong>1. How does the Railway Booking Queue map to Producer–Consumer?</strong><br>
      - <strong>Producer (User / App):</strong> Generates passenger ticket reservation requests.<br>
      - <strong>Bounded Buffer (IRCTC Request Queue):</strong> A shared fixed-size memory pool (currently capacity = <strong>${this.capacity}</strong> slots) holding pending bookings.<br>
      - <strong>Consumer (Reservation Backend Server):</strong> Reads requests from buffer, processes payment, allocates berth, and confirms PNR.</p>

      <p><strong>2. Role of the Synchronization Semaphores:</strong><br>
      - <strong>Mutex (Binary Semaphore, value = 0 or 1):</strong> Guarantees Mutual Exclusion. Only ONE process can write to or read from the queue array at any single microsecond. This prevents race conditions like duplicate berth assignment!<br>
      - <strong>Empty Semaphore (Counting Semaphore, starts at N = ${this.capacity}):</strong> Counts available empty slots. Decremented before adding (<code>wait(empty)</code>); incremented after consuming (<code>signal(empty)</code>).<br>
      - <strong>Full Semaphore (Counting Semaphore, starts at 0):</strong> Counts occupied slots ready to be processed. Decremented before consuming (<code>wait(full)</code>); incremented after producing (<code>signal(full)</code>).</p>

      <p><strong>3. Boundary Conditions to Observe:</strong><br>
      - <strong>Buffer Full (Empty = 0):</strong> When all ${this.capacity} slots are full, Producer is blocked from adding until Consumer frees at least one slot.<br>
      - <strong>Buffer Empty (Full = 0):</strong> When 0 tickets are in queue, Consumer is blocked from reading until a passenger books a ticket.</p>
    `;

    const hi = `
      <p><strong>1. Railway Reservation mein Producer-Consumer ka kya kaam hai?</strong><br>
      - <strong>Producer (Passenger / App):</strong> Booking request generate karta hai.<br>
      - <strong>Buffer (Request Queue):</strong> Server par pending ticket requests ka bounded queue hai (size = <strong>${this.capacity}</strong> slots).<br>
      - <strong>Consumer (IRCTC Booking Engine):</strong> Request ko process karke seat confirm karta hai.</p>

      <p><strong>2. Mutex aur Semaphores ka role (Viva Tip):</strong><br>
      - <strong>Mutex (Mutual Exclusion):</strong> Ek binary lock hai. Agar producer queue mein ticket daal raha hai, toh consumer usi second queue ko chhed nahi sakta. Isse race condition aur double-booking rukti hai.<br>
      - <strong>Empty Semaphore:</strong> Khali slots ka hisaab rakhta hai. Jab buffer bhar jata hai (Empty = 0), toh Producer ruk (block) jata hai.<br>
      - <strong>Full Semaphore:</strong> Bhare hue slots ka hisaab rakhta hai. Jab buffer khali hota hai (Full = 0), toh Consumer ruk jata hai.</p>

      <p><strong>3. Examiner ko kya bolna hai?</strong><br>
      "Mam/Sir, browser actual OS threads nahi run karta, lekin ye simulation Dijkstra ke classic Semaphore algorithm (wait/signal) ko exact logic ke saath visually demonstrate karta hai."</p>
    `;

    return { en, hi };
  }
}

window.ProducerConsumerSimulation = ProducerConsumerSimulation;
window.producerConsumer = new ProducerConsumerSimulation();
