const express = require('express');
const logger = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash')
const util = require('util');
const LinkedInStrategy = require('passport-linkedin').Strategy;


/* app setting */
const app = express();
const request = require('request');

// sass setting
const sassMiddleware = require('node-sass-middleware');
const srcPath = __dirname + '/sass';
const destPath = path.join(__dirname + '/public/css');

// sassMiddleware
app.use(sassMiddleware({
  src: srcPath,
  dest: destPath,
  debug: true,
  outputStyle: 'compressed',
  prefix: '/prefix'
}));

// Express Configurations
app.set('port', process.env.PORT || 3000);
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser())
app.use(logger('dev'));
app.use(methodOverride());
app.use(flash());
app.use(session({ secret: 'keyboard cat'}));

// Initialize Passport! Also use passport.session() middleware, to support persistent login sessions.
app.use(passport.initialize());
app.use(session());
app.use(express.static(path.join(__dirname, 'public')));

const LINKEDIN_API_KEY = "77wjwu59nz4fgy";
const LINKEDIN_SECRET_KEY = "Uz9LLCvJ3Be3KlVC";

// Passport session setup
passport.serializeUser(function(user, done){
  done(null, user);
})

passport.deserializeUser(function(obj, done){
  done(null, obj);
})


// User the LinkedInStrategy within passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and LinkedIn profile), and
//   invoke a callback with a user object.
passport.use(new LinkedInStrategy({
    consumerKey: LINKEDIN_API_KEY,
    consumerSecret: LINKEDIN_SECRET_KEY,
    callbackURL: "http://localhost:3000/auth/linkedin/callback"
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function(){

      // To keep the example simple, the user's LinkedIn profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the LinkedIn account with a user record in your database,
      // and return that user instead.
      let userProfile = profile
      // console.log(profile)
      console.log("LinkedIn user Profile Data: ", userProfile)

      return done(null, profile);
    });
  }
));

app.get('/flash', function(req, res){
  // Set a flash message by passing the key, followed by the value, to req.flash().
  req.flash('info', 'Flash is back!')
  res.redirect('/');
});

app.get('/', function(req, res){
  res.render('pages/index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('pages/account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('pages/login', { user: req.user });
});

// GET /auth/linkedin
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in LinkedIn authentication will involve
//   redirecting the user to linkedin.com.  After authorization, LinkedIn will
//   redirect the user back to this application at /auth/linkedin/callback

app.get('/auth/linkedin',
  passport.authenticate('linkedin'));

// GET /auth/linkedin/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.


app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

// app.get('/auth/linkedin/callback',
//   passport.authenticate('linkedin', { successRedirect: '/', failureRedirect: '/login', failureFlash: 'Invalid username or password.', successFlash: 'Welcome!' })
//   // function(req, res) {
//   //   res.redirect('/');
//   // }
// );

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
})

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
})

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
    console.log("next()")
  }
  res.redirect('/login');
  console.log("redirected to /login")
}
