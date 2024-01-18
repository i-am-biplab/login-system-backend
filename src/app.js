require('dotenv').config();
const express = require("express");
require("./db/conn");
const path = require("path");
const hbs = require("hbs");
const Registration = require("./models/registrations");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");
const resetAuth = require("./middleware/resetAuth");
const sendMail = require("./controllers/sendMail");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

const port = process.env.PORT || 8000;

const staticPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

app.use(express.static(staticPath));

app.set("view engine", "hbs");
app.set("views", viewsPath);

hbs.registerPartials(partialsPath);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", (req, res) => {
    res.render("register");
});
app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const confrimPassword = req.body.confirmPassword;

        if (password === confrimPassword)
        {
            const register = new Registration({
                fisrtname: req.body.firstName,
                lastname: req.body.lastName,
                email: req.body.email,
                gender: req.body.gender,
                phone: req.body.phone,
                age: req.body.age,
                password: req.body.password
            });

            const token = await register.generateAuthToken();
            // console.log(token);
            res.cookie("jwt", token, {
                httpOnly: true,
                // secure: true,
                expires: new Date(Date.now() + 600000)
            });

            const regDetails = await register.save();
            res.status(201).redirect("/userhome");
        }
        else
        {
            res.send("Password not matching");
        }
    } catch (error) {
        res.status(400).send(error);
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userDetail = await Registration.findOne({email: email});
        
        if (await bcrypt.compare(password, userDetail.password))
        {
            const token = await userDetail.generateAuthToken();

            res.cookie("jwt", token, {
                httpOnly: true,
                // secure: true,
                expires: new Date(Date.now() + 600000)
            });

            res.status(200).redirect("/userhome");
        }
        else
        {
            res.send("Invalid Credentials");
        }
        
    } catch (error) {
        res.status(404).send("Invalid Credentials Error");
    }
});

app.get("/forgotpasswd", (req, res) => {
    res.render("forgotpasswd");
});

app.post("/forgotpasswd", async (req, res) => {
    try {
        const email = req.body.email;
        const userDetail = await Registration.findOne({email: email});

        if (!userDetail)
        {
            res.status(400).send("Invalid Email");
            return;
        }

        const resetToken = await userDetail.generateResetToken();

        res.cookie("restoken", resetToken, {
            httpOnly: true,
            // secure: true,
            expires: new Date(Date.now() + 180000)
        });

        resetURL = process.env.BASE_URL + "/reset-password/" + resetToken;
        console.log(resetURL);

        try {
            sendMail(resetURL, email);
        } catch (error) {
            console.log(error);
        }
        res.send("Reset Link have been successfully sent to your Email.");
    } catch (error) {
        res.status(401).send(error);
    }
});

app.get("/reset-password/:rtoken", resetAuth, async (req, res) => {
        // res.send("Auth Done");
        res.redirect("/reset_password");
});

app.get("/reset_password", async (req, res) => {
    try {
        const resetToken = req.cookies.restoken;
        // console.log(resetToken);
        const verifyUser = jwt.verify(resetToken, process.env.RESET_SECRET_KEY);
        // console.log(verifyUser);

        const user = await Registration.findOne({_id: verifyUser._id});
        // console.log(user);
        
        res.render("resetpassword");
    } catch (error) {
        res.send(error);
    }
});

app.post("/reset_password", async (req, res) => {
    try {
        let password = req.body.password;
        const confrimPassword = req.body.confirmPassword;

        if (password === confrimPassword)
        {
            const resetToken = req.cookies.restoken;
            // console.log(resetToken);
            const verifyUser = jwt.verify(resetToken, process.env.RESET_SECRET_KEY);
            const _id = verifyUser._id;
            // console.log(verifyUser);

            const user = await Registration.findOne({_id: _id});
            console.log(user);
            
            console.log("hello");
            try {
                password = await bcrypt.hash(password, 12);
                const updateUser = await Registration.findByIdAndUpdate({_id: _id}, {password: password}, {new: true});
                // console.log(updateUser);
                updateUser.tokens = updateUser.tokens.filter((currentElem) => {
                    return currentElem.token != resetToken;
                });
                res.clearCookie("restoken");
                const saveUser = await updateUser.save();
                console.log(saveUser);
            } catch (error) {
                console.log(error);
            }

            res.redirect("/");
        }
    } catch (error) {
        res.status(401).send(error);
    }
});

app.get("/userhome", auth, (req, res) => {
    res.render("userhome");
});

app.get("/userorder", auth, (req, res) => {
    res.render("userorder");
});

app.get("/userprofile", auth, (req, res) => {
    res.render("userprofile");
});

app.get("/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((currentElem) => {
            return currentElem.token != req.token;
        });
        res.clearCookie("jwt");
        console.log("Logged Out Successfully");
        const saveUser = await req.user.save();
        // console.log(saveUser);
        res.redirect('/');
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get("/logoutall", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        res.clearCookie("jwt");
        console.log("Logged Out from all devices Successfully");
        const saveUser = await req.user.save();
        // console.log(saveUser);
        res.redirect('/');
    } catch (error) {
        res.status(500).send(error);
    }
});

// for backup (incase if the static page or handleBars goes wrong)
app.get("/", (req, res) => {
    res.status(500).send("<h1>Server is Down :(</h1>");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});