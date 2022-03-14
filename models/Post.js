const postsCollection = require('../db').db().collection('posts')
const User = require('./User')
const ObjectId = require('mongodb').ObjectId
const sanitizeHTML = require('sanitize-html')

let Post = function(data, userid, requestedPostId) {
    this.userid = userid
    this.data = data
    this.errors = []
    this.requestedPostId = requestedPostId
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
        title: sanitizeHTML(this.data.title.trim(), {
            "allowedAttributes": {
              "a": ["href", "name", "target"],
              "iframe": ["allowfullscreen", "frameborder", "src"],
              "img": ["src"]
            },
            "allowedClasses": {},
            "allowedSchemes": ["http", "https", "mailto"],
            "allowedTags": [
              "a", "article", "b", "blockquote", "br", "caption", "code", "del", "details", "div", "em",
              "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd", "li", "main", "ol",
              "p", "pre", "section", "span", "strike", "strong", "sub", "summary", "sup", "table",
              "tbody", "td", "th", "thead", "tr", "u", "ul"
            ],
            "filter": null,
            "transformText": null
          }),
        body: sanitizeHTML(this.data.body.trim(), {
            "allowedAttributes": {
              "a": ["href", "name", "target"],
              "iframe": ["allowfullscreen", "frameborder", "src"],
              "img": ["src"]
            },
            "allowedClasses": {},
            "allowedSchemes": ["http", "https", "mailto"],
            "allowedTags": [
              "a", "article", "b", "blockquote", "br", "caption", "code", "del", "details", "div", "em",
              "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd", "li", "main", "ol",
              "p", "pre", "section", "span", "strike", "strong", "sub", "summary", "sup", "table",
              "tbody", "td", "th", "thead", "tr", "u", "ul"
            ],
            "filter": null,
            "transformText": null
          }),
        createdDate: new Date()
    }
}

Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            // save post in DB
            postsCollection.insertOne(this.data).then((result) => {
                resolve(result.insertedId)
            }).catch(() => {
                this.errors.push('Please try again later.')
            })
        } else {
            reject(this.errors)
        }
    })

}

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
            if (post.isVisitorOwner) {
                // actually update DB
                let status = this.actuallyUpdate()
                resolve(status)
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

Post._postQuery = function(uniqueOperations, visitorId) {
    return new Promise(async function(resolve, reject) {
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])

        let posts = await postsCollection.aggregate(aggOperations).toArray()

        // clean up author property
        posts = posts.map(function(post) {
            post.isVisitorOwner = post.authorId.equals(visitorId)
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })
        resolve(posts)
    })
}

Post.findSingleById = function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectId.isValid(id)) {
            reject()
            return
        }
        
        let posts = await Post._postQuery([
            {$match: {_id: new ObjectId(id)}}
        ], visitorId)

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

Post.delete = function(postIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(postIdToDelete, currentUserId)
            if (post.isVisitorOwner) {
                await postsCollection.deleteOne({_id: new ObjectId(postIdToDelete)})
                resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

module.exports = Post