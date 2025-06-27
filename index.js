import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import anonRoutes from './routes/anon.js';
import { generateName } from './routes/anon.js';


const app = express();
const port = 3000;
const saltRounds = 10;
env.config();
app.use('/api', anonRoutes);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function generateAvatar(name) {
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(name)}`;
}


app.get("/my-secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query("SELECT secret FROM secrets WHERE email = $1", [
        req.user.email,
      ]);

      const secrets = result.rows.map(row => ({ secret: row.secret }));

      let picture;

      if (req.user.password === "google") {
        picture = user[0]; // Google user profile pic
        console.log("pic", picture);
      } else {
        picture = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; // Local user icon
      }

      res.render("secrets.ejs", {
        secrets,
        displayName: req.user.email,
        photo: picture,
        noSecret: "No secrets found!",
      });
    } catch (err) {
      console.error(err);
      res.send("Oops, something went wrong.");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query(`
        SELECT s.secret, u.anon_name, u.avatar_url
        FROM secrets s
        JOIN users u ON s.email = u.email
      `);

      const secrets = result.rows;
      console.log(secrets);
      res.render("publicSecrets.ejs", {
        secrets,
        isAuthenticated: true
      });
    } catch (err) {
      console.error("Error fetching secrets:", err);
      res.status(500).send("Oops, something went wrong.");
    }
  } else {
    res.redirect("/login");
  }
});


//Add a get route for the submit button
//Think about how the logic should work with authentication.

app.get("/submit",(req,res)=>{
  if(req.isAuthenticated()){
    res.render("submit.ejs")
  }
  else{
    res.redirect("/login");
  }
  
});
app.post("/submit", async (req, res) => {
  const secret = req.body.secret;
  const userEmail = req.user.email;

  console.log("user req", req.user);

  try {
    await db.query(
      "INSERT INTO secrets (email, secret) VALUES ($1, $2)",
      [userEmail, secret]
    );
    res.redirect("/secrets");
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong while saving the secret.");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const anonName = generateName();
          const avatarUrl = generateAvatar(anonName);

          const result = await db.query(
            "INSERT INTO users (email, password, anon_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *",
            [email, hash, anonName, avatarUrl]
          );

          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

//TODO: Create the post route for submit.
//Handle the submitted data and add it to the database

let user=[];
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        console.log(profile.picture);
        user[0]=profile.picture;

        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const anonName = generateName();
          const avatarUrl = generateAvatar(anonName);

          const newUser = await db.query(
            "INSERT INTO users (email, password, anon_name, avatar_url) VALUES ($1, $2, $3, $4)",
            [profile.email, "google", anonName, avatarUrl]
          );

          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);
passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
