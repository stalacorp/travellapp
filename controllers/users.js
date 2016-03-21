var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var passport = require('passport');

/* GET users listing. */
router.get('/', function(req, res, next) {
  User.find({}, function(err, users){
    if(err){
      return res.status(500).json({err: err});
    }

    res.json(users);
  })
});

router.post('/', function(req, res) {
  User.register(new User({ username: req.body.username }), req.body.password, function(err, account) {
    if (err) {
      return res.status(500).json({err: err});
    }
    res.json(account);
  });

});

router.delete('/:id', function(req, res){
  Journey.findOneAndUpdate({_id:req.params.id}, {$set: {isVisible: false}}).exec();

  res.status(201);
  res.send('success');
});

router.get('/fixture', function(req, res){

  User.register(new User({ username: 'admin', isAdmin:true }), 'admin', function(err, account) {
    if (err) {
      return res.status(500).json({err: err});
    }
    passport.authenticate('local')(req, res, function () {
      return res.status(200).json({status: 'Registration successful!'});
    });
  });

});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return res.status(500).json({err: err});
    }
    if (!user) {
      return res.status(401).json({err: info});
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({err: 'Could not log in user'});
      }
      res.status(200).json(user.isAdmin);
    });
  })(req, res, next);
});

router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({status: 'Bye!'})
});

router.put('/:id', function(req, res){
  Person.findOneAndUpdate({_id:req.params.id},{$set: {username: req.body.username, isAdmin: req.body.isAdmin}}).exec();
  res.status(201);
  res.send('success');
});

module.exports = router;
