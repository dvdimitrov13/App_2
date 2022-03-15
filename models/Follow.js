const { ObjectId } = require('mongodb')

const usersCollection = require('../db').db().collection('users')
const followsCollection = require('../db').db().collection('follows')

let Follow = function(followedUsername, authorId) { 
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
}

Follow.prototype.cleanUp = function() {
    if (typeof(this.followedUsername) != "string") {this.followedUsername = ""}
}

Follow.prototype.validate = async function() {
    // followed username must exist in DB
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if (followedAccount) {
        // we store the accunt ID so that if a user changes his username this is unaffected
        this.followedId = followedAccount._id
    } else {
        this.errors.push("You cannot follow an unexistent user!")
    }
}

Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate()
        if (!this.errors.length) {
            await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

module.exports = Follow