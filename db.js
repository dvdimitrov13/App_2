require('dotenv').config()
const app = require('./app')
const {MongoClient} = require('mongodb')

const client = new MongoClient(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.y4szs.mongodb.net/Social_blogging?retryWrites=true&w=majority`)

async function start() {
    await client.connect()
    module.exports = client.db()
    app.listen(3000)
}

start()