var express = require('express');
var app = express();
// var pg = require('pg');  //Commented out until database implementation
var http = require('http').Server(app);
var io = require('socket.io')(http);
var google = require('google');
var async = require('async');

// Limit the results per page for testing
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
 *  The server file for the Critisearch app, handles client interaction
 *  and provides functionality on the back-end that controllers alone 
 *  are insufficient for.
 *
 *  @authors Michael Stewart, Joe Bruzek
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

function wrapperForInsert(result, newResult, connectionInfo, i) {
  return function(callback) {
    console.log('running task i:', i);
    console.log('running task result:', result.title);
    console.log(result.link);
    console.log(result.description);
    console.log(i);
    console.log(connectionInfo.currentQuery);
    console.log(result.title);
    connection.query(newResult, [
      result.link, 
      result.description, 
      i, 
      connectionInfo.currentQuery, 
      result.title
    ], function(error, results){
      console.log(error);
      console.log(results);

  //     { [Error: ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: Incorrect string value: '\xC9\xA1u\xCB\x90\xC9...' for column 'description' at row 1]
  // code: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
  // errno: 1366,
  // sqlState: 'HY000',
  // index: 0 }

  // happens when you query "google"

      // console.log(results.insertId);
      // result.id = results.insertId;
      callback(error, result);
    });
  };
}

function getTasks(processedResults, connectionInfo) {
  console.log('getTasks');
  var tasks = [];
  for (var i = 0; i < processedResults.length; i++) {
    var result = processedResults[i];
    result.order = i;
    console.log("result " + i + ": " + result.title);
    var newResult = 'insert into critisearch_results (link, description, result_order, query, title) values (?, ?, ?, ?, ?)';
    tasks.push(wrapperForInsert(result, newResult, connectionInfo, i));
  }
  console.log("Tasks: ------------------")
  return tasks;
}

//got the lists for this from: http://stackoverflow.com/q/16826200/1449799
 
function getName() {
  var firstName = ["Runny", "Buttercup", "Dinky", "Stinky", "Crusty",
  "Greasy","Gidget", "Cheesypoof", "Lumpy", "Wacky", "Tiny", "Flunky",
  "Fluffy", "Zippy", "Doofus", "Gobsmacked", "Slimy", "Grimy", "Salamander",
  "Oily", "Burrito", "Bumpy", "Loopy", "Snotty", "Irving", "Egbert", "Waffer", "Lilly","Rugrat","Sand", "Fuzzy","Kitty",
   "Puppy", "Snuggles","Rubber", "Stinky", "Lulu", "Lala", "Sparkle", "Glitter",
   "Silver", "Golden", "Rainbow", "Butt", "Rain", "Stormy", "Wink", "Sugar",
   "Twinkle", "Star", "Halo", "Angel"];
 
  // var middleName =["Waffer", "Lilly","Rugrat","Sand", "Fuzzy","Kitty",
  //  "Puppy", "Snuggles","Rubber", "Stinky", "Lulu", "Lala", "Sparkle", "Glitter",
  //  "Silver", "Golden", "Rainbow", "Butt", "Rain", "Stormy", "Wink", "Sugar",
  //  "Twinkle", "Star", "Halo", "Angel"];
 
  var lastName1 = ["Snicker", "Buffalo", "Gross", "Bubble", "Sheep",
   "Corset", "Toilet", "Lizard", "Waffle", "Kumquat", "Burger", "Chimp", "Liver",
   "Gorilla", "Rhino", "Emu", "Pizza", "Toad", "Gerbil", "Pickle", "Tofu", 
  "Chicken", "Potato", "Hamster", "Lemur", "Vermin"];
 
  var lastName2 = ["face", "dip", "nose", "brain", "head", "breath", 
  "pants", "shorts", "lips", "mouth", "muffin", "butt", "bottom", "elbow", 
  "honker", "toes", "buns", "spew", "kisser", "fanny", "squirt", "chunks", 
  "brains", "wit", "juice", "shower"];
 
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
 
  return firstName[getRandomInt(0, firstName.length)] + " " + 
    // middleName[getRandomInt(0, middleName.length)] + " " +
    lastName1[getRandomInt(0, lastName1.length)] + 
    lastName2[getRandomInt(0, lastName2.length)];
}

/**
 * add a student to the user table
 */
function addStudent(classId, cb) {
  var name = getName();
  var searchName = 'select * from users where name=?';
  connection.query(searchName, [name], function(error, results) {
    // cgeck err
    if (results.length > 0) {
      console.log("Name taken, chosing a new name");
      addStudent(classId, cb);
    } else {
      var addStudent = 'insert into users (name) values (?)';
      connection.query(addStudent, [name], function(error, results) {
        var userId = results.insertId;
        var membershipQuery = 'insert into critisearch_role_memberships (uid, role_id, gid) values (?, ?, ?)';
        connection.query(membershipQuery, [userId, 2, classId], function(error, results) {
          console.log("Added user " + userId + " to class " + classId);
          if (error) {
            cb(error);
          } else if (results) {
            console.log(results);
            cb(null, {username:name});
          }
        });
      });
    }
  });
  // return {username: name};
}

/**
 * get an array of names for the class, add them to the class
 * and create them as users.
 */
function getNames(count, classId) {
  var names = [];
  for (var i = 0; i < count; i++) {
    names.push(function(cb) {
      addStudent(classId, cb);
    });
  }
  return names;
}

function getClasses(connectionInfo, socket) {
  var detailsQuery = 'SELECT g.name as "name", others.name as "username", g.gid ' +
    'from critisearch_groups g ' +
    'JOIN critisearch_role_memberships m on m.gid=g.gid and m.role_id=2 ' +
    'join users others on others.id = m.uid ' +
    'WHERE g.owner=? order by g.gid;';
  connection.query(detailsQuery, [connectionInfo.teacherId], function(error, results) {
    //console.log(results);
    socket.emit('classes-loaded', results);
  });
}

/**
 * Get a random key. used by cookies
 * Packaged in a function for readability
 */
function getKey() {
  return Math.floor((Math.random() * 999999999) + 1);
}

/**
 * ~~ Activity ~~
 * The main functions of the server, listening for events on the client
 * side and responding appropriately.
 */
io.sockets.on('connection', function (socket) {
  console.log('>> Client Connected  >> ');
  var connectionInfo = {};

  var addClientQuery = 'insert into critisearch_clients (socket, connect) values (?, ?)';
  connection.query(addClientQuery, [socket.id, new Date()], function(error, results){
    console.log(error);
    console.log(results);
    if (results.hasOwnProperty('insertId')) {
      connectionInfo['dbId'] = results.insertId;
    }
  });
  
  /**
   * Will catch when a client leaves the app interface entirely and send
   * out the updated number of connected students for the teacher view.
   */
  socket.on('disconnect', function () {
    console.log('<< Client Disconnected << ');

    var addDisconnectTime = 'update critisearch_clients set disconnect = ? where id = ?';
    connection.query(addDisconnectTime, [new Date(), connectionInfo.dbId], function(error, results){
      console.log(error);
      console.log(results);
    });
  });

  /**
   *
   * Handle when someone tries to sign up
   */
  socket.on('signup', function(username, password, email) {
    console.log('Database add ' + username + ', ' + password + ', ' + email);

    var usernames = 'select * from users where name=?';

    connection.query(usernames, [username], function(error, results) {
      if (results.length > 0) {
        console.log("Username already exists");
      } else if (email != null) {
        var newUser = 'insert into users (name, password, email) values (?, ?, ?)'
        connection.query(newUser, [username, password, email], function(error, results) {
          console.log(results);

          connectionInfo['teacherId'] = results.insertId;
          socket.emit('login-teacher-done', {success: true});
        });
      } else {
        console.log("invalid email");
      }
    });

    // This works but who knows why
    /*if (connection.query(usernames, [username], function(error, results) {
        return (results.length > 0);
      })) {
      console.log("Username already exists");
    } else if (email != null) {
      var newUser = 'insert into user (name, password, email) values (?, ?, ?)'
      connection.query(newUser, [username, password, email], function(error, results) {
        socket.emit('userAdded', results);
      });
    } else {
      console.log("invalid email");
    }*/
  });

  /**
   *
   * Handle when someone tries to Log in
   */
  socket.on('login-teacher', function(details) {
    console.log('Searching for ' + details.username + ', ' + details.password);

    var newUser = 'select * from users where name=?';
    connection.query(newUser, [details.username], function(error, results) {
      if(results.length < 1) {
        console.log("No user found");
        socket.emit('login-failed');
      } else if (details.username == results[0].name && details.password == results[0].password) {
        console.log(results);
        console.log("User match");
        connectionInfo['teacherId'] = results[0].id;

        var data = {
          success: true,
          username: results[0].name,
          uid: results[0].id,
          key: getKey()
        }

        socket.emit('login-teacher-done', data);

        getClasses(connectionInfo, socket);
      }
    });
  });

  socket.on('check-cookies', function(cookies) {
    console.log('checking cookies');
    console.log(cookies);
    var cookieCheck = 'SELECT * FROM critisearch_cookies WHERE cookie_key=?';
    connection.query(cookieCheck, [cookies.key], function(error, results) {
      if (results.length > 0) {
        console.log(results);
        var data = {uid: cookies.uid};
        for (var i = 0; i < results.length; i++) {
          if (results[i].uid == cookies.uid) {
            data.newKey = getKey();
            console.log('FOUND COOKIES');
            socket.emit('cookies-login', data);
          }
        }
      }
    });
  });

  socket.on('update-cookies', function(cookies) {
    var removeKey = "DELETE FROM critisearch_cookies WHERE uid=?"
    connection.query(removeKey, [cookies.uid], function(error, results) {
      console.log("remove");
      console.log(error);
    });

    var updateKey = "INSERT INTO critisearch_cookies (uid, cookie_key) values (?, ?)";
    connection.query(updateKey, [cookies.uid, cookies.key], function(error, results) {
      console.log(error);
      console.log(results);
      socket.emit('cookies-updated');
    });
  });

  socket.on('teacher-details', function(id) {
    console.log(id);
    connectionInfo['teacherId'] = id;
    var teacherDetails = 'SELECT * FROM users WHERE id=?';
    connection.query(teacherDetails, [id], function(error, results) {
      console.log("GETTING DETAILS");
      console.log(id);
      console.log(results[0]);
      var details = {
        username: results[0].name,
        uid: results[0].id
      }

      getClasses(connectionInfo, socket);

      socket.emit('teacher-details-done', details);
    });
  });

  /**
   * when the teacher creates a new class
   */
  socket.on('create-class', function(name, number) {
    var newClassQuery = 'insert into critisearch_groups(name, owner) values (?, ?)';
    console.log(connectionInfo.teacherId);
    connection.query(newClassQuery, [name, connectionInfo.teacherId], function(error, results) {
      console.log("create class");
      console.log(results);
      var groupId = results.insertId;

      var teacherRole = 'insert into critisearch_role_memberships (uid, role_id, gid) values (?, ?, ?)';
      connection.query(teacherRole, [connectionInfo.teacherId, 1, groupId], function(error, results) {
      });

      async.parallel(getNames(number, groupId), function(error, results) {
        if (error) {
          console.log(error);
        } else if (results) {
          console.log("result being logged");
          console.log(results);
          socket.emit('class-created', name, groupId, results);
        }
      });

      //return the names list toat goes with this class
      
    });
  });

  socket.on('delete-class', function(id) {
    console.log("Deleting class " + id);
    var deleteQuery = 'DELETE FROM critisearch_role_memberships WHERE gid=?;';
    connection.query(deleteQuery, [id], function(error, results) {
    });
    deleteQuery = 'DELETE FROM critisearch_groups WHERE gid=?;';
    connection.query(deleteQuery, [id], function(error, results) {
      socket.emit('class-deleted', id);
    });
  });

  socket.on('add-students', function(id, number) {
    // getNames(number, id, connectionInfo.teacherId)
  });

  socket.on('login-student', function(details) {
    console.log('Searching for ' + details.sillyname);

    var newUser = 'select * from users where name=?';
    connection.query(newUser, [details.sillyname], function(error, results) {
      results[0].success = false;
      console.log("Looking for " + results[0].name);
      if (details.sillyname == results[0].name) {
        results[0].success = true;
        console.log("User match");
      }

      var user = results[0];

      var findGroup = 'select * from critisearch_role_memberships where uid=?';
      connection.query(findGroup, [user.id], function(error, results) {
        if (error == null) {
          user.groupId = results[0].gid;
          socket.join(user.groupId);
          socket.emit('login-student-done', user);
        }
      })
    });
  });

  socket.on('teacher', function(groupId) {
    console.log('Teacher Joined')
    socket.join(groupId);
    var oldResults = 'SELECT q.query FROM critisearch_queries q ' +
      'join critisearch_role_memberships m on m.uid=q.searcher ' +
      'where m.gid=? and time > date_sub(now(),INTERVAL 90 MINUTE) order by time desc;';
    connection.query(oldResults, [groupId], function(error, results) {
      socket.emit('oldQueries', results);
    });
  });

  socket.on('info-for-server', function(msg) {
    console.log(msg.data);
  });

  socket.on('promoted', function(result) {
    var promotedQuery = 'insert into critisearch_events (type, time, client, query, result) values (?, ?, ?, ?, ?)';
    if (result.uid == '') {
      connection.query(promotedQuery, [3, new Date(), connectionInfo.dbId, connectionInfo.currentQuery, result.id], function(error, results) {
      });
    } else {
      connection.query(promotedQuery, [3, new Date(), result.uid, connectionInfo.currentQuery, result.id], function(error, results) {
      });
    }
  });

  socket.on('demoted', function(result) {
    var promotedQuery = 'insert into critisearch_events (type, time, client, query, result) values (?, ?, ?, ?, ?)';
    if (result.uid == '') {
      connection.query(promotedQuery, [4, new Date(), connectionInfo.dbId, connectionInfo.currentQuery, result.id], function(error, results) {
      });
    } else {
      connection.query(promotedQuery, [4, new Date(), result.uid, connectionInfo.currentQuery, result.id], function(error, results) {
      });
    }
  });

  socket.on('follow', function(result) {
    var promotedQuery = 'insert into critisearch_events (type, time, client, query, result) values (?, ?, ?, ?, ?)';
    if (result.uid == '') {
      connection.query(promotedQuery, [2, new Date(), connectionInfo.dbId, connectionInfo.currentQuery, result.id], function(error, results) {
      });
    } else {
      connection.query(promotedQuery, [2, new Date(), result.uid, connectionInfo.currentQuery, result.id], function(error, results) {
      });
    }
  });

  socket.on('log-out-class', function(classId) {
    socket.broadcast.to(classId).emit('logout');
    console.log('log out the entire class: ' + classId);
  })


  /**
   * When the user searches
   */
  socket.on('q', function(details) {
    console.log("Group: " + details.group.id);
    socket.broadcast.to(details.group.id).emit('query', details.query);

    var newQuery = 'insert into critisearch_queries (query, searcher, time) values (?, ?, ?)';
    var searcher;
    if (details.hasOwnProperty('userId')) {
      searcher = details.userId;
    } else {
      searcher = connectionInfo.dbId;
    }
    console.log('SEARCHING ' + details.query, searcher, new Date());
    connection.query(newQuery, [details.query, searcher, new Date()], function(error, results){
      if (results.hasOwnProperty('insertId')) {
        var id = results.insertId;
        connectionInfo['currentQuery'] = id;

        //Log the query event to the database
        var newEvent = 'insert into critisearch_events (type, time, client, query) values (?, ?, ?, ?)';
        connection.query(newEvent, [1, new Date(), searcher, connectionInfo.currentQuery], function(error, results) {
        });
      }
    });

    google(details.query, function(err, next, results) {

      var processedResults = getProcessedResults(results);

      async.parallel(getTasks(processedResults, connectionInfo), function(error, results) {
        socket.emit('search-results', results);
      });

      // for (var x = 0; x < processedResults.length; x++) {
        
      //   var newResult = 'insert into critisearch_results (link, description, result_order, query, title) values (?, ?, ?, ?, ?)';

      //   connection.query(newResult, [processedResults[x].link, 
      //       processedResults[x].description, 
      //       x, 
      //       connectionInfo.currentQuery, 
      //       processedResults[x].title], function(error, results){
      //     console.log(error);
      //     console.log(results);
      //     console.log(results.insertId);

      //   });
      // }

    });
  });

  socket.on('critisort', function (uid) {
    var newEvent = 'insert into critisearch_events (type, time, client, query) values (?, ?, ?, ?)';
    if (uid == '') {
      connection.query(newEvent, [5, new Date(), connectionInfo.dbId, connectionInfo.currentQuery], function(error, results) {
      });
    } else {
      connection.query(newEvent, [5, new Date(), uid, connectionInfo.currentQuery], function(error, results) {
      });
    }
  });
});