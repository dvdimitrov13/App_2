const { ObjectId } = require('mongodb')

const usersCollection = require('../db').db().collection('users')
const followsCollection = require('../db').db().collection('follows')
const User = require('./User')

let Follow = function(followedUsername, authorId) { 
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
}

Follow.prototype.cleanUp = function() {
    if (typeof(this.followedUsername) != "string") {this.followedUsername = ""}
}

Follow.prototype.validate = async function(action) {
    // followed username must exist in DB
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if (followedAccount) {
        // we store the accunt ID so that if a user changes his username this is unaffected
        this.followedId = followedAccount._id
    } else {
        this.errors.push("You cannot follow an unexistent user!")
    }

    let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
    if (action == "create") {
        if (doesFollowAlreadyExist) {this.errors.push("You are already following this user!") }
    } 
    if (action == "delete") {
        if (!doesFollowAlreadyExist) {this.errors.push("You cannot unfollow someone you do not already follow!") }
    } 

    // Cannot follow myself
    if (this.followedId == this.authorId) {
        this.errors.push("You cannot follow yourself")
    }
}

Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")
        if (!this.errors.length) {
            await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("delete")
        if (!this.errors.length) {
            await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.isVisitorFollowing = async function(followedId,visitorId) {
    let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectId(visitorId)})
    if (followDoc) {
        return true
    } else {
        return false
    }
}

Follow.getFollowersById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}},
                {$lookup: {from: "users",localField: "authorId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()

            followers = followers.map(function(follower) {
                // Create a user
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            })
            resolve(followers)
        } catch {
            reject()
        }
    })
}

module.exports = Follow