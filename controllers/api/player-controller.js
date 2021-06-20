const router = require("express").Router();
const { Game, User, Game_User, Round } = require("../../models");
// Game_User are players, easier to think of that way

// get all players
router.get("/", async (req, res) => {
  const players = await Game_User.findAll();
  res.status(200).send(players);
});

// get one player
router.get("/:id", async (req, res) => {
  const player = await Game_User.findOne({
    where: { userId: req.params.id },
  });
  res.status(200).send(player);
});

// create a game user, aka a player :)
router.post("/", async (req, res, err) => {
  const gameId = req.body.game_id;
  const userId = req.body.user_id;

  // could have logic to check there is a game with the req ID here
  // but this validation would be better in the model

  if (gameId == null || userId == null) {
    res
      .status(400)
      .send({ Error: "game_id and user_id must both not be null" });
  } else {
    const newPlayer = await Game_User.create({
      gameId: gameId,
      userId: userId,
    });
    newPlayer
      ? res.status(200).send(newPlayer)
      : res.status(400).send({ Error: "no relevant game or user found" });
  }
});

// update player drawing status with api/player/1/drawing
router.put("/:id/drawing", async (req, res) => {
  //
  const playerId = req.params.id;
  const drawing = req.body.drawing;

  if (drawing === null || playerId === null) {
    res.status(400).send({ Error: "no nulls for playerId or drawing" });
  } else {
    const drawingUpdate = await Game_User.update(req.body, {
      where: { userId: playerId },
    });
    res.status(200).send(drawingUpdate);
  }
});

// update score api/player/1/score
router.put("/:id/score", async (req, res) => {
  const playerId = req.params.id;
  const score = req.body.score;

  if (playerId === null || score === null) {
    res.status(400).send({ Error: "no nulls for playerId or drawing" });
  } else {
    const currentScore = await Game_User.findOne({
      where: { userId: playerId },
    });
    const newScore = parseInt(score) + parseInt(currentScore.dataValues.score);
    const scoreAdd = await Game_User.update(
      { score: newScore },
      {
        where: { userId: playerId },
      }
    );
    res.status(200).send(scoreAdd);
  }
});

module.exports = router;
