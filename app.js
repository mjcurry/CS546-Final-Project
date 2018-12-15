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

let catalogErrMsg = ''
app.get('/', async (req, res) => {

    const postsCollection = await posts();
    const allPosts = await postsCollection.find({}).toArray()

    let threads = []
    
    allPosts.forEach(function(p) {
        if(p._id === p.thread) {
            threads.push({
                tuuid: p._id,
                ttext: p.text
            })
        }
    });

    if (req.cookies.AuthCookie){
        res.render("catalog", {
            title: 'ChatSprout Thread Catalog',
            threads: threads,
            loginuser: req.cookies.AuthCookie,
            errmsg: catalogErrMsg
        })
    }
    else {
        res.render("catalog", {
            title: 'ChatSprout Thread Catalog',
            threads: threads,
            errmsg: catalogErrMsg
        })
    }

    catalogErrMsg = ''
})

app.post('/voteComment', async (req, res)=> {
    const postsCollection = await posts();
    let comment = req.body.selectedComment
    if(comment){
        node = await postsCollection.findOne({_id: comment})
        if (node){
            amount = parseInt(req.body.amount)
            if (amount == 1){
                node.upvotes += 1
            }else{
                node.downvotes += 1
            }
            await postsCollection.replaceOne({_id: node._id}, node)
        }
    }

    res.redirect('/graph/' + req.body.thread)
})

app.post('/newComment', async (req, res)=> {
    const postsCollection = await posts();

    const newPost = {
        _id: uuid.v4(),
        thread: req.body.thread,
        text: req.body.comment,
        children: [],
        upvotes: 0,
        downvotes: 0
    }

    let node = req.body.parentNode
    if (node){
        let parent = await postsCollection.findOne({_id: node})
        if (parent){
            parent.children.push(newPost._id)
        }
        await postsCollection.replaceOne({_id: node}, parent)
    }

    await postsCollection.insertOne(newPost)

    res.redirect('/graph/' + req.body.thread)
})

app.post('/deleteComment', async (req, res)=> {
    const postsCollection = await posts();
    let node = req.body.selectedComment
    
    //We need to make sure we remove the comment from any parent nodes as well to avoid conflict
    let allPosts = await postsCollection.find({thread:req.body.thread}).toArray()
    if (allPosts){
        for (i=0; i<allPosts.length; i++){
            for(j=0; j<allPosts[i].children.length; j++){
                if (allPosts[i].children[j] === node){
                    allPosts[i].children.splice(j, 1)

                    await postsCollection.replaceOne({_id: allPosts[i]._id}, allPosts[i])
                }
            }
        }
    }
    
    if(node){
        await postsCollection.deleteOne({_id : node})
    }

    res.redirect('/graph/' + req.body.thread)
})

app.post('/newthread', async (req, res) => {

    const ptext = req.body.ptext
    const tuuid = uuid.v4()

    if (!ptext) {    // no empty posts
        return res.redirect('/')
    }

    if (!req.cookies.AuthCookie) {  // must be logged in to post
        catalogErrMsg = "Only logged-in users can start threads."
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

dbinit.init()
app.listen(3000, () => {
    console.log("App is running on http://localhost:3000");
    if (process && process.send) process.send({done: true})
});
