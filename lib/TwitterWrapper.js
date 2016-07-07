'use strict';

var Twitter = require('twitter');
var Q = require('q');

function TwitterWrapper(auth) {
  if (!(this instanceof TwitterWrapper)) return new TwitterWrapper(auth);
  
  this._twitter = new Twitter(auth);
  
}

TwitterWrapper.prototype.watchUsers = function(users) {
  var deferred = Q.defer();
  var instance = this;
  this._convertUsers(users)
  .then(function (users) {
    return instance._startStream(users);
  })
  .then(function(twitterStream) {
    var stream = createSkeletonStream();
    twitterStream.on('data', function(data) {
      stream._call('data', data);
      if (data.created_at && data.retweeted_status && data.user.id_str == _this.id)
        stream._call('retweet', data);
      else if (data.created_at) {
        stream._call('tweet', data);
      }
    });
    twitterStream.on('error', function(error) {
      stream._call('error');
      deferred.reject(error);
    });
    deferred.notify(stream);
  }).fail(console.log);
  return deferred.promise;
}

TwitterWrapper.prototype._convertUsers = function(users) {
  var ids;
  var promise = this._getUserId(users[0]).then(function(value) {
    ids = value;
  });
  for (var i = 1; i < users.length; i++) {
    promise = promise.then(function() {
      return this._getUserId(users[i])
    }).then(function(value) {ids = ids + "," + value});
  }
  return promise.then(function() {return ids;} )
}

TwitterWrapper.prototype._startStream = function(userIds) {
  var deferred = Q.defer();
  this._twitter.stream('statuses/filter', {follow:userIds}, function(stream) {
    deferred.resolve(stream);
  });
  return deferred.promise;
}

function createSkeletonStream() {
  var stream = {};
  stream._methods = {};
  stream.on = function (method, callback) {
    stream._methods[method] = callback;
  }
  stream._call = function (method, data) {
    if (typeof stream._methods[method] == 'function')
      return stream._methods[method](data);
    console.log("TWITTER: Stream function '" + method + "' undefined.")
    return undefined;
  }
  return stream;
}

TwitterWrapper.prototype._getUserId = function(user) {
  if (parseInt(user) > 0) return user + "";
  return this._twitter_get('users/show', {screen_name:user})
    .then(function(result) {
      var id = result.id_str;
      console.log("TWITTER: Username " + user + " translated to user ID " + id);
      return id;
    });
}

TwitterWrapper.prototype._twitter_get = function(location, parameters) {
  var deferred = Q.defer();
  if (!parameters)
    parameters = {};
  this._twitter.get(location, parameters, function(err, body, response) {
    if (err)
      deferred.reject(err)
    else
      deferred.resolve(body)
  });
  return deferred.promise;
}

module.exports = TwitterWrapper;