var debug = require('debug')('boot:create-role-resolver');

module.exports = function(app) {
  var Role = app.models.Role;
  Role.registerResolver('teamMember', function(role, context, cb) {
    function reject() {
      process.nextTick(function() {
        cb(null, false);
      });
    }
    if (context.modelName !== 'project') {
      // the target model is not project
      return reject();
    }
    var userId = context.accessToken.userId;
    if (!userId) {
      return reject(); // do not allow anonymous users
    }
    // check if userId is in team table for the given project id
    context.model.findById(context.modelId, function(err, project) {
      if (err || !project) {
        return reject();
      }
      var Team = app.models.Team;
      Team.count({
        ownerId: project.ownerId,
        memberId: userId
      }, function(err, count) {
        if (err) {
          debug(err);
          return cb(null, false);
        }
        cb(null, count > 0); // true = is a team member
      });
    });
  });

  Role.registerResolver('$masterKey', function(role, context, callback) {
    debug('context.modelName: ', context.modelName);
    debug('context.accessToken: ', context.accessToken);

    var masterKey = context.remotingContext.req.query['masterKey'];
    debug('context.remotingContext.req.query[masterKey]: ',masterKey);

    var Application = app.models.Application;
    Application.find(
      {where: {masterKey: masterKey}},
      function(err, app) {
        if (err) {
          callback(null, false);
          //throw err;
        }
        debug(app);
        callback(null, (app && app.length===1));
      });

  });
};
