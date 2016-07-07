var Q = require('q');
var bigInt = require('big-integer');

function StolenTweetDetector(twitterWrapper) {
  if (!(this instanceof StolenTweetDetector)) return new StolenTweetDetector;
  
  this._twitter = twitterWrapper;
}

StolenTweetDetector.prototype.processMedia = function (tweet) {
  if (!(tweet.entities.media)){
    console.log("DETECTOR: Tweet does not contain any media.");
    return Q(false);
  }
  var media = tweet.entities.media;
  console.log("DETECTOR: Tweet contains media. Checking ownership...");
  if (!tweet.entities.media.source_user_id_str) { 
    console.log("DETECTOR: Media owner not available.")
    return Q(false);
  }
  var mediaIsStolen = tweet.entities.media.source_user_id_str !== tweet.user.id_str;
  return Q(mediaIsStolen);
}

StolenTweetDetector.prototype.getMediaOrigin = function (tweet) {
  if (!(tweet.entities.media)) return;
  return this._twitter.getTweetById(tweet.entities.media[0].source_status_id_str)
  .fail(console.error);
}

StolenTweetDetector.prototype.processText = function (tweet) {
  console.log("DETECTOR: Looking for origin tweet...")
  return this.getOrigin(tweet).then(function (origin) { return origin !== null });
}

StolenTweetDetector.prototype.getOrigin = function (tweet) {
  var max_id = tweet.id_str;
  var twitter = this._twitter;
  console.log("DETECTOR: Searching for matches older than tweet ID " + max_id + ".");
  return this._searchForMinIdTweet(tweet.text, max_id).then(function (minId) {
    if (minId != max_id) 
      return twitter.getTweetById(minId);
    else return null;
  });
}

StolenTweetDetector.prototype._searchForMinIdTweet = function(text, max_id) {
  var instance = this;
  return this._twitter.search('"' + text + '"', {max_id: max_id})
  .then(function(results) {
    return getLowestTweetId(results.statuses, max_id);
  }).then(function (minId) {
    if (bigInt(max_id).compare(minId) !== 0) {
      console.log("DETECTOR: Older tweet found, ID " + minId)
      return instance._searchForMinIdTweet(text, minId.toString());
    }
    else {
      console.log("DETECTOR: No older tweets found.")
      return minId.toString();
    }
  });
}

function getLowestTweetId(tweets, max_id) {
  var min = bigInt(max_id);
  tweets.forEach(function(tweet) {
    if (bigInt(tweet.id_str).compare(min) < 0) {
      min = bigInt(tweet.id_str);
    }
  });
  return min;
}


module.exports = StolenTweetDetector;