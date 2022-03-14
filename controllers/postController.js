const Post = require('../models/Post')


exports.viewCreateScreen = function(req, res) {
    res.render('create-post')    
}

exports.create = function(req, res) {
    // Store value in DB in our model
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function(postId) {
        req.flash("success", "New post successfully created!")
        req.session.save(() => res.redirect(`/post/${postId}`))
    }).catch(function(errs) {
        errs.forEach(err => req.flash("errors", err))
        req.session.save(() => res.redirect("/create-post"))
    })
}

exports.viewSingle = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post})
    } catch {
        res.render('404')
    }
}

exports.viewEditScreen = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        if (post.isVisitorOwner) {
            res.render('edit-post', {post: post})
        } else {
            req.flash("errors", "You do not have permission to perform that action!")
            req.session.save(() => res.redirect('/'))
        }
    } catch {
        res.render('404')
    }
}

exports.edit = function(req, res) {
    let post = new Post(req.body, req.visitorId, req.params.id)
    post.update().then((status) => {
        // the post was succesfully updated
        // or the user is the owner but there were validation errors
        if (status == "success") {
            // post was updated in DB
            req.flash("success","Post successfully updated!")
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        } else {
            post.errors.forEach(function(err) {
                req.flash("errors", err)
            })
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        // a post with the requested id doesnt exist
        //or if the current visitor is not the owner of the post
        req.flash("errors", "You do not have permission to access that page!")
        req.session.save(function() {
            res.redirect("/")
        })
    })
}