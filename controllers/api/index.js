const router = require("express").Router();
const gameRoute = require("./game-controller");
const userRoute = require("./user-controller");
const playerRoute = require("./player-controller");

// route for front end
router.use("/player", playerRoute);

// route to interact with User table in database
router.use("/user", userRoute);

// route to interact with game and associated round tables
router.use("/game", gameRoute);

module.exports = router;
