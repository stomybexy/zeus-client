var transport = require('./lib/transport')
var Repository = require('./lib/repository')
var RemoteRepository = require('./lib/remoteRepository')
var TransactionRepository = require('./lib/transactionRepository')
var Engine = require('tingodb')()



var opts = {
    // All properties optional, defaults shown 
    host: "localhost",
    port: 3000,
    ssl: false,
    autoReconnect: false,
    // autoReconnectTimer: 500,
    maintainCollections: true,
    reconnectInterval: 5000,
    ddpVersion: '1' // ['1', 'pre2', 'pre1'] available 

}

var tp = transport.createTransport(opts)
setTimeout(function() {
    tp.start()
}, 0);
// tp.start()
    // setTimeout(function() {
    //     console.log("Closing after 1 min")
    //     tp.stop()
    // }, 60000)

var repoOpts = {
    collName: "config",
    db: new Engine.Db("./db", {}),
    transport: tp,
    upsert: true
}
// console.log("creating remote repository config")
// var config = RemoteRepository.create(repoOpts)
// setTimeout(function() {

//     setTimeout(function() {
//         function cb(err, docs) {
//             console.log("config collections list", docs)
//         }
//         config.find({}, cb)

//     }, 10);

// }, 60000)

var tr = TransactionRepository.create({
    dbPath: './tdb/tran.db'
})

tr.on('ready', function(){
    console.log("Transaction manager ready!")
})


// console.log("config class = ", (config instanceof Repository.getClass()))



// config.on("ready", function() {
//     console.log("Repository config is ready")
//         // config.remove({}, function(err, res) {
//         //     console.log("Removed all", err, res)
//         // })
//     // config.update({
//     //     _id: 7
//     // }, {
//     //     $set: {
//     //         name: "My config modified",
//     //         updatedAt: new Date()
//     //     }
//     // }, function(err, res) {
//     //     console.log("Updated config", err, res)
//     // })
//     // setTimeout(function() {
//     //     // config.insert({
//     //     //     name: "My config",
//     //     //     createdAt: new Date()
//     //     // }, {}, function(err, res) {
//     //     //     console.log("insert result", err, res)
//     //     // })

//     //     config.findOne({_id:7}, function(err, docs) {
//     //         console.log(err, docs)
//     //     })
//     // }, 100);


// })
