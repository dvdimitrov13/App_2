const Follow = require('../models/Follow')

exports.addFollow = function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId)
    follow.create().then(() => {
        req.flash("success", `Successfully followed ${req.params.username}!`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`))
    }).catch((errs) => {
        errs.forEach(err => {
            req.flash("errors", err)
        })
        req.session.save(() => res.redirect('/'))
    })
}