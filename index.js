var TwitterWrapper = require('./lib/TwitterWrapper');
var StolenTweetDetector = require('./lib/StolenTweetDetector');
var StolenStatus = require('./lib/StolenStatus');
var auth = require('./config/auth.json').twitter;
var accounts = require('./config/accounts.json');

var twitter = new TwitterWrapper(require('./config/auth.json').twitter);
var detector = new StolenTweetDetector(twitter);
var stream;

setUpStream();

function setUpStream() {
  console.log("INDEX: Setting up stream.")
  twitter.watchUsers(accounts).progress(function (twitterStream) {
    stream = twitterStream;
    stream.on('tweet', function(tweet) {
      checkIfStolen(tweet);
    });
    stream.on('error', function(error) {
      console.error(error);
    });
  }).fail(console.log);
}

function checkIfStolen(tweet) {
  console.log(tweet.user.screen_name + " tweeted, testing if stolen.");
  detector.processMedia(tweet).then(function(mediaIsStolen) {
    if (mediaIsStolen) return StolenStatus.RELINKED_MEDIA;
    else return detector.processText(tweet).then(function (textIsStolen) {
      if (textIsStolen) return StolenStatus.COPIED_TEXT;
      else return StolenStatus.NONE;
    });
  }).then(function (status) {
    if (status === StolenStatus.NONE)
      console.log("Could not detect that the tweet was stolen.");
    else if (status === StolenStatus.RELINKED_MEDIA)
      detector.getMediaOrigin(tweet).then(function (origin) { 
        console.log("Media was stolen from @" + origin.user.screen_name + ".");
      });
    else if (status === StolenStatus.COPIED_TEXT)
      detector.getOrigin(tweet).then(function (origin) {
        console.log("Tweet was stolen from @" + origin.user.screen_name + ".");
      });
  }).fail(console.error);
}

function tweetTextOriginatedElsewhere(tweet) {
  return false;
}