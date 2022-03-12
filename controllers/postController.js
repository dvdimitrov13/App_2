const Post = require('../models/Post')


exports.viewCreateScreen = function(req, res) {
    res.render('create-post')    
}

exports.create = function(req, res) {
    // Store value in DB in our model
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function() {
        res.send("New post created")
    }).catch(function(err) {
        res.send(err)
    })
}

exports.viewSingle = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id)
        res.render('single-post-screen', {post: post})
    } catch {
        res.render('404')
    }
}