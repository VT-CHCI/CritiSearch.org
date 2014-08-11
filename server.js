var express = require('express');
var app = express();
// var pg = require('pg');  //Commented out until database implementation
var http = require('http').Server(app);
var io = require('socket.io')(http);
var google = require('google');

google.resultsPerPage = 25;
// var nextCounter = 0;

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'critisearch',
  password : 'asdfjklj',
  database : 'critisearch'
});

connection.connect();
// connection.end();

//-------------------------------------------------------------------------
/**
 *  The server file for the ThoughtSwap app, handles client interaction
 *  and provides functionality on the back-end that controllers alone 
 *  are insufficient for.
 *
 *  @authors Michael Stewart, Adam Barnes
 *  @version v 0.0.0  (2014)
 */
//-------------------------------------------------------------------------

/**
 * ~~ Initialization ~~
 * Steps required to start up the app and provide future functions with
 * variables they will use.
 */
  app.use(express.static(__dirname + '/app'));

  var port = 3017;
  http.listen(port, function (){
    console.log('listening on *:', port);
  });

  // var allThoughts = {};
  // var chronologicalThoughts = [];
  // var newQuestion = '';

  // /**
  //  * Will return the number of unique ids in allThoughts which correlates
  //  * to the amount of submitters.
  //  */
  // function numSubmitters () {
  //   return Object.keys(allThoughts).length;
  // }

  // /**
  //  * [Needs proper description]
  //  */
  // function addThought (socket, thought) {
  //   chronologicalThoughts.push(thought);
  //   if (allThoughts.hasOwnProperty(socket.id)) {
  //     allThoughts[socket.id].push(thought);
  //   }
  //   else {
  //     //this means we just got a new submitter
  //     allThoughts[socket.id] = [thought];
  //     socket.broadcast.to('teacher').emit('num-submitters', numSubmitters());
  //   }
  // }

//-------------------------------------------------------------------------

function getProcessedResults (results) {
  var resultsToSend = [];
  for (var i=0; i<results.length; i++) {
    if (results[i].hasOwnProperty('link') && results[i].title.length > 0) {
      results[i].status = 0;
      resultsToSend.push(results[i]);
    }

    var images  = "Images for ";
    var news = "News for ";
    var maps = "Map for ";
    var youtube = "http://www.youtube.com/watch?v=";


    if (results[i].title.substr(0, images.length) == images
      || results[i].title.substr(0, news.length) == news
      || results[i].title.substr(0, maps.length) == maps) {
      console.log("Item removed: " + results[i].title);
      resultsToSend.pop();
    } else if (results[i].hasOwnProperty('link') && results[i].link != null){
      console.log(results[i].link);
      if (results[i].link.substr(0, youtube.length) == youtube) {
        results[i].description = "Youtube link";
      }
    }
    // for now just remove these
    //if results[i].title == Images for... && results[i].link == null
    //   make a image search of google, and send back the picture data
  }
  return resultsToSend;
}

/**
 * ~~ Activity ~~
 * The main functions of the server, listening for events on the client
 * side and responding appropriately.
 */
 io.sockets.on('connection', function (socket) {
  console.log('>> Client Connected  >> ');
  var connectionInfo = {};

  var addClientQuery = 'insert into client (socket, connect) values (?, ?)';
  connection.query(addClientQuery, [socket.id, new Date()], function(error, results){
    console.log(error);
    console.log(results);
    if (results.hasOwnProperty('insertId')) {
      connectionInfo['dbId'] = results.insertId;
    }
  });



  //
  // SQL:
  // add info: insert into TABLENAME (col1, col2) values (val1, val2);
  // update info: update TABLENAME set col1=val1, col2=val2 where id=3
  // find info: select col1, col2 from TABLENAME where CLAUSE
  // find info: select * from TABLENAME where CLAUSE
  // 
  // 
  // 
  // if (io.nsps['/'].adapter.rooms.hasOwnProperty('student')) {
  //   console.log('>> Client Connected  >> ', 
  //      Object.keys(io.nsps['/'].adapter.rooms['student']).length);
    
  //   socket.broadcast.emit('num-students', 
  //      Object.keys(io.nsps['/'].adapter.rooms['student']).length);
  // }
  
  /**
   * Will catch when a client leaves the app interface entirely and send
   * out the updated number of connected students for the teacher view.
   */
  socket.on('disconnect', function () {
    console.log('<< Client Disconnected << ');

    var addDisconnectTime = 'update client set disconnect = ? where id = ?';
    connection.query(addDisconnectTime, [new Date(), connectionInfo.dbId], function(error, results){
    console.log(error);
    console.log(results);
  });
    // if (io.nsps['/'].adapter.rooms.hasOwnProperty('student')) {
      
    //   socket.broadcast.emit('num-students', 
    //       Object.keys(io.nsps['/'].adapter.rooms['student']).length);
    // }
  });

  socket.on('teacher', function() {
    console.log('Teacher Joined')
    socket.join('teacher');
    var oldResults = 'SELECT * FROM query where time > date_sub(now(),INTERVAL 90 MINUTE) order by time desc;';
    connection.query(oldResults, function(error, results) {
      socket.emit('oldQueries', results);
    });
  });

  socket.on('info-for-server', function(msg) {
    console.log(msg.data);
  });

  socket.on('q', function(q) {

    socket.broadcast.to('teacher').emit('query', q);

    var newQuery = 'insert into query (query, searcher, time) values (?, ?, ?)';
    console.log(q, connectionInfo.dbId, new Date());
    connection.query(newQuery, [q, connectionInfo.dbId, new Date()], function(error, results){
      console.log(error);
      console.log(results);
      if (results.hasOwnProperty('insertId')) {
        connectionInfo['currentQuery'] = results.insertId;
      }
    });

    google(q, function(err, next, results) {

      var processedResults = getProcessedResults(results);
      
      socket.emit('search-results', processedResults);

      for (var x = 0; x < processedResults.length; x++) {
        
        var newResult = 'insert into result (link, description, result_order, query, title) values (?, ?, ?, ?, ?)';

        connection.query(newResult, [processedResults[x].link, 
            processedResults[x].description, 
            x, 
            connectionInfo.currentQuery, 
            processedResults[x].title], function(error, results){
          console.log(error);
          console.log(results);
        });
      }

    });
  });

  /**
   * Will catch when a student submits a thought and send that info
   * to teachers
   */
  // socket.on('new-thought-from-student', function (newThought) {
  //   console.log('New Thought');
  //   addThought(socket, newThought);

  //   socket.broadcast.to('teacher').emit('new-thought-from-student', newThought);
  // });


  /**
   * Will listen for a prompt from teachers and send it along to students.
   */
  // socket.on('new-prompt', function (newPrompt) {
  //   console.log('Prompt recieved');
  //   socket.broadcast.to('student').emit('new-prompt', newPrompt);
  //   newQuestion = newPrompt;
  // });

  /**
   * Will catch when a teacher initiates a new session and set server
   * variables back to their initial state.
   */
  // socket.on('new-session', function () {
  //   console.log('new session initiated');
  //   socket.broadcast.emit('new-session');
  //   allThoughts = {};
  //   chronologicalThoughts = [];
  //   newQuestion = '';
  // })

  /**
   * Will catch when a teacher connects, then add them to the teacher
   * room after ensuring they are not in the student room, then update
   * counts accordingly. It will also sync available data for 
   * teachers who may have joined after a session has begun.
   */
  // socket.on('teacher', function () {
  //   console.log('Teacher Joined')
  //   socket.leave('student');
  //   socket.join('teacher');

  //   socket.emit('thought-sync', {thoughts:chronologicalThoughts,
  //     connected:Object.keys(io.nsps['/'].adapter.rooms['student']).length,
  //        submitters:numSubmitters()});

  //   socket.broadcast.emit('num-students', 
  //       Object.keys(io.nsps['/'].adapter.rooms['student']).length);
  // });

  /**
   * Will catch when a student connects, then add them to the student
   * room after ensuring they are not in the teacher room, then update
   * counts accordingly.
   */
  // socket.on('student', function () {
  //   //console.log(Object.keys(io.nsps['/'].adapter.rooms['student']).length); // This throws an error if uncommented
  //   socket.leave('teacher');
  //   socket.join('student');

  //   io.sockets.emit('prompt-sync', newQuestion);
    
  //   socket.broadcast.emit('num-students',
  //      Object.keys(io.nsps['/'].adapter.rooms['student']).length);
  // });

  /**
   * ~~ Primary Feature ~~
   * Will catch when a teacher chooses to distribute the thoughts
   * they have recieved. Performs the work nessessary to implement
   * distribution to each student.
   */
  // socket.on('distribute', function () {
  //   console.log('got distribute msg');

  //   /**
  //    * Shuffle algorithm for randomizing an array.
  //    */
  //   function shuffle (o) { //v1.0 courtesy of Google
  //     for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  //     return o;
  //   };

  //   /**
  //    * Initialize the two arrays to be distributed.
  //    */ 
  //   // var distribution = Object.keys(allThoughts);
  //   // var newDistribution = shuffle(distribution.slice());
  //   //console.log(distribution);
  //   //console.log(newDistribution);

  //   /**
  //    * Will loop through two arrays, returning true if a match
  //    * between them is found, false if no matches exists.
  //    */ 
  //   // function hasMatch (a, b) {
  //   //   for (var i = 0; i < a.length; i++) {
  //   //     if (a[i]==b[i]) {
  //   //       return true;
  //   //     }; 
  //   //   };
  //   //    return false;
  //   // };

  //   /**
  //    * Will take the shuffled arrays and reshuffle if nessessary
  //    * to ensure no student recieves the same thought they submitted.
  //    */
  //   // while(hasMatch(distribution, newDistribution)) {
  //   //   shuffle(newDistribution);
  //   // }

  //   //console.log('reshuffling complete');

  //   /**
  //    * Will methodically send each student their newly assigned
  //    * thought, traveling through the old distribution until completion.
  //    */
  //   // for (var i = 0; i < distribution.length; i++) {
  //   //   socket.to(distribution[i]).emit('new-distribution',
  //   //      allThoughts[newDistribution[i]]);  //adam fix this
  //   // } 
    
  //   //console.log('completed sending messages');
  // });
});