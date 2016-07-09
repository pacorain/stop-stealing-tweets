var TwitterWrapper = require('./lib/TwitterWrapper');
var StolenTweetDetector = require('./lib/StolenTweetDetector');
var StolenStatus = require('./lib/StolenStatus');
var auth = require('./config/auth.json').twitter;
var accounts = require('./config/accounts.json');

var twitter = new TwitterWrapper(require('./config/auth.json').twitter);
var stream;

setUpStream();

function setUpStream() {
  console.log("INDEX: Setting up stream.");
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
  var detector = new StolenTweetDetector(tweet, twitter);
  detector.findOrigin().then(function () {
    process(detector);
  }).fail(console.error);
}

function process(detector) {
  if (detector.getStatus() === StolenStatus.NONE) {
    console.log("Could not detect that the tweet was stolen.");
  } else if (!detector.isConfident()) {
    console.log("The tweet might be stolen, but cannot be confidently marked.")
  } else if (detector.getStatus() === StolenStatus.RELINKED_MEDIA) {
    handleStolenMedia(detector);
  } else if (detector.getStatus() === StolenStatus.COPIED_TEXT) {
    handleStolenText(detector);
  }
}

function handleStolenMedia(detector) {
  var origin = detector.getOrigin();
  console.log("Media was stolen from @" + origin.user.screen_name + ".");
}

function handleStolenText(detector) {
  var origin = detector.getOrigin();
  console.log("Tweet text was stolen from @" + origin.user.screen_name + ".");
}