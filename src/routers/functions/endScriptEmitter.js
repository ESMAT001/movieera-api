//import event emitter
const { EventEmitter } = require('events');
const { closeDb } = require('../../db');
const emitter = new EventEmitter();

//subscribe to the event
emitter.on('exit', () => {
    if (global.serverListener) {
        console.log('exiting...')
        global.serverListener.close(async () => {
            await closeDb();
            console.log('Process terminated')
            // console.log(process._getActiveRequests())
            // console.log(process._getActiveHandles())
            // process.kill(process.pid, 'SIGKILL')
        })
    }
})

module.exports = emitter;