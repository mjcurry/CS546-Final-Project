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

    const tuuid = uuid.v4();
    const tuuid2 = uuid.v4();

    // DO it something like this the children should have Ids of other posts
    postsCollection.insertOne({_id: uuid.v4(), thread: tuuid,
    text: 'all your base are belong to us', children: [], upvotes: 14, downvotes: 7})
    
    postsCollection.insertOne({_id: tuuid, thread: tuuid,
    text: 'Hello World', upvotes: 14, downvotes: 7})

    postsCollection.insertOne({_id: uuid.v4(), thread: tuuid,
    text: 'all your base are belong to us', upvotes: 14, downvotes: 7})

    postsCollection.insertOne({_id: tuuid2, thread: tuuid2,
    text: 'lorem ipsum', upvotes: 14, downvotes: 7})

    postsCollection.insertOne({_id: tuuid, thread: tuuid,
    text: 'Hello World', upvotes: 14, downvotes: 7})

}


module.exports.init = init