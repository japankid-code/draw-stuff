const Sequelize = require("sequelize");

require("dotenv").config();

let sequelize;

if (process.env.CLEARDB_DATABASE_URL) {
  sequelize = new Sequelize(process.env.CLEARDB_DATABASE_URL);
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PW,
    {
      host: "localhost",
      dialect: "mysql",
      port: 3306,
      pool: {
        max: 8,
        min: 0,
        idle: 20000,
        evict: 15000,
        acquire: 30000,
      },
    }
  );
}

module.exports = sequelize;
