const router = require("express").Router();
const path = require("path");
const { Game, User, Game_User, Round } = require("../models");

router.get("/", async (req, res) => {
  const gamesData = await Game.findAll({});
  const games = gamesData
    .map((game) => {
      if (!game.dataValues.complete) {
        return game.dataValues;
      }
      return;
    })
    .filter((game) => game);
  console.log(games);
  res.render("index", games);
});

// rendering for score pages will happen at /game/1/score
router.get("/game/:id/score", async (req, res) => {
  const game = await Game.findAll({
    where: { id: req.params.id },
    include: [
      { model: User, through: [Game_User] },
      { model: Round, as: "game_rounds", attributes: ["phrase"] },
    ],
  });
  const players = game[0].dataValues.users.map((user) => {
    console.log(user.dataValues.game_user.dataValues.score);
    return {
      username: user.dataValues.username,
      score: user.dataValues.game_user.dataValues.score,
    };
  });
  res.render("score", players);
});

module.exports = router;
