const usersCollection = require('../db').db().collection('users')
const validator = require('validator')
const bcrypt = require('bcryptjs')

let User = function(data) {
    this.data = data
    this.errors = []
}

User.prototype.cleanUp = function() {
    if (typeof(this.data.username) != 'string') {this.data.username = ""}
    if (typeof(this.data.email) != 'string') {this.data.email = ""}
    if (typeof(this.data.password) != 'string') {this.data.password = ""}

    // Get rid of bogus properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if (this.data.username == "") {this.errors.push("You must provide a username.")}
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers.")}
        if (this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters.")}
        if (this.data.username.length > 30) {this.errors.push("Username cannot exceed 30 characters.")}
    
        // Only if username == valid => check if it's taken
        if (!this.errors.lenght) {
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if (usernameExists) {this.errors.push("Username is taken!")}
        }
    
        if (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address.")}
    
        // Only if username == valid => check if it's taken
        if (!validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if (emailExists) {this.errors.push("Email is being used!")}
        }
    
        if (this.data.password == "") {this.errors.push("You must provide a password.")}
        if (this.data.password.length > 0 && this.data.password.length < 12) {this.errors.push("Password must be at least 12 characters.")}
        if (this.data.password.length >50) {this.errors.push("Password cannot exceed 50 characters.")}
        resolve()
    })
}

User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {
        // Validate data
        this.cleanUp()
        await this.validate()
        // If no val errors => save data in DB
        if (!this.errors.length) {
            // hash user password
            let salt = bcrypt.genSaltSync()
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.insertOne(this.data)
            resolve()
        } else {
            reject(this.errors)
        }
    
    })
}

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({username: this.data.username}).then((attemptedUser) => {
            if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                resolve("Success")
            } else {
                reject("Invalid username / password")
            }
        }).catch(function() {reject('Please try again later!')})
    })
}

module.exports = User