const router = require('express').Router();
const { Users } = require('../models');
// The `/api/account` endpoint


/**
    A get request to /api/account/5
    would return info about user with ID 5

    body: none
    returns: {@link User}
 */
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    // Find user by primary key ID
    const user = await Users.findByPk(id);
    // Return user data as JSON
    if (user != null) {
        res.status(200).send(JSON.stringify(user));
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
router.post('/', async (req, res) => {
    const username = req.body.username;
    const avatarId = req.body.avatarId;

    if(username == null || avatarId == null) {
        res.status(400).send({ "Error": "username and avatarId must both not be null" });
    } else {
        
        res.status(200).send({ "status": "test" });
    }
});

/**
    A put request to /api/account

    body: {
        newPassword?: string,
        newAvatar?: string
    }
    returns: {@link User}
 */
router.put('/:id', async (req, res) => {
    res.status(200).send({ "status": "test" });

});



module.exports = router;
