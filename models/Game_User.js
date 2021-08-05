const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");
const User = require("./User");
const Game = require("./Game");
const Round = require("./Round");

// create our User model
class Game_User extends Model {}

// define table columns and configuration
Game_User.init(
  {
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    drawing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // keys for game and user are added in the models index
  },
  {
    hooks: {
      async afterCreate(addPlayerData) {
        const { gameId, userId } = addPlayerData;
        // get rounds data
        const rounds = await Round.findAll({ where: { game_id: gameId } });
        // map round data to an array of rounds by id
        const roundArray = rounds.map((round) => round.dataValues.id);
        // for each round, push new player to the JSON array
        roundArray.forEach(async (round) => {
          const roundData = await Round.findOne({ where: { id: round } });
          const drawerList = roundData.dataValues.left_to_draw.drawers;
          // add new player's user ID to the array
          drawerList.push(userId);
          const sortDrawerList = drawerList.sort((a, b) => (a < b ? -1 : 1));
          const updateRoundDrawList = await Round.update(
            { left_to_draw: { drawers: sortDrawerList } },
            { where: { id: round } }
          );
        });
      },
    },
    sequelize,
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    modelName: "game_user",
  }
);

module.exports = Game_User;
