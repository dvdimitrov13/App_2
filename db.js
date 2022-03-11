require('dotenv').config()
const {MongoClient} = require('mongodb')

const client = new MongoClient(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.y4szs.mongodb.net/Social_blogging?retryWrites=true&w=majority`)

async function start() {
    await client.connect()
    module.exports = client
    const app = require('./app')
    app.listen(3000)
}

start()