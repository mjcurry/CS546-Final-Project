// Michael Curry, Graham Howard, Alex Grin
// CS 546
// Final Project
// I pledge my honor that I have abided by the Stevens Honor System

const express = require('express')
const uuid = require("uuid")
const mongoCollections = require('./mongoCollections')
const exphbs = require("express-handlebars")
const dbinit = require("./DBinit")

const users = mongoCollections.users
const posts = mongoCollections.posts
const bcrypt = require('bcryptjs')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const app = express()

const rootdir = express.static(__dirname + "/public")
app.engine("handlebars", exphbs({
    defaultLayout: 'main',
    layoutsDir: __dirname + "/views/layouts"
  }));
app.set('views', __dirname + "/views/layouts");
app.set("view engine", "handlebars")

// support POST of json data
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())

app.use("/public", rootdir)
app.use('/visScripts', express.static(__dirname + '/node_modules/vis/dist/'));


// handle request data errors for methods with bad input
app.use((error, req, res, next) => {
    if (error !== null) {
        return res.status(400).json({'error': 'You must provide valid application/json data for this method'})
    }

    return next()
});

app.get('/', async (req, res) => {

    const postsCollection = await posts();
    const allPosts = await postsCollection.find({}).toArray()
    //console.log(allPosts)
    let threads = []
    
    allPosts.forEach(function(p) {
        //console.log(p._id + " " + p.thread)
        if(p._id === p.thread) {
            threads.push({
                tuuid: p._id,
                ttext: p.text
            })
        }
    });

    //console.log("we have " + threads.length + " threads")

    if (req.cookies.AuthCookie){
        res.render("catalog", {
            title: 'ChatSprout Thread Catalog',
            threads: threads,
            loginuser: req.cookies.AuthCookie
        })
    }
    else {
        res.render("catalog", {
            title: 'ChatSprout Thread Catalog',
            threads: threads
        })
    }
})

app.post('/newthread', async (req, res) => {

    const ptext = req.body.ptext
    const tuuid = uuid.v4()

    if(!ptext) { 
        return res.redirect('/')
    }

    const postsCollection = await posts();
    const newPost = postsCollection.insertOne({
        _id: tuuid,
        thread: tuuid,
        text: ptext,
        children: [],
        upvotes: 0,
        downvotes: 0
    })

    res.redirect('/')
})

app.get('/login', async (req, res) => {
    // check if authenticated
    if (req.cookies && req.cookies.AuthCookie){
        res.redirect('/')
    }
    else {
        res.render('login', {
            title: 'Login to ChatSprout',
            errormsg: ''
        })
    }
})

app.get('/graph/:id', async (req, res) => {
    const threadID = req.params.id
    if (!threadID){
        console.log("ERROR")
    }
    //Get all posts in this thread
    const postsCollection = await posts()
    const threadPosts = await postsCollection.find({"thread": threadID}).toArray()
    if (!threadPosts){
        console.log("ERROR")
    }

    // check if authenticated
    if (req.cookies && req.cookies.AuthCookie){
        res.render('graphView', {
            title: "ChatSprout Thread " + threadID,
            tidnum: threadID, 
            tPosts: encodeURIComponent(JSON.stringify(threadPosts))
        })
    }
    else {
        res.render('graphView', {
            title: "ChatSprout Thread " + threadID,
            tidnum: threadID, 
            tPosts: encodeURIComponent(JSON.stringify(threadPosts))
        })
    }
})

app.post('/login', async (req, res) => {
    let username = req.body.username
    let passwd = req.body.password

    if (!username || !passwd)
        return res.render('login', {title: "Login to ChatSprout", errormsg: "Error: Please provide a username and password"})

    const usersCollection = await users()

    const userData = await usersCollection.findOne({"_id": username})

    if (userData == null) {
        return res.render('login', {title: "Login to ChatSprout", errormsg: "Error: User does not exist in database"})
    }


    bcrypt.compare(passwd, userData.hashedPassword).then(function (result) {
        if (result){
            res.cookie('AuthCookie', username, {maxAge: 1000*60*60*24, httpOnly:true})
            res.redirect('/')
        }
        else {
            res.render('login', {title: "Login to ChatSprout", errormsg: "Error: Invalid username/password combination"})
        }
    })
})

app.get('/logout', async (req, res) => {
    // clear the auth cookie
    res.clearCookie("AuthCookie")

    res.redirect('/')
})

app.get('/register', async (req, res) => {
    res.render('register', {title: "Register for ChatSprout"})
})

app.post('/register', async (req, res) => {
    let username = req.body.username
    let passwd = req.body.password

    if (!username || !passwd)
        return res.render('register', {title: "Register for ChatSprout", errormsg: "Error: Please provide a username and password"})

    const usersCollection = await users()

    const userData = await usersCollection.findOne({"_id": username})

    if (userData != null) {
        return res.render('register', {title: "Register for ChatSprout", errormsg: "Error: Username already exists"})
    }

    bcrypt.hash(passwd, 1, async function (err, hash) {
        const userData = await usersCollection.insertOne({"_id": username, "hashedPassword": hash})
        res.cookie('AuthCookie', username, {maxAge: 1000*60*60*24, httpOnly:true})
        res.redirect('/')
    })

})

app.get('/thread/:id', async (req, res) => {
    const threadId = req.params.id



    res.json(data)
})

app.post('/thread/:id', async (req, res) => {
    const threadId = req.params.id

    let postData = req.body

    res.json(data)
})

// app.post('/recipes', async (req, res) => {
//
//     let postData = req.body
//
//     // validation of data
//     if (!postData.title || typeof postData.title !== "string")
//         return res.status(400).json({"error": "Invalid value for recipe field = title"})
//     if (!postData.ingredients || !(postData.ingredients instanceof Array))
//         return res.status(400).json({"error": "Invalid value for recipe field = ingredients"})
//     if (!postData.steps || !(postData.steps instanceof Array))
//         return res.status(400).json({"error": "Invalid value for recipe field = steps"})
//
//     let record = {
//         _id: uuid.v4(),
//         title: postData.title,
//         ingredients: postData.ingredients,
//         steps: postData.steps
//     }
//
//     const recipesCollection = await recipes()
//     const result = await recipesCollection.insertOne(record)
//
//     if (result.insertedCount === 0)
//         return res.status(500).json({"error": "Could not insert record into database"})
//
//     let inserted = await recipesCollection.findOne({_id: result.insertedId})
//
//     res.json(inserted)
// })
//
// app.put('/recipes/:id', async (req, res) => {
//     const recipeId = req.params.id
//
//     let putData = req.body
//
//     // validation of data
//     if (!putData.title || typeof putData.title !== "string")
//         return res.status(400).json({"error": "Invalid value for recipe field = title"})
//     if (!putData.ingredients || !(putData.ingredients instanceof Array))
//         return res.status(400).json({"error": "Invalid value for recipe field = ingredients"})
//     if (!putData.steps || !(putData.steps instanceof Array))
//         return res.status(400).json({"error": "Invalid value for recipe field = steps"})
//
//     let update = {
//         title: putData.title,
//         ingredients: putData.ingredients,
//         steps: putData.steps
//     }
//
//     const recipesCollection = await recipes()
//     const result = await recipesCollection.replaceOne({_id: recipeId}, update)
//
//     if (result.modifiedCount === 0)
//         return res.status(500).json({"error": "Could not update recipe with id = " + recipeId})
//
//     let inserted = await recipesCollection.findOne({_id: recipeId})
//
//     res.json(inserted)
//
// })
//
// app.patch("/recipes/:id", async (req, res) => {
//     const recipeId = req.params.id
//
//     let patchData = req.body
//
//     let update = {}
//
//     // validation of data
//     if (patchData.title){
//         if (typeof patchData.title !== "string")
//             return res.status(400).json({"error": "Invalid value for recipe field = title"})
//         update.title = patchData.title
//     }
//
//     if (patchData.ingredients){
//         if (!(patchData.ingredients instanceof Array))
//             return res.status(400).json({"error": "Invalid value for recipe field = ingredients"})
//         update.ingredients = patchData.ingredients
//     }
//
//     if (patchData.steps){
//         if (!(patchData.steps instanceof Array))
//             return res.status(400).json({"error": "Invalid value for recipe field = steps"})
//         update.steps = patchData.steps
//     }
//
//     const recipesCollection = await recipes()
//     const result = await recipesCollection.update({_id: recipeId}, {"$set": update})
//
//     if (result.modifiedCount === 0)
//         return res.status(500).json({"error": "Could not update recipe with id = " + recipeId})
//
//     let inserted = await recipesCollection.findOne({_id: recipeId})
//
//     res.json(inserted)
// })
//
//
// app.delete('/recipes/:id', async (req, res) => {
//     const recipeId = req.params.id
//
//     const recipesCollection = await recipes()
//     let result = recipesCollection.removeOne({_id: recipeId})
//
//     if (result.deletedCount === 0)
//         return res.status(500).json({"error": "Could not delete recipe with id = " + recipeId})
//
//     res.json({})
// })

dbinit.init()
app.listen(3000, () => {
    console.log("App is running on http://localhost:3000");
    if (process && process.send) process.send({done: true})
});
