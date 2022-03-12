const e = require('connect-flash')
const { nextTick } = require('process')
const User = require('../models/User')

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
        res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')})
    }
}

exports.login = function(req, res) {
    let user = new User(req.body)
    user.login().then(function(result) {
        req.session.user = {avatar: user.avatar, username: user.data.username}
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
        req.session.user = {avatar: user.avatar, username: user.data.username}
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