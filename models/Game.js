const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');
const Users = require('./Users');
const Round = require('./Round')


// create our Users model
class Game extends Model { }

// define table columns and configuration
Game.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    draw_list: {
      type: DataTypes.JSON,
    },
    rounds: {
      type: DataTypes.INTEGER
    },
    round_time: {
      type: DataTypes.INTEGER
    },
    started: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    complete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    hooks: {
      // set up afterCreate hook for rounds to be created
      async afterCreate(newGameData) {
        const { id, draw_list, rounds } = newGameData.dataValues
        const { phrases } = draw_list
        const random = Math.floor(Math.random() * phrases.length)
        for (let i = 0; i < rounds; i++) {
          Round.create({
            complete: false,
            round_number: i + 1,
            phrase: phrases[Math.floor(Math.random() * phrases.length)],
            // just 
            game_id: id
          })
        }
        return newGameData
      }
    },
    sequelize,
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    modelName: 'game'
  }
);

module.exports = Game;