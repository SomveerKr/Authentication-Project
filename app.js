require('dotenv').config()
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


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

mongoose.connect(process.env.MONGODB_URL);

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User=new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user._id);
    // if you use Model.id as your idAttribute maybe you'd want
    // done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res)=>{
    res.render("home")
})
app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile"] })
);
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
app.get("/register", (req, res)=>{
    res.render("register");

})
app.get("/login", (req, res)=>{
    res.render("login")
})
app.get("/secrets", (req, res)=>{
    User.find({"secret":{$ne:null}}, (err, foundUsers)=>{
        if(err){
            console.log(err);
        } else {
            if(foundUsers){
                res.render("secrets", {usersWithSecrets:foundUsers})
            }
        }
    })
    
});
app.get("/logout", (req, res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
        }
    });
    res.redirect("/");
});
app.get("/submit", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/register");
    }
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


});
app.post("/submit",(req, res)=>{
    const submittedSecret=req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id, (err, foundUser)=>{
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                })
            }
        }
    })
})

app.listen(3000, ()=>{
    console.log("Server has started on port 3000")
})
