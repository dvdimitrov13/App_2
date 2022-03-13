const postsCollection = require('../db').db().collection('posts')
const User = require('./User')
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
        createdDate: new Date()
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

Post._postQuery = function(uniqueOperations) {
    return new Promise(async function(resolve, reject) {
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])

        let posts = await postsCollection.aggregate(aggOperations).toArray()

        // clean up author property
        posts = posts.map(function(post) {
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })
        resolve(posts)
    })
}

Post.findSingleById = function(id) {
    return new Promise(async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectId.isValid(id)) {
            reject()
            return
        }
        
        let posts = await Post._postQuery([
            {$match: {_id: new ObjectId(id)}}
        ])

        if (posts.length) {

            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId) {
    return Post._postQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])
}

module.exports = Post