const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");

const app=express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema={
    email:String,
    password:String
};

const User=new mongoose.model("User", userSchema);


app.get("/", (req, res)=>{
    res.render("home")
})
app.get("/register", (req, res)=>{
    res.render("register");

})
app.get("/login", (req, res)=>{
    res.render("login")
})


app.post("/register", (req, res)=>{
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    })
    newUser.save((err)=>{
        if(!err){
            res.render("secrets");
        } else {
            console.log(err)
        }
    })
})
app.post("/login", (req, res)=>{
    User.findOne(
    {
        email:req.body.username,
        password:req.body.password
    }, 
    (err, foundUser)=>{
        if(foundUser){
            res.render("secrets")
        } else {
            res.render("login")
        }
    })
})

app.listen(3000, ()=>{
    console.log("Server has started on port 3000")
})