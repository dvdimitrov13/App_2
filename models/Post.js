const postsCollection = require('../db').db().collection('posts')

let Post = function(data) {
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

module.exports = Post