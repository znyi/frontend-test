export default class LineBreakTransformer {

    terminator = [0x0D, 0x0A] //\r\n
    terminatorIndex

    constructor() {
      this.container = [];
    }
  
    transform(chunk, controller) {
        chunk.forEach(elem=>this.container.push(elem));
        this.terminatorIndex = this.indexOfSubarray(this.container, this.terminator);
        while (this.terminatorIndex !== -1) {
          const line = this.container.slice(0, this.terminatorIndex + this.terminator.length);
          controller.enqueue(new Uint8Array(line.slice(0, -2))); //do not include \r and \n
          this.container = this.container.slice(this.terminatorIndex + this.terminator.length);
          this.terminatorIndex = this.indexOfSubarray(this.container, this.terminator);
        }
    }

    flush(controller) {
        if (this.container.length > 0) {
            controller.enqueue(new Uint8Array(this.container));
            console.log('lineFlushed')
            console.log(this.container)
        }
    }

    indexOfSubarray(array, subArray) {
      for (let i = 0; i <= array.length - subArray.length; i++) {
        if (this.arraysEqual(array.slice(i, i + subArray.length), subArray)) {
          return i;
        }
      }
      return -1;
    }

    arraysEqual(arr1, arr2) {
      return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
    }
  }