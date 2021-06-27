// select all relavant elements up here
const usernameEl = document.getElementById(`username`);
const playButtonEl = document.getElementById("playButton");
const joinGameNumberEl = document.getElementById("gameNumberInput");
const createNumRounds = document.getElementById(`roundNumberInput`);
const createRoundTime = document.getElementById(`roundTimeInput`);
const createDrawList = document.getElementById(`drawListInput`);
const dropdown = document.getElementById("gameOption");
const createGameOptionsModal = document.getElementById("create-game-options");
const joinGameOptionModal = document.getElementById("join-game-option");
const formErrors = document.getElementById("formErrors");

// fetch function to post a new user to the database
async function createUser(avatar, username) {
  const response = await fetch(`/api/User`, {
    method: "POST",
    body: JSON.stringify({
      username: username,
      avatarId: avatar,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((resp) => resp.json())
    .then((data) => {
      if (data.success) {
        const user = data.dataValues;
        sessionStorage.setItem("user", JSON.stringify(user));
        return user;
      } else {
        handleErrors(data.errors);
      }
    })
    .catch((err) => {
      formErrors.innerHTML =
        "There was an internal server error!!! Contact JAPANKID";
    });

  return response;
}

async function handleErrors(errors) {
  formErrors.innerHTML = "";

  for (const err of errors) {
    formErrors.innerHTML += err.message;
    document
      .getElementById(err.field)
      ?.classList?.add("border-2", "border-red-500");
  }
}

// fetch function to create a new game in the database
async function createGame(rounds, roundTime, drawList) {
  const response = await fetch(`/api/game`, {
    method: "POST",
    body: JSON.stringify({
      rounds, //this is a shortcut for `rounds: rounds`
      round_time: roundTime,
      draw_list: drawList,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
}
// fetch function to add a user as player of a game
// this one should eventually redirect to '/play/:id' passing in the game id
// user will end up drawing in a room with the other players in the game
async function addUserToGame(game_id, user_id) {
  const response = await fetch(`/api/player`, {
    method: "POST",
    body: JSON.stringify({
      game_id,
      user_id,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  window.location = `/play/${game_id}`;
  return data;
}

async function getAllGameIds() {
  const response = await fetch(`/api/game`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  const list = data.map((datum) => datum.id);
  return list;
}

// need some button handling that considers the selected dropdown value

let playFunction = async (type) => {
  const username = usernameEl.value;
  const availableGames = await getAllGameIds();
  const user = await createUser(1, username);

  if (user === undefined) {
    return;
  }

  switch (type) {
    case "random":
      const randomGame =
        availableGames[Math.floor(Math.random() * availableGames.length)];
      await addUserToGame(randomGame, user.id);
      break;
    case "join":
      const friendsGame = joinGameNumberEl.value;
      addUserToGame(friendsGame, user.id);
      break;
    case "create":
      const numRounds = createNumRounds.value;
      const roundTime = createRoundTime.value;
      const phraseObj = { phrases: createDrawList.value.split(" ") };
      const createdGame = await createGame(numRounds, roundTime, phraseObj);
      addUserToGame(createdGame.id, user.id);
      break;
  }
};

// addEventListener(event, function);
dropdown.addEventListener("change", async (event) => {
  // create | join | random

  const selectedDropdown = event.target.value;
  if (selectedDropdown === "create") {
    joinGameOptionModal.classList.add("hidden");
    createGameOptionsModal.classList.remove("hidden");
    playButtonEl.textContent = "Create Game!";
  } else if (selectedDropdown === "join") {
    // join friend's game hide create game
    createGameOptionsModal.classList.add("hidden");
    joinGameOptionModal.classList.remove("hidden");
    playButtonEl.textContent = "Play!";
  } else if (selectedDropdown === "random") {
    joinGameOptionModal.classList.add("hidden");
    createGameOptionsModal.classList.add("hidden");
    playButtonEl.textContent = "Play!";
  }
});

document.getElementById("playButton").onclick = async (e) => {
  e.preventDefault();
  const selectedDropdown = dropdown.value;
  if (selectedDropdown === "create") {
    playFunction("create");
  } else if (selectedDropdown === "join") {
    playFunction("join");
  } else if (selectedDropdown === "random") {
    playFunction("random");
  }
};

// disable the play button while creating a game is selected

// have event listeners on the dropdown input??
// this could handle updating the modal displays

/**
    TEST CODE
*/
