const Post = require('../models/Post')


exports.viewCreateScreen = function(req, res) {
    res.render('create-post')    
}

exports.create = function(req, res) {
    // Store value in DB in our model
    let post = new Post(req.body)
    post.create().then(function() {
        res.send("New post created")
    }).catch(function(err) {
        res.send(err)
    })
}