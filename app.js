var express=require("express");
var app=express();
var bodyParser= require("body-parser");
var mongoose= require("mongoose");
var passport=require("passport");
var LocalStrategy=require("passport-local");
var Campground=require("./models/campground");
var Comment =require("./models/comment");
var User= require("./models/user");
var seedDB=require("./seeds");
//seedDB();

//passport configuration
app.use(require("express-session")({
	secret:"Once again cutest",
	resave:false,
	 saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

					  


mongoose.connect("mongodb://localhost:27017/yelp",{useNewUrlParser:true,useUnifiedTopology: true});

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));


app.get("/",function(req,res){
	res.render("landing");
});

app.get("/campgrounds",function(req,res){
	//get all campgrounds from mongodb
	Campground.find({},function(err,allcampgrounds){
		if(err){
			console.log("error");
		}else{
		res.render("campgrounds/index",{campgrounds:allcampgrounds});
		}
	});
});

//create -add new campgrounds

app.post("/campgrounds",function(req,res){
	var name=req.body.name;
	var image=req.body.image;
	var desc=req.body.description;
	var newCampground={name:name,image:image,description:desc}

	//create new campground and save to mongodb
	Campground.create(newCampground,function(err,newlyCreated){
		if(err){
			console.log(err);
		}else{
			res.redirect("/campgrounds");	
		}
	});
	

	
});

//show form to create new campground.
app.get("/campgrounds/new",function(req,res){
	res.render("campgrounds/new");
});

//show more info about campgroundSchema
app.get("/campgrounds/:id",function(req,res){
	//find campground with provided provided
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground ){
	if(err){
		console.log(err);
	}else{
		console.log(foundCampground);
			//render show template with tht campground
		res.render("campgrounds/show",{campground:foundCampground});
	}	
	});
	

});

////=========
//comments routes
//==========

app.get("/campgrounds/:id/comments/new",isLoggedIn,function(req,res){
	//find campground by id
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
		}else{
		res.render("comments/new",{campground});
		}
	});

});

app.post("/campgrounds/:id/comments",isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}else{
			Comment.create(req.body.comment,function(err,comment){
				if(err){
					console.log(err);
				}else{
					campground.comments.push(comment);
					campground.save();
					res.redirect("/campgrounds/"+ campground._id);
				}
			});
		}
	})
});

//auth route 
//show register

app.get("/register",function(req,res){
	res.render("register");
});

//handel signup logic
app.post("/register",function(req,res){
		var newUser = new User({username:req.body.username});
		User.register(newUser,req.body.password,function(err,user){
			if(err){
				console.log(err);
				return res.render("register");
			}
			passport.authenticate("local")(req,res,function(){
			res.redirect("/campgrounds");	
			});
		});
});

//show login form
app.get("/login",function(req,res){
	res.render("login");
});

//handling login logic

app.post("/login",passport.authenticate("local",
	{successRedirect:"/campgrounds",
	 failureRedirect:"/login"
	}),function(req,res){
	
});

//logic route
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/campgrounds");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}







app.listen(3000,function(req,res){
	console.log("YELPCAMP HAS STARTED");
});