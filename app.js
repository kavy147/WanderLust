const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const path = require("path");
const ejs = require("ejs");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
const { wrap } = require("module");
const listingSchema = require("./Schema.js");
const reviewSchema = require("./Schema.js");
const Review = require("./models/review");

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() =>{
        console.log("DB Connected!");
    }).catch((err)=>{console.log(err);

    });

async function main() {
    await mongoose.connect(MONGO_URL);  
};

const validateListing = (req, res, next) => {
    const {error}  = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }
}

const validateReview = (req, res, next) => {
    const {error}  = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }
}

app.get("/",(req,res)=>{
    res.send("Working");
});

app.get("/listing",wrapAsync(async (req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}));

app.get("/listing/new",(req,res)=>{
    res.render("listings/new.ejs");
});

app.get("/listing/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
}));

app.post("/listing", validateListing,wrapAsync(async(req,res, next)=>{
    // let { title, description, image, price, location, country} = req.body;
    let listing = new Listing(req.body.listing);
    await listing.save();
    res.redirect("/listing");
}));

app.get("/listing/:id/edit",wrapAsync(async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
}));

app.put("/listing/:id/edit", validateListing,wrapAsync(async(req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listing/${id}`);
}));

app.delete("/listing/:id",wrapAsync( async (req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listing");
}));

//Reviews
//post route
app.post("/listing/:id/reviews",validateReview,wrapAsync( async(req,res)=>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save()
    console.log("New Review Saved");
    res.redirect(`/listing/${listing._id}`);
}));


// app.get("/testlisting",async (req,res)=>{
//     let sampleListing = new Listing({
//         title: "My new Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });
//     await sampleListing.save();
//     console.log("Sample was saved");
//     res.send("succesful testing");
// })

app.all(/.*/,(req, res, next) => {
    next(new ExpressError(404, "Page not Found!!"));
});

app.use((err, req, res, next) =>{
    let {status=500, message="Something went Wrong!"} = err;
    res.status(status).render("errors.ejs", {err}); 
    // res.status(status).send(message);  
});

app.listen(8080, () =>{
    console.log("server is running on 8080");
});