class Task {
    constructor(ticksLeftIn, funcIn) {
        this.ticksLeft = ticksLeftIn;
        this.func = funcIn;
        this.id = Task.taskIdCount++;
    }
    _promiseHandler(resolve, reject) {
        this._resolver = resolve;
        this._rejector = reject;
    }
}
Task.taskIdCount = 0;
/**
 * A stack to maintain functions scheduled by setInterval and setTimeout
 */
export class TimedQueue {
    constructor() {
        this.tasks = [];
    }
    /**
     * setTimeout implementation using ticks to delay a function call
     * @param fn a function to be run after a delay
     * @param delay The duration of time to wait before running the function (note that a tick is 50 milliseconds)
     * @returns a number between 1 and 10000 that can be used to cancel the task
     */
    setTimeout(fn, duration) {
        if (!duration) {
            duration = 50;
        }
        let task = new Task(Math.floor(duration / 50), fn);
        task.promise = new Promise(task._promiseHandler.bind(task));
        // console.warn(`pushing task ${task.id} on the stack with ${task.ticksLeft} ticks left`);
        this.tasks.push(task);
        return task.promise;
    }
    sleep(duration) {
        return this.setTimeout(undefined, duration);
    }
    /**
     * Clears the timed out function from the stack
     * @param taskProm the id of the task to cancel
     */
    clearTimeout(taskProm) {
        this.tasks = this.tasks.filter((task) => task.promise !== taskProm);
    }
    /**
     * setInterval implementation using ticks to run a function on a regular interval
     * @param fn a function to be run on a certain frequency
     * @param frequency The frequency in which to run the function in milliseconds (note that a tick is 50 milliseconds)
     * @returns
     */
    setInterval(fn, frequency) {
        console.warn(`setting interval for ${frequency}`);
        let task = new Task(Math.floor(frequency / 50), fn);
        task.frequency = Math.floor(frequency / 50);
        // console.warn(`pushing task ${task.id} on the stack with ${task.ticksLeft} ticks left`);
        this.tasks.push(task);
        return task.id;
    }
    /**
     * Clears the interval function from the stack
     * @param id the id of the task to cancel
     */
    clearInterval(id) {
        this.tasks = this.tasks.filter((task) => task.id !== id);
    }
    /**
     * Runs once every tick. Used to update the task stack (to support setInterval and setTimeout)
     */
    async processTick() {
        //update the task stack
        for (let i = 0; i < this.tasks.length; i++) {
            let task = this.tasks[i];
            task.ticksLeft--;
            if (task.ticksLeft <= 0) {
                if (task.func)
                    await task.func();
                if (task._resolver) {
                    task._resolver(task);
                }
                if (task.frequency) {
                    task.ticksLeft = task.frequency;
                }
                else {
                    this.tasks.splice(i, 1);
                    i--;
                }
            }
        }
    }
}

//# sourceMappingURL=../../_cottaDebug/TimedQueue.js.map
