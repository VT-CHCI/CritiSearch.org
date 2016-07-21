'use strict';

var Sequelize = require('sequelize');
var sequelize = new Sequelize(
  process.env.CS_DB, // database name
  process.env.CS_USER, // username
  process.env.CS_PASS, // password
  { logging: false }
);

var DROPTABLES = true;


if (process.env.CS_DROP === 'true') {
  DROPTABLES = true;
}

let RELEVANCE = {
  VOTE_UP: 'up',
  VOTE_DOWN: 'down',
  VOTE_NONE:'none'
};

var Result = sequelize.define('result', {
  link: Sequelize.STRING(2048), 
  description: Sequelize.TEXT, 
  result_order: Sequelize.FLOAT(5,2), 
  title: Sequelize.STRING,
  result_relevance: Sequelize.ENUM(RELEVANCE.VOTE_UP,RELEVANCE.VOTE_DOWN,RELEVANCE.VOTE_NONE),
  cited_count:Sequelize.STRING,
  cited_url:Sequelize.STRING(2048),
  related_url:Sequelize.STRING(2048)
});

// event types for teacher such as create class or view incoming queries to be added later

let EVENT_TYPE = {
  VOTE_UP: 'vote_up',
  VOTE_DOWN: 'vote_down',
  CRITISORT: 'critisort',
  ORIGINALSORT:'originalsort',
  LOGOUT: 'logout',
  LOGIN:'login',
  FOLLOW: 'follow',
  SEARCH: 'search'
};

// how do we log events such as EVENT_TYPE.SEARCH and EVENT_TYPE.FOLLOW
var Event = sequelize.define('event', { 
  description: Sequelize.TEXT, 
  type: Sequelize.ENUM(EVENT_TYPE.VOTE_UP,EVENT_TYPE.VOTE_DOWN, EVENT_TYPE.CRITISORT,EVENT_TYPE.ORIGINALSORT, EVENT_TYPE.LOGOUT, EVENT_TYPE.LOGIN, EVENT_TYPE.FOLLOW, EVENT_TYPE.SEARCH)
});



var Client = sequelize.define('client', {
  socketid: Sequelize.STRING,
  connected: Sequelize.DATE,
  disconnected: Sequelize.DATE,
});

var Query = sequelize.define('query', {
  text: Sequelize.STRING,
});

// each event is trigerred by a client
Event.belongsTo(Client);
Client.hasMany(Event);



// Certain events such as Vote up/down  impact the result set 
Event.belongsTo(Result);
Result.hasMany(Event);

// Events such as sorting queries
Event.belongsTo(Query);
Query.hasMany(Event);

var Cookie = sequelize.define('cookie', {
  key: Sequelize.STRING,
  uid: {type: Sequelize.STRING, unique: true},
});

let ROLES = {
  PARTICIPANT: 'participant',
  FACILITATOR: 'facilitator'
};

var User = sequelize.define('user', {
  name: {type: Sequelize.STRING, unique: true},
  password: Sequelize.STRING,
  email: Sequelize.STRING,
  role: Sequelize.ENUM(ROLES.FACILITATOR, ROLES.PARTICIPANT)
}, {
  classMethods: {
    isUniqueName: function (name) {
      return User.findOne({
        where: {
          name: name
        }
      }).then(function (user) {
        console.log(user);
        return user === null;
      });
    }
  }
});



Client.belongsTo(User);
User.hasMany(Client);

Result.belongsTo(Query);
Query.hasMany(Result);

var Group = sequelize.define('group', {
  name: Sequelize.STRING,
});

var Membership = sequelize.define('membership', {
});

// these area all sequelize fns
// http://docs.sequelizejs.com/en/latest/docs/associations/#belongs-to-many-associations
User.belongsToMany(Group, {through: Membership});
Group.belongsToMany(User, {through: Membership});

Group.belongsTo(User, {as: 'owner'});

// User.hasMany(Query, {through: 'Membership'});  //will this work
Query.belongsTo(Membership, {as: 'author'});

exports.ROLES = ROLES;
exports.Result = Result;
exports.Client = Client;
exports.Cookie = Cookie;
exports.User = User;
exports.Query = Query;
exports.Event = Event;
exports.Group = Group;
exports.Membership = Membership;
exports.EVENT_TYPE = EVENT_TYPE;
exports.RELEVANCE = RELEVANCE;





// <Sarang> what exactly is happening here? When is this action initiated?
exports.start = function () {
  if (DROPTABLES) {console.log('dropping existing tables');}
  return sequelize.sync({force: DROPTABLES})  // Use {force:true} only for updating the above models,
                                              // it drops all current data
    .then( function (results) {
      //create a new user as a faciliatator with username admin
      return User.findOrCreate({
        where: {
          email: 'teacher@critisearch.org',
          name: 'teacher',
          password: '8d788385431273d11e8b43bb78f3aa41', // md5 hash of teacher
          role: ROLES.FACILITATOR
        } 
      })
        .spread(function (userResults) {
          // create a new group ("class") with name My Test Group
          return Group.findOrCreate({
            where: {
              name: 'TestClass',
              ownerId: userResults.id
              // ownerId: userResults[0].dataValues.id,
            } 
          })
            .spread(function (groupResults) {
              
              return Promise.all([
                Membership.findOrCreate({
                  where: {
                    groupId: groupResults.id,
                    userId: userResults.id,
                  }
                }),

                User.findOrCreate({
                  where: {
                    email: 'sillyname@critisearch.org',
                    name: 'sillyname',
                    password:'44e8cca84eae7121a2d48cb52bfc0ad5',
                    role: 'participant'
                  }
                })
                  .spread(function (studentResults) {
                    return Membership.findOrCreate({
                      where: {
                        groupId: groupResults.id,
                        userId: studentResults.id,
                      }
                    });
                  })
              ]);
            });
        });
    })
    .then( function () {
      if (DROPTABLES) {
        console.log('Testing: All Table Data Dropped');
      }
      console.info('Tables Synced');
      return true;
    })
    .catch(function (error) {
      console.error(error);
    });
  
};