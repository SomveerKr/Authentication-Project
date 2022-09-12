
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");


const app=express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret:"My true secret.",
    resave:false,
    saveUninitialized: true,

}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema=new mongoose.Schema({
    email:String,
    password:String
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User=new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res)=>{
    res.render("home")
})
app.get("/register", (req, res)=>{
    res.render("register");

})
app.get("/login", (req, res)=>{
    res.render("login")
})
app.get("/secrets", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/register");
    }
    
})
app.get("/logout", (req, res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
        }
    });
    res.redirect("/");
})

app.post("/register", (req, res)=>{
    password=req.body.password;
    User.register({username:req.body.username}, password, (err, user)=>{
        if(!err){
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            })
        } else{
            console.log(err);
            res.redirect("/register");
        }
    })

})
app.post("/login", (req, res)=>{

    const user=new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user, (err)=>{
        if(!err){
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            })
        } else {
            console.log(err)
        }
    })


})

app.listen(3000, ()=>{
    console.log("Server has started on port 3000")
})