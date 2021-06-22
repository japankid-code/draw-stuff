const { Game, User, Round, Game_User } = require("../models");

class GameFunctions {
  findGame = async (gameId) => {
    const game = await Game.findOne({
      where: {
        id: gameId,
      },
      include: [
        {
          model: User,
          through: [Game_User],
        },
        {
          model: Round,
          as: "game_rounds",
        },
      ],
    });
    return game;
  };

  // update user scores as the game is played
  scoreUpdate = async (user_id, val) => {
    const currentPlayer = await Game_User.findOne({
      where: { userId: user_id },
    });
    const newScore = parseInt(val) + parseInt(currentPlayer.dataValues.score);
    const playerScoreUpdate = await currentPlayer.update({ score: newScore });
    return playerScoreUpdate;
  };

  // update player drawing status takes id and boolean
  drawingUpdate = async (user_id, drawingBool) => {
    const drawingSet = await Game_User.update(
      { drawing: drawingBool },
      {
        where: { userId: user_id },
      }
    );
    return drawingSet;
  };

  // update game completion takes id and 2 booleans
  gameUpdate = async (gameId, startedBool, completeBool) => {
    const update = await Game.update(
      { started: startedBool, complete: completeBool },
      { where: { id: gameId } }
    );
    return update;
  };

  // update round completion, complete and playerlist
  roundUpdate = async ({ gameId, roundNum, completeBool, player_done }) => {
    if (completeBool) {
      const roundUpdate = await Round.update(
        { complete: completeBool },
        { where: { round_number: roundNum, game_id: gameId } }
      );
      return roundUpdate;
    } else if (player_done) {
      const currentRound = await Round.findOne({
        where: { round_number: roundNum, game_id: gameId },
      });
      // grab players left from round
      const playersLeft = currentRound.dataValues.left_to_draw.drawers;
      playersLeft.sort((a, b) => (a < b ? -1 : 1));
      const removed = playersLeft.shift(); // remove the first value
      const roundUpdate = await Round.update(
        { left_to_draw: { drawers: playersLeft } },
        { where: { round_number: roundNum, game_id: gameId } }
      );
      if (roundUpdate != null) {
        console.log(roundUpdate);
      } else {
        console.log(`round does not exist`);
      }
    }
  };
}

module.exports = new GameFunctions();
