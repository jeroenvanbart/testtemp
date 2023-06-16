const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '/.env')
})
const cron = require('node-cron');
var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var expressLayout = require('express-ejs-layouts');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var {v4: uuid} = require('uuid');

var publicRouter = require('./routes/public');
var usersRouter = require('./routes/user');
var apiRouter = require('./routes/api')
var external_apiRouter = require('./routes/ext_api')
var carrierRouter = require('./routes/carrier');
var {locals} = require('./config/locals')
var app = express();
var port = process.env.PORT || 8000;

const {renewTags} = require('./services/autoRenewTagList')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayout);
app.set('layout', 'layouts/layout');

// session setup (new redis setup since 16-8-2022)
if (process.env.NODE_ENV == ('production') || process.env.NODE_ENV == ('staging')) {
  let RedisStore = require('connect-redis')(session)
  const { createClient } = require("redis")
  let redisClient = createClient({
    legacyMode: true,
    host: 'localhost',
    port: 6379,
  })
  redisClient.connect().catch(console.error)

  app.use(
    session({
      genid: () => {
        return uuid()
      },
      store: new RedisStore({
        client: redisClient
      }),
      name: process.env.SID,
      secret: process.env.APPSECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60 * 60 * 1000,
        secure: false,
      },
    })
  )
}
if (process.env.NODE_ENV == 'development') {
  app.use(
    session({
      genid: () => {
        return uuid()
      },
      secret: process.env.APPSECRET,
      resave: false,
      saveUninitialized: false
    })
  )
}

app.use(logger('dev'));
app.use(express.json({limit: '300mb'}));
app.use(express.urlencoded({limit: '  300mb', extended: true, parameterLimit: 50000}));
//app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(locals)

app.use('/', publicRouter);
app.use('/api', apiRouter)
app.use('/ext_api', external_apiRouter)
app.use('/api', carrierRouter);
app.use('/', usersRouter)

// app.use('/users', usersRouter);

app.use(function(req, res) {
  if(!req.originalUrl.includes('/images/')) {
    res.redirect('/');
  }
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
process.on('unhandledRejection', error => { console.error('Unhandled promise rejection:', error); });

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Fetch list of racks biweekly at 3AM on monday.
cron.schedule('0 3 */2 * 1', async () => {
  renewTags()
}, {
  scheduled: true,
  timezone: "America/New_York"
});

app.listen(port, () => { console.log(`Applications running on port ${port}`)});

module.exports = app;
