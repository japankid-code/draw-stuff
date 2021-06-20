const router = require("express").Router();
const { Game, Users, Game_Users, Round } = require("../../models");
// The `/api/account` endpoint

router.get("/", async (req, res) => {
  const users = await Users.findAll();
  // Return user data as JSON
  if (users != null) {
    res.status(200).send(users);
  } else {
    res.status(400).send(`Users do not exist`);
  }
});
/**
    A get request to /api/account/5
    would return info about user with ID 5

    body: none
    returns: {@link User}
 */
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  // Find user by primary key ID
  const user = await Users.findOne({
    where: { id: id },
    include: [
      {
        model: Game,
        through: [Game_Users],
      },
    ],
  });
  // Return user data as JSON
  if (user != null) {
    res.status(200).send(user);
  } else {
    res.status(400).send(`User ID ${id} does not exist`);
  }
});

/**
    A post request to /api/account

    body: {
        username: string,
        avatarId: number,
    }
    returns: {@link User}
 */
router.post("/", async (req, res) => {
  try {
    const user = await Users.create({
      username: req.body.username,
      avatar_id: req.body.avatarId,
      session_id: req.session.id,
    });
    return res.status(200).send({ ...user, success: true });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      const errors = err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).send({ success: false, errors });
    } else {
      console.error(err);
    }
  }
});

module.exports = router;
