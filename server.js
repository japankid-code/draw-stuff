const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const hbs = exphbs.create({});
const sequelize = require("./config/connection");
const routes = require("./controllers/");
const PORT = process.env.PORT || 3001;
const session = require("express-session");
const { response } = require("express");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const secret = process.env.SECRET;
const {
  findGame,
  scoreUpdate,
  drawingUpdate,
  gameUpdate,
  roundUpdate,
} = require("./utils/game");

const app = express();
// add websocket connection
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

const sess = {
  secret: secret,
  cookie: {},
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: sequelize,
  }),
};

// set up handlebars as the views engine
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// use sessions
app.use(session(sess));

// middleware for JSON and things
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// takes all static content and serves as assets
app.use(express.static(path.join(__dirname, "./public")));

io.of("/").adapter.on("join-room", (room, id) => {
  // console.log(`socket ${id} has joined room ${room}`);
});

io.on("connection", (socket) => {
  // console.log('Client connected on socket: ' + socket.id)
  // after client connects, sends join a room msg :)
  socket.on("join", (id) => {
    socket.join(id);
    console.log("now playing in room: " + id);

    // have User join game
    // broadcast the user has joined to any other clients
    findAndEmit(id);

    // socket recieves score update for player
    socket.on("score-update", async ({ id, score }) => {
      await scoreUpdate(id, score);
      findAndEmit(id);
    });

    // socket recieves drawing update for player
    socket.on("drawing-update", async ({ id, drawing }) => {
      await drawingUpdate(id, drawing);
      findAndEmit(id);
    });

    // socket recieves game update from other clients
    socket.on("game-update", async ({ id, started, complete }) => {
      await gameUpdate(id, started, complete);
      findAndEmit(id);
    });

    // socket recieves update to rounds from drawing player
    socket.on(
      "round-update",
      async ({ gameId, roundNum, completeBool, player_done }) => {
        await roundUpdate({
          gameId,
          roundNum,
          completeBool,
          player_done,
        });
        findAndEmit(id);
      }
    );

    // socket gets draw datas to emit to other clients
    socket.on("mouse", (data) => {
      socket.to(id).emit("draw", data);
    });
  });

  socket.on("disconnect", () => console.log("Client has disconnected"));
});

const findAndEmit = (id) => {
  findGame(id).then((game) => {
    io.emit("game-data", game);
  });
};
// p5 board init breaks with handlebars
app.use(express.static(path.join(__dirname, "./src")));
// play game page will render at whatever id
app.get("/play/:id", (req, res) => {
  // this view is not generated with handlebars!!
  res.sendFile(path.join(__dirname + "/src/play.html"));
});

// turn on routing from the controllers index
app.use(routes);

sequelize.sync({ force: false }).then(() => {
  server.listen(PORT, () => {
    console.log("sequelize now listening.");
  });
});
