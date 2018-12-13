// database initalization file

const mongoCollections = require('./mongoCollections')
const users = mongoCollections.users
const posts = mongoCollections.posts
const bcrypt = require('bcryptjs')
const uuid = require('uuid')


async function init() {
    // add user username=test password=test
    const usersCollection = await users()
    const postsCollection = await posts()

    // drop all data
    usersCollection.remove({},function(err, removed){});
    postsCollection.remove({},function(err, removed){});

    bcrypt.hash("test", 1, function (err, hash) {
        usersCollection.insertOne({"_id": "test", "hashedPassword": hash})
    })

    // usersCollection.insertOne({"_id": "username", "hashedPassword": pwdhash})

    postsCollection.insertOne({"_id": uuid.v4(), "thread": uuid.v4(),
    "text": "Hello World", "upvotes": 14, "downvotes": 7})
}


module.exports.init = init