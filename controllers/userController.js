const e = require('connect-flash')
const { nextTick } = require('process')
const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

exports.mustBeLoggedIn = function(req, res, next) {
    if (req.session.user) {
        next()
    } else {
        req.flash("errors", "You must be logged in to perform that action")
        req.session.save(function() {
            res.redirect('/')
        })
    }
}

exports.home = function(req, res) {
    if (req.session.user) {
        res.render('home-dashboard')
    } else {
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
}

exports.login = function(req, res) {
    let user = new User(req.body)
    user.login().then(function(result) {
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
        req.session.save(function() {
            res.redirect('/')
        })
    }).catch(function(err) {
        // Add a flash message
        req.flash('errors', err)
        req.session.save(function() {
            res.redirect('/')
        })
    })
}

exports.logout = function(req, res) {
    req.session.destroy(function() {
        res.redirect('/')
    })
}

exports.register = async function(req, res) {
    let user = new User(req.body)
    user.register().then((result) => {
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
        req.session.save(function() {
            res.redirect('/')
        })
    }).catch((regErrors) => {
        regErrors.forEach((err) => req.flash('regErrors', err))
        req.session.save(function() {
            res.redirect('/')
        })
    })
}

exports.ifUserExists =function(req, res, next) {
    User.findByUsername(req.params.username).then(function(userDocument) {
        req.profileUser = userDocument
        next()
    }).catch(function() {
        res.render('404')
    })    
}

exports.profilePostsScreen = function(req, res) {
    // ask Post model for posts by certain id
    Post.findByAuthorId(req.profileUser._id).then(function(posts) {
        res.render('profile', {
            currentPage: "posts",
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            posts: posts,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }).catch(function() {
        res.render('404')
    })
}

exports.profileFollowersScreen = async function(req, res) {
    try {
        let followers = await Follow.getFollowersById(req.profileUser._id)
        res.render('profile-followers', {
            currentPage: "followers",
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            followers: followers,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    } catch {
        res.render('404')
    }
}

exports.profileFollowingScreen = async function(req, res) {
    try {
        let following = await Follow.getFollowingById(req.profileUser._id)
        res.render('profile-following', {
            currentPage: "following",
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            following: following,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    } catch {

    }
} 

exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsProfile = false
    let isFollowing = false
    if (req.session.user) {
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
    }
    req.isVisitorsProfile = isVisitorsProfile
    req.isFollowing = isFollowing

    // retrieve post, follower and following counts
    let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
    let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id)
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])

    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount

    next()
}