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
  User.findOneAndRemove({_id:req.params.id}).exec();

  res.status(201);
  res.send('success');
});

router.post('/fixture', function(req, res){
  if (req.body.keyword='robin') {
    User.register(new User({username: 'admin', isAdmin: true}), 'admin', function (err, account) {
      if (err) {
        return res.status(500).json({err: err});
      }
      return res.status(200).json({success:true});
    });
  }else {
    return res.status(500).json({err: 'failed'});
  }

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
      res.status(200).json({_id:user._id,username:user.username,isAdmin:user.isAdmin});
    });
  })(req, res, next);
});

router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({status: 'Bye!'})
});

router.put('/:id', function(req, res){
  User.findOne({_id:req.body._id}).exec(function(err, obj){
    if (err) return console.error(err);
    obj.username = req.body.username;
    obj.setPassword(req.body.password, function(){
      obj.save();
      res.status(201);
      res.send('success');
    });
  });
});

module.exports = router;
