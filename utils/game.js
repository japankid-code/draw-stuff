const { Game, User, Round, Game_User } = require("../models");

const findGame = async (gameID) => {
  return await Game.findOne({
    where: {
      id: gameID,
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
};

module.exports = { findGame };
