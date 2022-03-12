const postsCollection = require('../db').db().collection('posts')
const ObjectId = require('mongodb').ObjectId

let Post = function(data, userid) {
    this.userid = userid
    this.data = data
    this.errors = []
}

Post.prototype.validate = function() {
    if (this.data.title == "") {this.errors.push("Title is a required field!")}
    if (this.data.body == "") {this.errors.push("Please provide content for your post!")}
}

Post.prototype.cleanUp = function() {
    if (typeof(this.data.title) != 'string') {this.data.title = ""}
    if (typeof(this.data.body) != 'string') {this.data.body = ""}

    // get rid of bogus properties
    this.data = {
        author: ObjectId(this.userid),
        title: this.data.title.trim(),
        body: this.data.body.trim(),
        createdata: new Date()
    }
}

Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            // save post in DB
            postsCollection.insertOne(this.data).then(() => {
                resolve()
            }).catch(() => {
                this.errors.push('Please try again later.')
            })
        } else {
            reject(this.errors)
        }
    })

}

Post.findSingleById = function(id) {
    return new Promise(async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectId.isValid(id)) {
            reject()
            return
        } else {
            let post = await postsCollection.findOne({_id: new ObjectId(id)})
            console.log(post)
            if (post) {
                resolve(post)
            } else {
                reject()
            }
        }
    })
}

module.exports = Post