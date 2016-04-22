'use strict';

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

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http); // api docs: http://socket.io
var google = require('google'); // api docs: https://www.npmjs.com/package/google
// var async = require('async');  //probbaly shouldn't need this now with promises
var models = require('./models');
var _ = require('lodash');

// Limit the results per page for testing
google.resultsPerPage = 10;

/**
 * ~~ Initialization ~~
 * Steps required to start up the app and provide future functions with
 * variables they will use.
 */
models.start()
  .then(function() {
    // here we will put any code that should wait for the db to be ready.

    // serve static files from the app directory, directly, without "app/" in URL
    app.use(express.static(__dirname + '/app'));

    var port = 3017;
    http.listen(port, function() {
      console.log('listening on *:', port);
    });

  });





//-------------------------------------------------------------------------

// filters out google's enhanced results
function getProcessedResults(results) {
  console.log(results);
  var resultsToSend = [];
  for (var i = 0; i < results.length; i++) {
    if (results[i].hasOwnProperty('link') && results[i].title.length > 0) {
      results[i].status = 0;
      resultsToSend.push(results[i]);
    }

    var images = "Images for ";
    var news = "News for ";
    var maps = "Map for ";
    var youtube = "http://www.youtube.com/watch?v=";


    if (results[i].title.substr(0, images.length) == images || results[i].title.substr(0, news.length) == news || results[i].title.substr(0, maps.length) == maps) {
      console.log("Item removed: " + results[i].title);
      resultsToSend.pop();
    } else if (results[i].hasOwnProperty('link') && results[i].link != null) {
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

//got the lists for this from: http://stackoverflow.com/q/16826200/1449799
let FIRST_NAME = ["Runny", "Buttercup", "Dinky", "Stinky", "Crusty",
  "Greasy", "Gidget", "Cheesypoof", "Lumpy", "Wacky", "Tiny", "Flunky",
  "Fluffy", "Zippy", "Doofus", "Gobsmacked", "Slimy", "Grimy", "Salamander",
  "Oily", "Burrito", "Bumpy", "Loopy", "Snotty", "Irving", "Egbert", "Waffer", "Lilly", "Rugrat", "Sand", "Fuzzy", "Kitty",
  "Puppy", "Snuggles", "Rubber", "Stinky", "Lulu", "Lala", "Sparkle", "Glitter",
  "Silver", "Golden", "Rainbow", "Butt", "Rain", "Stormy", "Wink", "Sugar",
  "Twinkle", "Star", "Halo", "Angel"
];

let LAST_NAME_1 = ["Snicker", "Buffalo", "Gross", "Bubble", "Sheep",
  "Corset", "Toilet", "Lizard", "Waffle", "Kumquat", "Burger", "Chimp", "Liver",
  "Gorilla", "Rhino", "Emu", "Pizza", "Toad", "Gerbil", "Pickle", "Tofu",
  "Chicken", "Potato", "Hamster", "Lemur", "Vermin"
];

let LAST_NAME_2 = ["face", "dip", "nose", "brain", "head", "breath",
  "pants", "shorts", "lips", "mouth", "muffin", "butt", "bottom", "elbow",
  "honker", "toes", "buns", "spew", "kisser", "fanny", "squirt", "chunks",
  "brains", "wit", "juice", "shower"
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getName() {
  return FIRST_NAME[getRandomInt(0, firstName.length)] + " " +
    LAST_NAME_1[getRandomInt(0, lastName1.length)] +
    LAST_NAME_2[getRandomInt(0, lastName2.length)];
}

/**
 * add a student to the user table
 */
function addStudent(classId) {
  var name = getName();
  return models.User.findOrCreate({
      where: {
        name: name,
        role: models.ROLES.PARTICIPANT
      }
    })
    .spread(function(thisUser, created) {
      if (created) {
        return thisUser;
      } else {
        return addStudent(classId);
      }
    });
}

/**
 * get an array of names for the class, add them to the class
 * and create them as users.
 */
function getNames(count, classId) {
  var names = [];
  // mdn is really the best js resource
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  return Promise.all(_.range(count).map(function() {
    return addStudent(classId); // TODO: is this a race condition for unique sillynames?
  }));
}

// getCLasses used to use the socket to emit the result. now we will make the caller do this

function getClasses(teacher) { // teacher is a user obj
  return teacher.getGroups();
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
io.sockets.on('connection', function(socket) {
  let connectedAt = new Date();
  console.log('>> Client Connected  >> ', connectedAt);
  var connectionInfo = {};

  models.Client.create({
      where: {
        socketid: socket.id,
        connected: connectedAt
      }
    })
    .then(function(newClient) {
      console.log('newclient created with id', newClient.id);
      connectionInfo['dbId'] = newClient.id;
    });
  // .then store the client db id?

  // var addClientQuery = 'insert into critisearch_clients (socket, connect) values (?, ?)';
  // connection.query(addClientQuery, [socket.id, new Date()], function(error, results){
  //   console.log(error);
  //   console.log(results);
  //   if (results && results.hasOwnProperty('insertId')) {
  //     connectionInfo['dbId'] = results.insertId;
  //   }
  // });

  /**
   * Will catch when a client leaves the app interface entirely and send
   * out the updated number of connected students for the teacher view.
   */
  socket.on('disconnect', function() {
    let disconnectedAt = new Date();
    console.log('<< Client with id', socket.id, 'Disconnected at time', disconnectedAt, '<<');

    return models.Client.findOne({
      where: {
        socketid: socket.id
      }
    }).then(function(newlyDisconnectedClient) {
      if (newlyDisconnectedClient) {
        return newlyDisconnectedClient.setDisconnected(disconnectedAt);
      }
    });
  });

  /**
   *
   * Handle when someone tries to sign up
   */
  socket.on('signup', function(username, password, email) {
    console.log('Database add ' + username + ', ' + password + ', ' + email);

    var reason;


    models.User.isUniqueName(username)
      .then(function(isUnique) {
        if (!isUnique) {
          reason = 'Username already exists';
          console.log(reason);
          socket.emit('userNotAdded', {
            reason: reason
          });
        } else {
          models.User.create({
            where: {
              email: email,
              name: username,
              password: password,
              role: models.ROLES.FACILITATOR
            }
          }).then(function(user) {
            connectionInfo['teacherId'] = user.id;
            socket.emit('login-teacher-done', {
              success: true,
              user: {
                name: username,
                groups: [],
              },
              uid: user.id,
              key: getKey()
            });
          });
        }
      });
    // connection.query(usernames, [username], function(error, results) {
    //   if (results.length > 0) {
    //     console.log("Username already exists");
    //   } else if (email != null) {
    //     var newUser = 'insert into users (name, password, email) values (?, ?, ?)'
    //     connection.query(newUser, [username, password, email], function(error, results) {
    //       console.log(results);

    //       connectionInfo['teacherId'] = results.insertId;
    //       socket.emit('login-teacher-done', {success: true});
    //     });
    //   } else {
    //     console.log("invalid email");
    //   }
    // });

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

    models.User.findOne({
        where: {
          name: details.username
        },
        include: [{
          model: models.Group,
          include: [{
            model: models.User
          }]
        }]
      })
      .then((user) => {
        if (user) {
          // check the password
          if (user.password === details.password) {
            var data = {
              success: true,
              user: user,
              uid: user.id,
              key: getKey()
            }

            socket.emit('login-teacher-done', data);
          } else {
            console.log("incorrect password");
            socket.emit('login-failed');
          }
        } else {
          console.log("wrong username");
          socket.emit('login-failed');
        }
      });
  });

  socket.on('check-cookies', function(cookies) {
    console.log('checking cookies');
    console.log(cookies);

    models.Cookie.findOne({
        where: {
          key: cookies.key,
          uid: cookies.uid
        }
      })
      .then((cookieResults) => {
        console.log(cookieResults);
        if (cookieResults && cookieResults.length > 0) {
          socket.emit('cookies-login', {
            uid: cookies.uid
          });
        }
      });
  });

  socket.on('update-cookies', function(cookies) {
    models.Cookie.findOne({
        where: {
          uid: cookies.uid
        }
      })
      .then((foundCookie) => {
        if (foundCookie) {
          foundCookie.key = cookies.key;
          foundCookie.save()
            .then(() => {
              socket.emit('cookies-updated');
            })
        } else {
          console.error('cookie not updated');
        }
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
      connection.query(teacherRole, [connectionInfo.teacherId, 1, groupId], function(error, results) {});

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
    connection.query(deleteQuery, [id], function(error, results) {});
    deleteQuery = 'DELETE FROM critisearch_groups WHERE gid=?;';
    connection.query(deleteQuery, [id], function(error, results) {
      socket.emit('class-deleted', id);
    });
  });

  socket.on('add-students', function(id, number) {
    // getNames(number, id, connectionInfo.teacherId)
  });


  // Login student code
  socket.on('login-student', function(details) {
    console.log('Searching for ' + details.sillyname);

    var newUser = models.User.findAll({
      where: {
        name: details.sillyname
      }
    }).then(function(results) {
      if (results.length > 0) {
        results[0].success = false;
        console.log("Looking for " + results[0].name);
        if (details.sillyname == results[0].name) {
          results[0].success = true;
          console.log("User match");
        }

        var user = results[0];

        //var findGroup = 'select * from critisearch_role_memberships where uid=?';
        // connection.query(findGroup, [user.id], function(error, results) {

        var findGroup = models.Membership.findAll({
          where: {
            userId: [user.id]
          }
        }).then(function(results) {

          if (results.length > 0) {
            user.groupId = results[0].groupId;

            socket.join(user.groupId);
            //   console.log(user);
            socket.emit('login-student-done', user);
          } else { //this is for if the user DNE
            socket.emit('login-student-done', {
              success: false,
              message: 'incorrect username.'
            });
          }
        });
      }
    }).catch(function(err) {
      console.log(err);
    });
  });


  // <Sarang m1> 


  //     if (results.length > 0) {
  //       results[0].success = false;
  //       console.log("Looking for " + results[0].name);
  //       if (details.sillyname == results[0].name) {
  //         results[0].success = true;
  //         console.log("User match");
  //       }

  //       var user = results[0];

  //       var findGroup = 'select * from critisearch_role_memberships where uid=?';
  //       connection.query(findGroup, [user.id], function(error, results) {
  //         if (error == null) {
  //           user.groupId = results[0].gid;
  //           socket.join(user.groupId);
  //           socket.emit('login-student-done', user);
  //         }
  //       })
  //     } else { //this is for if the user DNE
  //       socket.emit('login-student-done', {
  //         success: false,
  //         message: 'incorrect username.'
  //       });
  //       // TODO: send back a message that the user does not exist
  //     }
  //   });
  // });

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


    //var promotedQuery = 'insert into critisearch_events (type, time, client, query, result) 
    //values (?, ?, ?, ?, ?)';
    // if (result.uid == '') {
        console.log(result);
        var event_description = 'user voted up';
        models.Event.create({
              description: JSON.stringify(event_description),
              type:models.EVENT_TYPE.VOTE_UP
          });


      //connection.query(promotedQuery, [3, new Date(), connectionInfo.dbId, connectionInfo.currentQuery, result.id], function(error, results) {});
    // } else {
      //connection.query(promotedQuery, [3, new Date(), result.uid, connectionInfo.currentQuery, result.id], function(error, results) {});
    
  });

  socket.on('demoted', function(result) {
    var event_description = 'user voted down';
        models.Event.create({
              description: JSON.stringify(event_description),
              type:models.EVENT_TYPE.VOTE_DOWN
              
          });
  });

  socket.on('follow', function(result) {
    //<to do> with the event add for which result the user followed result.id has the query.id 
    console.log(result.id);
    var event_description = 'user followed the link';
        models.Event.create({
              description: JSON.stringify(event_description),
              type:models.EVENT_TYPE.FOLLOW
          });
    // var promotedQuery = 'insert into critisearch_events (type, time, client, query, result) values (?, ?, ?, ?, ?)';
    // if (result.uid == '') {
    //   connection.query(promotedQuery, [2, new Date(), connectionInfo.dbId, connectionInfo.currentQuery, result.id], function(error, results) {});
    // } else {
    //   connection.query(promotedQuery, [2, new Date(), result.uid, connectionInfo.currentQuery, result.id], function(error, results) {});
    // }
  });

  socket.on('log-out-class', function(classId) {
    socket.broadcast.to(classId).emit('logout');
    console.log('log out the entire class: ' + classId);
  })


  /**
   * When the user searches
   */


  // <Sarang> details is unclear
  socket.on('q', function(details) {
    // <Sarang> 
    models.Event.create({
      description: JSON.stringify(details),
      type: models.EVENT_TYPE.SEARCH
    });

    // <Sarang> need to sequelize . do we need to insert into a new table critisearch queries and therefore define it in models.js?
    var createdQuery = models.Query.create({
      text: details.query,
    }).then(function(query) {

      if (details.hasOwnProperty('group') && details.group.hasOwnProperty('id')) {
        console.log("Group: " + details);
        socket.broadcast.to(details.group.id).emit('query', details.query);
        console.log("Group: " + details.group.id);
        socket.broadcast.to(details.group.id).emit('query', details.query);
        models.Membership.findOne({
          where: {
            userId: details.userId,
            groupId: details.group.id
          }
        }).then(function (foundMembership) {
          query.authorGroupId = foundMembership.id;
          query.save();
        });
      }
        
      google(details.query, function(err, response) {
         console.log('search results for', details.query, response.links);
        var processedResults = getProcessedResults(response.links);
        //console.log(processedResults);
        var arrayOfPromisesForEachCreatedResultInSequelize = processedResults.map(function(result, idx) {
          return models.Result.create({ 
            link: result.link, 
            description: result.description, 
            result_order: idx , 
            title: result.title,
            result_relevance: models.RELEVANCE.VOTE_NONE,
            queryId: query.id
          });
        });
        Promise.all(arrayOfPromisesForEachCreatedResultInSequelize)
          .then(function(sequelizeResults){
            console.log("Results added to database successfully");
            socket.emit('search-results', sequelizeResults);
          });
        // console.log(processedResults);

      });
    }).catch(function(err) {
      console.log(err);
    });

    // TODO: if the user is anonymous do not log the membership information



  });

  socket.on('critisort', function(uid) {
      
      var details = 'user sorted the list';
      models.Event.create({
      description: JSON.stringify(details),
      type: models.EVENT_TYPE.CRITISORT
    });

    // var newEvent = 'insert into critisearch_events (type, time, client, query) values (?, ?, ?, ?)';
    // if (uid == '') {
    //   connection.query(newEvent, [5, new Date(), connectionInfo.dbId, connectionInfo.currentQuery], function(error, results) {});
    // } else {
    //   connection.query(newEvent, [5, new Date(), uid, connectionInfo.currentQuery], function(error, results) {});
    // }
  });
});
