/*
ASSIGNMENT:

Using the ASCII table, a stack, a program counter, and a tiny set of
instructions: set, copy, and print, write a program that contains an array
of instructions, a "CPU" that reads them starting at index 0, and another
array containing the ASCII values, print "Hello world" using node. 

#inputfile
00000001 # initialize
00000010 # SET register
00000000 # register #0
00000100 # SAVE next
00001000 # 8
00000010 # SET register
00000001 # register #1
00000100 # SAVE next
00001001 # 9
00000010 # SET register
00000010 # register #3
00000101 # MUL into last
00000000 # register #0
00000001 # register #1
00000010 # SET register
00000010 # register #3
00000101 # PRINT_NUMERIC

*/

/* INSTRUCTION CYCLE
 * 
 * Fetch:
 * ======
 * The instruction  cycle begins with a  fetch, in which the  CPU places the
 * value of the PC on the address bus  to send it to the memory.  The memory
 * responds by sending the contents of that memory location on the data bus.
 * (This  is   the  stored-program  computer  model,   in  which  executable
 * instructions are  stored alongside ordinary  data in memory,  and handled
 * identically by it).
 *
 * Execution:
 * ==========
 * Following the  fetch, the CPU  proceeds to execution, taking  some action
 * based on the memory contents that it obtained.
 *
 * Update:
 * =======
 * At some  point in this cycle,  the PC will  be modified so that  the next
 * instruction executed is  a different one (typically,  incremented so that
 * the  next  instruction  is  the   one  starting  at  the  memory  address
 * immediately   following  the   last  memory   location  of   the  current
 * instruction).
 */

/* VERSION 0.1 */

/* This version is  not correct in that  it lets the  data control the flow,
rather  than letting  the processor  control  the flow,  but it  nonetheless
produces the correct answer; just need to tweak the logic to produce correct
flow.
*/

const readline = require('readline');
const stdin = process.stdin;

const COMMENT = /\s*#.*$/;
const EMPTY = '';
const SET  = '00000010';
const SAVE = '00000100';
const MUL  = '00000101';

class CPU {
  constructor() {
    this.Clock;

    this.PC; /* Program Counter -- a processor  register that indicates where a
               computer  is in  its program  sequence. the  PC is  incremented
               after fetching an instruction, and  holds the memory address of
               ("points  to") the  next  instruction that  would be  executed.
               Processors usually fetch instructions sequentially from memory.
               In a typical central processing unit (CPU), the PC is a digital
               counter.
            */

    this.IR; /* Instruction Register  -- holds the instruction  currently being
               executed or decoded.  In  simple processors each instruction to
               be executed is loaded into the instruction register which holds
               it while it  is decoded, prepared and  ultimately executed.  In
               the  instruction  cycle, the  instruction  is  loaded into  the
               Instruction register  after the  processor fetches it  from the
               memory location pointed by the program counter.
            */
    
    this.MAR; /* Memory Address Register -- MAR holds the memory location of
                data that  needs to be  accessed, i.e., the CPU  register that
                either  stores the  memory  address from  which  data will  be
                fetched to the  CPU or the address to which  data will be sent
                and stored.
             */

    this.MDR; /* Memory  Data  Register  --  When  reading  from  memory,  data
                addressed by  MAR is fed  into the MDR (memory  data register)
                and then  used by the  CPU.  When  writing to memory,  the CPU
                writes data from  MDR to the memory location  whose address is
                stored in MAR.
              */

    this.set;
    this.register_no;
    this.register; // array

    this.save;

    this.mul;
    this.mul_register;
    this.mul_array;
    this.mul_index;

    this.InstructionSet = {
      initialize: () => { /* clears and sets registers; loads instructions and data into memory */
        console.log('initializing the CPU...\n');
        this.Clock = 0;
        this.PC = 0;
        this.IR = 0;
        this.MAR = 0;
        this.MDR = 0;
        this.set = false;
        this.register_no = null;
        this.register = [];
        this.save = false;
        this.mul = false;
        this.mul_register = null;
        this.mul_array = [];
        this.mul_index = null;
      },
      
      '00000001': () => { /* INITIALIZE: initializes the CPU */ console.log('INITIALIZE'); this.InstructionSet['initialize'](); return; },
      
      '00000010': (r) => { /* SET: prepares a register to be set, and then sets it */ console.log('SET\n');
        if (this.set) {
          this.register_no = CPU.registerNo(r);
          this.set = false;
        }
        else {
          this.set = true;
        }
        return;
      },

      '00000100': (d) => { /* SAVE: saves data into a register prepared by set */ console.log('SAVE\n');
        if (this.save) {
          this.register[this.register_no] = d;
          this.save = false;
          this.register_no = null;
        }
        else {
          this.save = true;
        }
        return;
      },

      '00000101': (r) => { /* MUL: multiplies two registers and places the result in a third register */ console.log('MUL\n');
        if (this.mul) {
          this.mul_array[this.mul_index++] = r
          if (this.mul_index === 2) {
            const mult = CPU.binary(this.register[CPU.binary(this.mul_array[0])]) * CPU.binary(this.register[CPU.binary(this.mul_array[1])]);
            this.register[this.mul_register] = mult;
            this.mul = false;
            this.mul_index = null;
            this.mul_array = [];
          }
        }
        else {
          this.mul = true;
          this.mul_register = this.register_no;
          this.mul_index = 0;
        }
        return;
      },

      '00001001': () => { /* PRINT_NUMERIC: prints to the console the numeric value of a register */ console.log('PRINT_NUMERIC\n')
        console.log(`The result is ${this.register[this.register_no]}\n`);
        return;
      },
    }
  }

  eval (instruction) {
    const inst = CPU.removeComment(instruction);
    console.log(`${inst}`);
    if (inst === EMPTY) {console.log('ignoring comment...\n'); return; }

    if (this.set) {
      this.InstructionSet[SET](inst);
      return;
    }

    if (this.save) {
      this.InstructionSet[SAVE](inst); // here, inst is data
      this.state();
      return;
    }

    if (this.mul) {
      this.InstructionSet[MUL](inst);
      return;
    }

    if (this.InstructionSet[inst]) {
      this.InstructionSet[inst]();
    }
    else {
      console.log(`illegal inst: ${inst}`);
      this.state();
      throw 'Illegal Instruction';
    }
    return;
  }

  processProgram () {
    console.log('starting process...\n');
    this.PC = 0;

    const rl = readline.createInterface({
      input: stdin
    });

    rl.on('line', (line) => {
      console.log(`${line}`);
      this.state();
      this.eval(line);
      this.PC++;
    });

    rl.on('close', () => {
      console.log('done');
    });
  }

  state() {
    console.log('STATE:\n======');
    console.log(`PC: ${this.PC}`);
    console.log(`set:  ${this.set}`);
    console.log(`register_no: ${this.register_no}`);
    console.log('registers: ', this.register);
    
    console.log(`save: ${this.save}`);
    console.log(`mul:  ${this.mul}`);
    console.log(`mul_register: ${this.mul_register}`);
    console.log(`mul_index: ${this.mul_index}`);
    console.log(`mul_array: ${this.mul_array}`);
    console.log('--------------------\n');
  }

  static removeComment(inst) {
    return inst.replace(COMMENT, EMPTY);
  }

  static registerNo(inst) {
    switch (inst) {
    case '00000000': // register #0
      return 0;
      break;
    case '00000001': // register #1
      return 1;
      break;
    case '00000010': // register #3
      return 3;
      break
    default:
      throw 'Illegal register number';
    }
  }

  static binary(num) {
    return Number('0b' + num);
  }
}

const cpu = new CPU();
cpu.processProgram();
