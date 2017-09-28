/* microbusarchitecture.js < datafile */

const readline = require('readline');
const memory = readline.createInterface({ input: process.stdin });

// CPU Class
class CPU {
  constructor() { 
    this.instructionSet = new InstructionSet();

    // State variables
    this.PC = 0; 		// Program Counter
    this.state = null;          // one of INITIALIZE, SET, SAVE, MUL, PRINT
    this.data = null;           // the current instruction as data
    this.register = [];         // registers #0, #1, #2, #3, ...
    this.activeRegister = null; // a register #
    this.nextInstructionRegister = null; // holds the next instruction
    this.mulRegister = [];      // register #s, pointing to main register #
    this.mulIndex = 0;          // 0 or 1
    this.error = [];		// holds error messages
  }

  // State methods
  init() {
    this.PC = 0;
    this.register = [];
    this.mulRegister = [];
    this.mulIndex = 0;
    this.activeRegister = null;
    this.nextInstructionRegister = null;
    this.data = null;
    this.state = null;
    this.error = [];
  }

  setState() {
    this.state = this.data;
  }

  clearState() {
    this.state = null;
    this.data = null;
    this.mulRegister = [];
    this.mulIndex = 0;
  }

  incrementProgramCounter() {
    this.PC++;
  }
  

  /****************************************************************************************************
    CPU MAIN LOGIC                                                                                    *
  *****************************************************************************************************/

  // RUN
  run() {
    // Read and Eval stdin line-by-line
    memory.on('line', (data) => {
      this.eval(data);
      this.incrementProgramCounter();
    });

    // EOF
    memory.on('close', () => {
      if (!this.error.length) {
        console.log('Process terminated successfully');
      } else {
        console.log(`Process terminated, but found the following error(s):\n ${this.error}`);
      }
    });
  }

  // EVAL
  eval(data) {
    const instruction = CPU.stripComment(data);
    if (CPU.isEmpty(instruction)) return;

    try { // catch and report all errors but continue processing

      // if state is set, continue executing that state, passing the
      // instruction in as data;
      // otherwise set state to the instruction and execute it
      this.nextInstructionRegister = this.state ? this.state : instruction;
      this.data = instruction;

      /* HEART */
      this.instructionSet.inst(this.nextInstructionRegister)(this);

    } catch(e) { // catch and log error messages
      this.error.push(e.message);
      console.log(`error ${e.message} at ${this.PC}: ${instruction}`);
    }
  }

  /*****************************************************************************************************/


  // CPU Class Methods
  static get COMMENT() {
    return /\s*#.*$/;
  }

  static get EMPTY_STRING() {
    return '';
  }

  static isEmpty(i) {
    return i === CPU.EMPTY_STRING;
  }

  static stripComment(data) {
    return data.replace(CPU.COMMENT, CPU.EMPTY_STRING);
  }

  static binary(byte) {
    return Number('0b' + byte);
  }
}





/****************************************************************************************************
 THE CPU INSTRUCTION SET                                                                            *
****************************************************************************************************/

class InstructionSet {
  constructor() {
    this.instruction = {
      // Each instruction contains a description, and a higher-order function;
      // The CPU  instantiates this class,  then executes the  functions based
      // upon the  current instruction  value; the CPU  gives each  function a
      // reference  to  itself,  which   the  instruction  can  manipulate  as
      // necessary.

      // single-step instructions just execute and return
      '00000001': { description: 'INITIALIZE',
                    fn: (cpu) => {cpu.init() }
                  },

      // multistep instructions set state, branch on state, and clear state
      '00000010': { description: 'SET',
                    fn: (cpu) => {
                      if (cpu.state) {
                        cpu.activeRegister = CPU.binary(cpu.data);
                        cpu.clearState();
                      } else {
                        cpu.setState();
                      }
                    }
                  },

      '00000100': { description: 'SAVE',
                    fn: (cpu) => {
                      if (cpu.state) {
                        cpu.register[cpu.activeRegister] = cpu.data;
                        cpu.clearState();
                      } else {
                        cpu.setState();
                      }
                    }
                  },

      '00000101': { description: 'MUL',
                    fn: (cpu) => {
                      if (cpu.state) {
                        cpu.mulRegister[cpu.mulIndex++] = CPU.binary(cpu.data);
                        if (cpu.mulIndex === 2) {
                          cpu.register[cpu.activeRegister] =
                            cpu.register[cpu.mulRegister[0]] * cpu.register[cpu.mulRegister[1]];
                          cpu.clearState();
                        }
                      } else {
                        cpu.setState();
                      }
                    }
                  },

      '00000110': { description: 'PRINT_NUMERIC',
                    fn: (cpu) =>
                    { console.log(CPU.binary(cpu.register[cpu.activeRegister])) }
                  },

      '00000111': { description: 'PRINT_ALPHA',
                    fn: (cpu) => { console.log(String.fromCharCode(CPU.binary(cpu.register[cpu.activeRegister]))) }
                  },
    }
  }

  // InstructionSet Helper Methods
  inst(i) {
    return this.instruction[i].fn;
  }

  desc(i) {
    return this.instruction[i].description;
  }

  toString(i) {
    return i + ': ' + this.instruction[i].description;
  }
}




/****************************************************************************************************/
// Let'er Rip!
new CPU().run();
