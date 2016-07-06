# Stop Stealing Tweets

This is a Twitter bot created by [Paco DeArmond]
(https://twitter.com/austindearmond) that watches accounts that
commonly steal tweets. When one of those accounts tweets, it quickly tries to
find the original post, and then reply to the stolen tweet quoting the original.

This project is in development and the bot has not been created yet.

The project is open source for two reasons:

1. To support other developers looking into doing similar things (like Twitter 
   bots.)
2. To allow others to contribute to this bot.

## Development

This bot has just begun development. The following are the steps I *think* need
to be taken.

 * Create the framework of the app.
 * Watch specific accounts for tweets.
 * See if media in a tweet originated from elsewhere.
 * Try to find the first instance of text in a tweet.
 * Generate a reply with a link to the original.
 * Create the twitter account.
 * Start sending out tweets.

## Lisence

I am releasing this under the MIT Lisence.

You may use this code however you wish--however, I request that you do not clone
the bot on another Twitter account. If you have ideas to improve the bot, make
a pull request or [open an issue]
(https://github.com/zbruh/stop-stealing-tweets/issues/new), or [send me an 
e-mail](mailto:hello@paco.audio). 