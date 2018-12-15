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

let catalogErrMsg = ''  // error message to be displayed on catalog page
app.get('/', async (req, res) => {

    const postsCollection = await posts();                      // retrieve posts from mongo
    const allPosts = await postsCollection.find({}).toArray()

    let threads = []    // list of thread-starting posts
    
    allPosts.forEach(function(p) {  // iter through each post
        if(p._id === p.thread) {    // if the post id is the same as the thread id
            threads.push({          // then it's a thread-starting post
                tuuid: p._id,       // so add it to the thread list
                ttext: p.text
            })
        }
    });

    if (req.cookies.AuthCookie){    // if a user is logged in
        res.render("catalog", {     // render the catalog
            title: 'ChatSprout Thread Catalog',
            threads: threads,
            loginuser: req.cookies.AuthCookie,  // w/ username
            errmsg: catalogErrMsg
        })
    }
    else {
        res.render("catalog", {
            title: 'ChatSprout Thread Catalog',
            threads: threads,       // w/o username
            errmsg: catalogErrMsg   
        })
    }

    catalogErrMsg = ''      // if there's been no error then reset the message
})

app.post('/voteComment', async (req, res)=> {
    const postsCollection = await posts();
    let comment = req.body.selectedComment
    if(comment){
        node = await postsCollection.findOne({_id: comment})
        if (node){
            //Decide whether we are upvoting or downvoting because two buttons redirect here.
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

    //Create the new comment in the thread specified
    const newPost = {
        _id: uuid.v4(),
        thread: req.body.thread,
        text: req.body.comment,
        children: [],
        upvotes: 0,
        downvotes: 0
    }

    //Add the comment as a child of a node if it was set as one
    let node = req.body.parentNode

    //Null is passed as a string in the object so we have to check against that
    if (node != "null"){
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

    const ptext = req.body.ptext    // get post text
    const tuuid = uuid.v4()         // generate new thread id number

    if (!ptext) {    // no empty posts
        return res.redirect('/')
    }

    if (!req.cookies.AuthCookie) {  // must be logged in to post
        catalogErrMsg = "Only logged-in users can start threads."
        return res.redirect('/')
    }

    const postsCollection = await posts();
    const newPost = postsCollection.insertOne({ // add a new post
        _id: tuuid,     // post id is same as thread id since this is a new thread
        thread: tuuid,
        text: ptext,    // post text as supplied
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
            tPosts: encodeURIComponent(JSON.stringify(threadPosts)),
            loginuser: req.cookies.AuthCookie,
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
