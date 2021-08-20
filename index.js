var express = require("express");
var cors = require("cors");
var mysql  = require("mysql");
var hbs = require( 'express-handlebars');
var jwt  = require("jsonwebtoken");
var bodyParser  = require("body-parser");
var config = require('./config.js');

var auth = require('./auth.js');

var app  = express();

function REST() {
    var self = this;
    self.connectMysql();
};

REST.prototype.connectMysql = function() {
    var self = this;
    var pool      =    mysql.createPool({
        connectionLimit : 200,
        host     : '',
        user     : '',
        password : '',
        database : '',
        debug    :  false,
        multipleStatements: true
    });
    self.configureExpress(pool);
}

REST.prototype.configureExpress = function(pool) {
      var self = this;

      app.set('secret', config.secret);
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(bodyParser.json());
      app.use(cors());
      app.set('view engine', 'hbs');
      
      app.engine( 'hbs', hbs( {
        extname: 'hbs',
      }));

      app.set('views', __dirname + '/views');

      var router = express.Router();
      app.use('/', router);

      new auth(router,pool);
      
      router.use((req, res, next) =>{
        var token = req.headers['token'];
 
        if (token) {
          jwt.verify(token, app.get('secret'), (err, decoded) =>{      
            if (err) {
              return res.json({ 
                authenticated: false,
                message: 'Invalid Token!' 
              });    
            } else {
              req.decoded = decoded;    
              next();
            }
          });
    
        } else {
          res.send({ 
              authenticated: false,
              message: 'No Token Provided!' 
          });   
        }
      });
     

      self.startServer();
}

REST.prototype.startServer = function() {

  var port = process.env.PORT || 3001;

  app.listen(port,function(){
      console.log('All right ! I am alive at Port ' + port + '.');
  });
}

REST.prototype.stop = function(err) {
    console.log("ISSUE WITH MYSQL n" + err);
    process.exit(1);
}

new REST();