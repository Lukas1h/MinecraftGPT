import { register } from "mojang-gametest";
import { world, BlockLocation, Location, } from "mojang-minecraft";
import { TimedQueue } from "./TimedQueue.js";
const START_TICK = 100;
// global variables
let curTick = 0;
let overworld = world.getDimension("overworld");
let taskStack = new TimedQueue();
let bot;
class Bot {
    constructor(name, test) {
        this.isBotSpawned = false;
        this.action = 0;
        this.name = name;
        this.sim = test.spawnSimulatedPlayer(new BlockLocation(1, 0, 1), this.name, 0);
        this.player = Array.from(world.getPlayers())[0];
        this.test = test;
        this.sim.runCommand("say Sim Init'ed ");
        taskStack.setInterval(() => {
            this.sim.lookAtLocation(this.test.relativeLocation(this.player.headLocation));
        }, 100);
    }
    evaluate(code, args = {}) {
        return function evaluateEval() {
            const argsStr = Object.keys(args)
                .map((key) => `${key} = this.${key}`)
                .join(",");
            const argsDef = argsStr ? `let ${argsStr};` : "";
            return eval(`(async () => {${argsDef}${code}})();`);
        }.call(args);
    }
    goToEntity(player) {
        this.sim.runCommand("say Going to " + player.name);
        this.action = taskStack.setInterval(() => {
            if (player.location.isNear(this.sim.location, 3)) {
                this.sim.runCommand("say Near " + player.name + ". Stoping.");
                taskStack.clearInterval(this.action);
            }
            else {
                this.sim.runCommand("say Still going to " + player.name);
                this.sim.navigateToLocation(this.test.relativeLocation(player.location));
            }
        }, 100);
    }
    goToLoc(loc) {
        this.sim.runCommand("say Going to " + loc);
        this.action = taskStack.setInterval(() => {
            if (loc.isNear(this.sim.location, 3)) {
                this.sim.runCommand("say Near " + loc + ". Stoping.");
                taskStack.clearInterval(this.action);
            }
            else {
                this.sim.runCommand("say Still going to " + loc);
                this.sim.navigateToLocation(this.test.relativeLocation(loc));
            }
        }, 100);
    }
    followEntity(player) {
        this.sim.runCommand("say Going to " + player.name);
        this.action = taskStack.setInterval(() => {
            if (player.location.isNear(this.sim.location, 3)) {
                this.sim.runCommand("say Near " + player.name + ". Stoping.");
            }
            else {
                this.sim.runCommand("say Still going to " + player.name);
                this.sim.navigateToLocation(this.test.relativeLocation(player.location));
            }
        }, 100);
    }
}
register("friend", "spawn", (test) => {
    bot = new Bot("Robo Steve", test);
    bot.goToEntity(bot.player);
}).maxTicks(72000);
function gameTick() {
    curTick++;
    taskStack.processTick();
}
const propts = {
    move: ["come", "stand", "stay here"],
    go: ["go"],
    follow: ["follow", "stay with me", "come with"],
    jump: ["jump", "hop", "dance"],
    cmd: ["cmd "],
    eval: ["eval "],
    stop: ["halt", "stop", "stay", "sit", "stand here", "stand there"],
};
world.events.beforeChat.subscribe((chat) => {
    let msg = chat.message.replace("the", "").replace("a", "").replace("an", "");
    let verb = msg.split(" ")[0];
    let obj = msg.split(" ")[0];
    if (propts["move"].some((v) => msg.includes(v))) {
        bot.goToEntity(bot.player);
    }
    if (propts["go"].some((v) => msg.includes(v))) {
        bot.goToLoc(blockToLoc(bot.player.getBlockFromViewVector().location));
    }
    if (propts["follow"].some((v) => msg.includes(v))) {
        bot.followEntity(bot.player);
    }
    if (propts["jump"].some((v) => msg.includes(v))) {
        bot.sim.jump();
    }
    if (propts["cmd"].some((v) => msg.includes(v))) {
        bot.sim.runCommand(msg.replace("cmd ", ""));
    }
    if (propts["eval"].some((v) => msg.includes(v))) {
        bot.evaluate(msg.replace("eval ", ""), {
            setTimeout: taskStack.setTimeout.bind(taskStack),
            sleep: taskStack.sleep.bind(taskStack),
            clearTimeout: taskStack.clearTimeout.bind(taskStack),
            setInterval: taskStack.setInterval.bind(taskStack),
            clearInterval: taskStack.clearInterval.bind(taskStack),
            bot: bot,
            overworld: overworld,
        });
    }
    if (propts["stop"].some((v) => msg.includes(v))) {
        taskStack.clearInterval(bot.action);
    }
});
function blockToLoc(block) {
    return new Location(block.x, block.y, block.z);
}
function locToBLock(block) {
    return new BlockLocation(block.x, block.y, block.z);
}
world.events.tick.subscribe(gameTick);

//# sourceMappingURL=../../_cottaDebug/main.js.map
