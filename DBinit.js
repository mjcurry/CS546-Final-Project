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

    const tuuid = uuid.v4();
    const tuuid2 = uuid.v4();

    const post9 = {
        _id: tuuid,
        thread: tuuid,
        text: 'all your base are belong to us',
        children: [],
        upvotes: 15,
        downvotes: 3
    }
    const post1 = {
        _id: tuuid,
        thread: tuuid,
        text: 'all your base are belong to us',
        children: [],
        upvotes: 15,
        downvotes: 3
    }
    const post2 = {
        _id: uuid.v4(),
        thread: tuuid,
        text: 'Testing attention please',
        children: [],
        upvotes: 40,
        downvotes: 3
    }
    const post3 = {
        _id: uuid.v4(),
        thread: tuuid,
        text: 'heeeeelllppppppp meeeeeeeee',
        children: [],
        upvotes: 15,
        downvotes: 89
    }
    const post4 = {
        _id: uuid.v4(),
        thread: tuuid,
        text: 'Ive been coding for two days non stop. about to ascend',
        children: [],
        upvotes: 1,
        downvotes: 6
    }

    const post5 = {
        _id: tuuid2,
        thread: tuuid2,
        text: 'Turns out making fake comments is time consuming.',
        children: [],
        upvotes: 15,
        downvotes: 3
    }
    const post6 = {
        _id: uuid.v4(),
        thread: tuuid2,
        text: 'Testing attention please',
        children: [],
        upvotes: 40,
        downvotes: 3
    }
    const post7 = {
        _id: uuid.v4(),
        thread: tuuid2,
        text: 'heeeeelllppppppp meeeeeeeee',
        children: [],
        upvotes: 15,
        downvotes: 89
    }
    const post8 = {
        _id: uuid.v4(),
        thread: tuuid2,
        text: 'These threads are totally the same its great',
        children: [],
        upvotes: 1,
        downvotes: 6
    }
   

    postsCollection.insertOne(post9)
    postsCollection.insertOne(post1)
    postsCollection.insertOne(post2)
    postsCollection.insertOne(post3)
    postsCollection.insertOne(post4)
    postsCollection.insertOne(post5)
    postsCollection.insertOne(post6)
    postsCollection.insertOne(post7)
    postsCollection.insertOne(post8)

}


module.exports.init = init