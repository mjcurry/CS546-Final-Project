// Michael Curry, Graham Howard, Alex Grin
// CS 546
// Final Project
// I pledge my honor that I have abided by the Stevens Honor System

const express = require('express')
const uuid = require("uuid")
const mongoCollections = require('./mongoCollections')
const exphbs = require("express-handlebars")

const users = mongoCollections.users
const posts = mongoCollections.posts
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const app = express()

const recipes = mongoCollections.recipes
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
    threads = {}

    res.render("catalog", {
        threads: threads
    })
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

app.get('/graph', async (req, res) => {
    // check if authenticated
    if (req.cookies && req.cookies.AuthCookie){
        res.redirect('/')
    }
    else {
        res.render('layouts/graphView')
    }
})

app.post('/login', async (req, res) => {
    let username = req.body.username
    let passwd = req.body.password

    if (!username || !passwd)
        return res.render('layouts/login', {errormsg: "Error: Please provide a username and password"})

    const usersCollection = await username()

    const userData = await usersCollection.findOne({"_id": username})

    if (userData == null) {
        return res.render('layouts/login', {errormsg: "Error: User does not exist in database"})
    }


    bcrypt.compare(passwd, userData.hashedPassword).then(function (result) {
        console.log(result)
        if (result){
            res.cookie('AuthCookie', username, {maxAge: 1000*60*60*24, httpOnly:true})
            res.redirect('/')
        }
        else {
            res.render('layouts/login', {errormsg: "Error: Invalid username/password combination"})
        }
    })
})

app.get('/logout', async (req, res) => {
    // clear the auth cookie
    res.clearCookie("AuthCookie")

    res.redirect('/')
})

app.get('/register', async (req, res) => {

})

app.post('/register', async (req, res) => {

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


app.listen(3000, () => {
    console.log("App is running on http://localhost:3000");
    if (process && process.send) process.send({done: true})
});