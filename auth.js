var mysql  = require("mysql");
var config = require('./config.js');
var jwt  = require("jsonwebtoken");
var bcrypt = require("bcrypt");
var nodemailer = require('nodemailer');


function REST_ROUTER(router,pool) {
    var self = this;
    self.handleRoutes(router,pool);
}

REST_ROUTER.prototype.handleRoutes= function(router,pool) {


    router.post("/register",function(req,res){

        var query = "SELECT * FROM ?? WHERE ?? = ?";
        var table = ["person","field_one", req.body.field_one];

        query = mysql.format(query,table);
        pool.getConnection(function(err, connection) {
            connection.query(query,function(err,rows) {

                if(rows.length === 0) {

                    var query2 = "INSERT INTO ??(??,??,??) VALUES (?,?,?)";
                    var table2 = ["person", "field_one", "field_two", "field_three",
                        req.body.field_one, req.body.field_two, req.body.field_three ];
                    query2 = mysql.format(query2,table2);
                    connection.query(query2,function(err,result) {
                        connection.release();
                        if(err) {
                            res.json({"error" : true, "message" : "Error executing MySQL query"});
                        } else {
                            if(err) {
                                res.json({"error":true, "message":"New Person Email Failed!"});
                            } else {
                                res.json({"error":false, "message":"New Person Added!"});
                            }
                        }
                    });

                } else {
                    res.json({"error":true, "message":"Person Email Already Registered!"});
                }
            });
        });
    });

    router.post('/authenticate',(req,res)=> {

        var query = `
            SELECT  u.user_id,
                    u.person_id,
                    u.user_name,
                    u.password
            FROM    user u    
            WHERE   u.is_active = 1
                    AND u.user_name = ?`;
            
        var table = [req.body.field_one];
        query = mysql.format(query,table);
        pool.getConnection(function(err, connection) {
            connection.query(query,function(err,rows){
                connection.release();
                if(err) {
                    res.json({
                        authenticated: false,
                        message : "Error executing MySQL query"
                    });
                } else if(rows[0] == null) {
                    res.json({
                        authenticated: false,
                        message:"User not found!"});
                } else {
                    bcrypt.compare(req.body.password, rows[0].password, function  (err, isMatch) {
                        if (err) {
                            res.json({
                                authenticated: false,
                                message:"Error authenticating user!"
                            });
                        } else if (isMatch) {
                            const payload = {
                                user_id: rows[0].user_id,
                                user_role_id: rows[0].user_role_id
                            };
                    
                            var token = jwt.sign(payload, config.secret, {
                                expiresIn:7200 // expires in 120 minutes
                            });

                            if(rows[0].logo_aws_key !== "") {
                                logo_params = {
                                    Bucket: rows[0].aws_bucket, 
                                    Key: rows[0].logo_aws_key
                                };
                            } else {
                                logo_params = "";
                            }
                            
                    
                            res.json({
                                authenticated : true,
                                message : 'Authentication Successful!',
                                token : token,
                                user_id: rows[0].user_id,
                                user_name : rows[0].user_name,
                                person_id : rows[0].person_id,
                                logo_image_url: (logo_params === "" ? "" : s3.getSignedUrl('getObject', logo_params)),
                            });

                        } else { 
                            res.json({
                                authenticated:false, 
                                "message":"Invalid password!"
                            });
                        }
                    });
                }
            });
        });
    })
}

module.exports = REST_ROUTER;