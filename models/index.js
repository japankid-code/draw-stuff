const Game = require("./Game");
const User = require("./User");
const Game_User = require("./Game_User");
const Round = require("./Round");

Game.belongsToMany(User, {
  through: Game_User,
});

User.belongsToMany(Game, {
  through: Game_User,
});

Game.hasMany(Round, {
  foreignKey: "game_id",
});

Round.belongsTo(Game, {
  foreignKey: "game_id",
});

module.exports = { User, Game, Game_User, Round };
