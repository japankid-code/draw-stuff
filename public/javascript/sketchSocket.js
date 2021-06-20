const url = window.location.href.split('/')
const gameRoom = url[url.length - 1]
let scored // local to prevent rescoring
let drawStarted // local to hide start drawing button
let allPlayers
let drawingPlayer // player set to draw true in db
let scoringPlayers // players set to draw false in db
let currentRound // lowest round_number for game in db
let leftToDraw // dynamic list, shortens as game goes on
let roundLength // from game obj
let validSessionIds
let dbGameDataObj
let currentUser = JSON.parse(sessionStorage.getItem('user')) || { "session_id": "guest" }

// grab relevant elements here...
const drawWordEl = document.getElementById('draw-word')
const drawerAvatarEl = document.getElementById('drawer-avatar')
const drawerUsernameEl = document.getElementById('drawer-username')
const scoringPlayersContainer = document.getElementById('scoring-players')
const scoreFormEl = document.getElementById('score-form')
const submitButtonEl = document.getElementById('submit-score')
const scoreSelectEl = document.getElementById('score')
const boardControlsEl = document.getElementById('drawing-controls-section')
const startRoundButtonEl = document.getElementById('start-draw-btn')
const startGameButtonEl = document.getElementById('start-game-btn')

// async fetch to grab data from database
const gameData = async (gameId) => {
  // fetch for grabbing game data, includes player and round datas
  const response = await fetch(`/api/game/${gameId}`,{
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  if (response.status >= 200 && response.status <= 299) {
    const jsonResponse = await response.json()
    dbGameDataObj = jsonResponse
  } else {
    // Handle errors/clear interval
    clearInterval(updateInterval)
    console.log(response.status, response.statusText, "interval stopped!")
    return
  }
  // map players to a new array
  players = dbGameDataObj.users.map((player) => {
    const playerData = {
      username: player.username,
      id: player.id,
      score: player.game_users.score,
      drawing: player.game_users.drawing,
      session_id: player.session_id,
      game_id: dbGameDataObj.id
    }
    return playerData
  })
  allPlayers = players.sort((a, b) => (a.id < b.id ? -1 : 1))
  // update drawingPlayer and scoringPlayers with current list from players
  drawingPlayers = players.filter((player) => player.drawing === true)
  drawingPlayer = drawingPlayers.shift() // returns first entry from list
  scoringPlayers = players
    .filter((player) => player.drawing === false)
    .sort((a, b) => (a.id < b.id ? -1 : 1))
  // set round length
  roundLength = dbGameDataObj.round_time
  // update round data, sorted by round number, filter for uncompleted rnds
  currentRound = dbGameDataObj.game_rounds
    .sort((a, b) => (a.round_number < b.round_number ? -1 : 1))
    .filter((r) => r.complete === false)
    .shift() // grab the first value, lowest round number
  // check if any rounds left
  currentRound === undefined
    ? gameUpdateDB(gameRoom, 1, 1) // none left update game as complete
    : leftToDraw = currentRound.left_to_draw.drawers
}

// interval timer for data fetching continuously

let updateInterval = setInterval(async () => {
  // keeps local variables updated with db
  await gameData(gameRoom)
  pageRender()
}, 3000) // runs every 3000 milliseconds

const startGame = async () => {
  // update game to started and first player to drawing
  await gameUpdateDB(gameRoom, 1, 0)
  await drawingUpdateDB(allPlayers[0].id, 1)
}

// sets 
const playerDrawTimer = () => {
  // hide the button, set drawStarted to true and start timer
  startRoundButtonEl.classList.add('hidden')
  drawStarted = true
  // timer to allow each user to draw consecutively
  // initiates on drawer's client after they press start draw button
  const timer = setTimeout(async () => {
    // after the timer has finished...
    // set drawStarted locally back to false and then update drawer in db
    drawStarted = false
    const drawOff = await drawingUpdateDB(drawingPlayer.id, 0)
    // update round's left_to_draw list
    const shiftDrawList = await roundUpdateDB(gameRoom, currentRound.round_number, 0, 1)
    // refresh the list in local variables
    await gameData(gameRoom)
    // check if leftToDraw has any left
    if (leftToDraw[0] === undefined) { // end round if there aren't any drawers left
      const roundEnd = await roundUpdateDB(gameRoom, currentRound.round_number, 1, 0)
      const startRoundDrawer = await drawingUpdateDB(scoringPlayers[0].id, 1)
    } else { // turn drawing on for the next player
      const drawOn = await drawingUpdateDB(leftToDraw[0], 1)
    }
    drawStarted = false // sets value in previous drawers client
    cv.background(255, 255, 255)
    // describe then emit board-erasing datum to all players from drawer client
    const datum = { x: 300, y: 300, px: 300, py: 300, color: 'FFF', strokeWidth: 9001 }
    socket.emit('mouse', datum)
  }, roundLength * 1000)
}

// update page elements
const pageRender = () => {
  // if game is complete, redirect to score page...
  if (!dbGameDataObj) {
    // returns to homepage before rendering anything
    return window.location = `/`
  } else if (dbGameDataObj.complete) {
    // returns to score screen, needs new route for rendering
    return window.location = `/game/${gameRoom}/score`
  }

  // update drawing player name
  if (drawingPlayer) {
    drawerUsernameEl.innerHTML = drawingPlayer.username
  }

  // scoring players list update
  const scoringPlayerCards = scoringPlayers.map((player) => {
    return (
`<div id="scoring-player" class="m-2 flex flex-grow ring-2 items-center text-xl rounded-sm">
  <div id='scorer-avatar' class='avatar m-2 w-8 h-8 bg-blue-300'></div>
  <div id='scorer-username' class="flex-grow text-center text-xl self-center">
    ${player.username}
  </div>
  |
  <div id='scorer-score' class="flex-grow text-center text-xl self-center">
    ${player.score}
  </div>
</div>`
    )
  }).join("") // join removes commas, returns string
  // update the HTML to show scoring players
  scoringPlayersContainer.innerHTML = scoringPlayerCards

  // draw word element update
  if (currentRound !== undefined) {
    drawWordEl.textContent = currentRound.phrase
  } else {
    drawWordEl.textContent = 'no more rounds!!'
  }

  // show start button for un started games
  if (!dbGameDataObj.started) {
    startGameButtonEl.classList.remove('hidden')
  } else { // hide for started games
    startGameButtonEl.classList.add('hidden')
  }
  
  // hide/unhide elements for players if there is any drawing player
  if (drawingPlayer) {
    if (currentUser.session_id === drawingPlayer.session_id) {
      // current user is drawing player...
      // show controls and start round button, hide score form
      scoreFormEl.classList.add('hidden')
      boardControlsEl.classList.remove('hidden')
      if (!drawStarted) {
        startRoundButtonEl.classList.remove('hidden')
      }
    } else { // current user is not drawing player...
      // session ID should match a value in
      // show score form, hide board controls and round btn
      startRoundButtonEl.classList.add('hidden')
      boardControlsEl.classList.add('hidden')
      scoreFormEl.classList.remove('hidden')
    }
    if (currentUser.session_id === "guest") {
      // if a spectator joins, their session id is set to guest
      // may need to add things here...
    }
  }
}

// put fetch function to update user scores as the game is played
const scoreUpdateDB = async (user_id, score) => {
  const response = await fetch(`/api/player/${user_id}/score`, {
    method: 'PUT',
    body: JSON.stringify({ "score": score }),
    headers: { 'Content-Type': 'application/json'}
  })
  if (response.ok) {
    return response
  } else {
    console.log(response.statusText)
  }
}

// put fetch to update player drawing status takes id and boolean
const drawingUpdateDB = async (user_id, drawing) => {
  const response = await fetch(`/api/player/${user_id}/drawing`, {
    method: 'PUT',
    body: JSON.stringify({ "drawing": drawing }),
    headers: { 'Content-Type': 'application/json' }
  })
  if (response.ok) {
    return response
  } else {
    console.log(response.statusText)
  }
}

// put fetch to update game completion takes id and 2 booleans
const gameUpdateDB = async (game_id, started, complete) => {
  const response = await fetch(`/api/game/${game_id}/play`, {
    method: 'PUT',
    body: JSON.stringify({ "complete": complete, "started": started }),
    headers: { 'Content-Type': 'application/json' }
  })
  if (response.ok) {
    return response
  } else {
    console.log(response.statusText)
  }
}

// put fetch to update round completion, 2 ints and 2 booleans
const roundUpdateDB = async (game_id, round_number, complete, player_done) => {
  const response = await fetch(`/api/game/${game_id}/round/${round_number}`, {
    method: 'PUT',
    body: JSON.stringify({ "complete": complete, "player_done": player_done }),
    headers: { 'Content-Type': 'application/json' }
  })
  if (response.ok) {
    return response
  } else {
    console.log(response.statusText)
  }
}

// button handler for scoring on drawing player
submitButtonEl.addEventListener('click', (e) => {
  e.preventDefault()
  const { id } = drawingPlayer
  const score = scoreSelectEl.value
  console.log(score)
  scored ? console.log('already scored!!') : scoreUpdateDB(id, score)
  scored = true
})

startRoundButtonEl.addEventListener('click', (e) => {
  e.preventDefault()
  playerDrawTimer()
})

startGameButtonEl.addEventListener('click', (e) => {
  e.preventDefault()
  startGame()
})

// all things related to the canvas, socket and drawing after this line
let socket
let color = '#111'
let strokeWidth = 4
let cv

function setup() {
  // Creating canvas
	cv = createCanvas(600, 600)
  let originParent = cv.parent()
  cv.parent('#drawing-board')
  originParent.remove()
	cv.background(255, 255, 255)
	// Start the socket connection
	socket = io.connect()

  socket.on('connect', () =>  {
    // server takes join message, adds client to room
    socket.emit('join', gameRoom)
  })
  
	// Callback function
	socket.on('draw', data => {
		stroke(data.color)
		strokeWeight(data.strokeWidth)
		line(data.x, data.y, data.px, data.py)
	})

	// Getting our buttons and the holder through the p5.js dom
	const color_picker = select('#pickcolor')
	const color_btn = select('#color-btn')

	const stroke_width_picker = select('#stroke-width-picker')
	const stroke_btn = select('#stroke-btn')

	// Adding a mousePressed listener to the button
	color_btn.mousePressed(() => {
		// Checking if the input is a valid hex color
		if (/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color_picker.value())) {
			color = color_picker.value()
		} else {
			console.log('Enter a valid hex value')
		}
	})

	// Adding a mousePressed listener to the button
	stroke_btn.mousePressed(() => {
		const width = parseInt(stroke_width_picker.value())
		if (width > 0) strokeWidth = width
	})
}

function mouseDragged() {
	stroke(color)
	strokeWeight(strokeWidth)
  // check for a drawing player and current user
  if (currentUser && drawingPlayer){
    // authorize user to draw according to the session id of drawing player
    if (currentUser.session_id === drawingPlayer.session_id && drawStarted) {
      line(mouseX, mouseY, pmouseX, pmouseY)
      // Send the mouse coordinates
      sendmouse(mouseX, mouseY, pmouseX, pmouseY)
    }
  }
}

// Sending data to the socket
function sendmouse(x, y, pX, pY) {
	const data = {
		x: x,
		y: y,
		px: pX,
		py: pY,
		color: color,
		strokeWidth: strokeWidth,
	}
  socket.emit('mouse', data)
}

