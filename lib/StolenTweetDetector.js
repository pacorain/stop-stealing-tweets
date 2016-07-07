function StolenTweetDetector(twitterWrapper) {
  if (!(this instanceof StolenTweetDetector)) return new StolenTweetDetector;
  
  this._twitter = twitterWrapper;
}

StolenTweetDetector.prototype.mediaIsStolen = function (tweet) {
  if (!(tweet.entities.media)) return false;
  var media = tweet.entities.media;
  console.log("DETECTOR: Tweet contains media. Checking ownership...");
  if (!tweet.entities.media.source_user_id_str) { 
    console.log("DETECTOR: Media owner not available.")
    return false;
  }
  return (tweet.entities.media.source_user_id_str !== tweet.user.id_str);
}

StolenTweetDetector.prototype.getMediaOwner = function (tweet) {
  if (!(tweet.entities.media)) return;
  return this._twitter.getUserById(tweet.entities.media[0].source_user_id_str)
  .fail(console.error);
}

module.exports = StolenTweetDetector;