import { useState, useEffect, useCallback } from 'react'
import './App.css'

// Game constants
const GAME_WIDTH = 1200
const GAME_HEIGHT = 800
const GRAVITY = 0.8
const JUMP_FORCE = -15
const MOVE_SPEED = 5

// Character types
const FIREBOY = 'fireboy'
const WATERGIRL = 'watergirl'

// Game states
const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  VICTORY: 'victory'
}

function App() {
  const [gameState, setGameState] = useState(GAME_STATES.MENU)
  const [timeShards, setTimeShards] = useState(0)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [keys, setKeys] = useState({})

  // Character states
  const [fireboy, setFireboy] = useState({
    x: 100,
    y: 600,
    vx: 0,
    vy: 0,
    onGround: false,
    width: 30,
    height: 40
  })

  const [watergirl, setWatergirl] = useState({
    x: 150,
    y: 600,
    vx: 0,
    vy: 0,
    onGround: false,
    width: 30,
    height: 40
  })

  // Time manipulation state
  const [timeSlowed, setTimeSlowed] = useState(false)
  const [gravityFlipped, setGravityFlipped] = useState(false)

  // Game objects
  const [platforms, setPlatforms] = useState([
    { id: 1, x: 200, y: 500, width: 150, height: 20, type: 'normal' },
    { id: 2, x: 400, y: 400, width: 120, height: 20, type: 'normal' },
    { id: 3, x: 600, y: 300, width: 100, height: 20, type: 'normal' },
    { id: 4, x: 800, y: 450, width: 150, height: 20, type: 'normal' },
    { id: 5, x: 1000, y: 350, width: 120, height: 20, type: 'normal' }
  ])

  const [timeShardObjects, setTimeShardObjects] = useState([
    { id: 1, x: 250, y: 480, collected: false },
    { id: 2, x: 450, y: 380, collected: false },
    { id: 3, x: 650, y: 280, collected: false },
    { id: 4, x: 850, y: 430, collected: false },
    { id: 5, x: 1050, y: 330, collected: false }
  ])

  const [hazards, setHazards] = useState([
    { id: 1, x: 300, y: 520, width: 50, height: 30, type: 'water' },
    { id: 2, x: 500, y: 420, width: 50, height: 30, type: 'fire' },
    { id: 3, x: 700, y: 320, width: 50, height: 30, type: 'water' },
    { id: 4, x: 900, y: 470, width: 50, height: 30, type: 'fire' }
  ])

  const [doors, setDoors] = useState([
    { id: 1, x: 1100, y: 300, width: 60, height: 100, type: 'fire' },
    { id: 2, x: 1100, y: 200, width: 60, height: 100, type: 'water' }
  ])

  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    // Handle pause/resume
    if (e.key === 'Escape') {
      if (gameState === GAME_STATES.PLAYING) {
        setGameState(GAME_STATES.PAUSED)
      } else if (gameState === GAME_STATES.PAUSED) {
        setGameState(GAME_STATES.PLAYING)
      }
    }
    
    setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }))
  }, [gameState])

  const handleKeyUp = useCallback((e) => {
    setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }))
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Collision detection helper
  const checkCollision = (char, obj) => {
    return char.x < obj.x + obj.width &&
           char.x + char.width > obj.x &&
           char.y < obj.y + obj.height &&
           char.y + char.height > obj.y
  }

  // Check platform collision
  const checkPlatformCollision = (char) => {
    for (const platform of platforms) {
      if (checkCollision(char, platform)) {
        // Check if character is above platform
        if (char.y + char.height <= platform.y + 10 && char.vy >= 0) {
          return {
            onGround: true,
            y: platform.y - char.height
          }
        }
      }
    }
    return { onGround: false }
  }

  // Check hazard collision
  const checkHazardCollision = (char, charType) => {
    for (const hazard of hazards) {
      if (checkCollision(char, hazard)) {
        if ((charType === 'fireboy' && hazard.type === 'water') ||
            (charType === 'watergirl' && hazard.type === 'fire')) {
          return true
        }
      }
    }
    return false
  }

  // Check time shard collection
  const checkTimeShardCollection = (char) => {
    setTimeShardObjects(prev => prev.map(shard => {
      if (!shard.collected && checkCollision(char, shard)) {
        setTimeShards(prev => prev + 1)
        return { ...shard, collected: true }
      }
      return shard
    }))
  }

  // Check door collision
  const checkDoorCollision = (char, charType) => {
    for (const door of doors) {
      if (checkCollision(char, door) && door.type === charType) {
        return true
      }
    }
    return false
  }

  // Game loop
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) return

    const gameLoop = setInterval(() => {
      // Update time
      if (!timeSlowed) {
        setTimeLeft(prev => Math.max(0, prev - 1))
      }

      // Handle controls
      updateCharacter(fireboy, setFireboy, 'fireboy')
      updateCharacter(watergirl, setWatergirl, 'watergirl')

      // Check time shard collection
      checkTimeShardCollection(fireboy)
      checkTimeShardCollection(watergirl)

      // Check win/lose conditions
      if (timeLeft <= 0) {
        setGameState(GAME_STATES.GAME_OVER)
      }

      // Check if both characters reached their doors
      const fireboyAtDoor = checkDoorCollision(fireboy, 'fire')
      const watergirlAtDoor = checkDoorCollision(watergirl, 'water')
      if (fireboyAtDoor && watergirlAtDoor && timeShards >= 5) {
        setGameState(GAME_STATES.VICTORY)
      }
    }, 16) // ~60 FPS

    return () => clearInterval(gameLoop)
  }, [gameState, fireboy, watergirl, timeSlowed, timeLeft, timeShards, platforms, hazards, doors, timeShardObjects])

  const updateCharacter = (character, setCharacter, type) => {
    let newVx = character.vx
    let newVy = character.vy

    // Handle movement
    if (type === FIREBOY) {
      if (keys['a']) newVx = -MOVE_SPEED
      else if (keys['d']) newVx = MOVE_SPEED
      else newVx = 0

      if (keys['w'] && character.onGround) {
        newVy = JUMP_FORCE
      }

      // Time manipulation (Spacebar)
      if (keys[' ']) {
        setTimeSlowed(true)
      } else {
        setTimeSlowed(false)
      }
    } else if (type === WATERGIRL) {
      if (keys['arrowleft']) newVx = -MOVE_SPEED
      else if (keys['arrowright']) newVx = MOVE_SPEED
      else newVx = 0

      if (keys['arrowup'] && character.onGround) {
        newVy = JUMP_FORCE
      }

      // Gravity switch (Shift)
      if (keys['shift']) {
        setGravityFlipped(true)
      } else {
        setGravityFlipped(false)
      }
    }

    // Apply gravity
    const gravity = gravityFlipped ? -GRAVITY : GRAVITY
    newVy += gravity

    // Update position
    const newX = Math.max(0, Math.min(GAME_WIDTH - character.width, character.x + newVx))
    const newY = character.y + newVy

    // Check platform collision
    const platformCollision = checkPlatformCollision({ ...character, x: newX, y: newY })
    
    // Check hazard collision
    const hazardCollision = checkHazardCollision({ ...character, x: newX, y: newY }, type)
    
    // Check ground collision
    const onGround = newY >= GAME_HEIGHT - character.height - 50 || platformCollision.onGround

    // Handle hazard collision (game over)
    if (hazardCollision) {
      setGameState(GAME_STATES.GAME_OVER)
      return
    }

    setCharacter({
      ...character,
      x: newX,
      y: onGround ? (platformCollision.onGround ? platformCollision.y : GAME_HEIGHT - character.height - 50) : newY,
      vx: newVx,
      vy: onGround ? 0 : newVy,
      onGround
    })
  }

  const startGame = () => {
    setGameState(GAME_STATES.PLAYING)
    setTimeLeft(300)
    setTimeShards(0)
    setTimeSlowed(false)
    setGravityFlipped(false)
  }

  const resetGame = () => {
    setFireboy({ x: 100, y: 600, vx: 0, vy: 0, onGround: false, width: 30, height: 40 })
    setWatergirl({ x: 150, y: 600, vx: 0, vy: 0, onGround: false, width: 30, height: 40 })
    setTimeShardObjects(prev => prev.map(shard => ({ ...shard, collected: false })))
    startGame()
  }

  return (
    <div className="game-container">
      {gameState === GAME_STATES.MENU && (
        <div className="menu-screen">
          <h1 className="game-title">Jakiro</h1>
          <p className="game-subtitle">Elemental Clock Tower</p>
          <div className="controls-info">
            <h3>Controls:</h3>
            <div className="control-section">
              <h4>Fireboy (WASD):</h4>
              <p>W - Jump | A/D - Move | Space - Slow Time</p>
            </div>
            <div className="control-section">
              <h4>Watergirl (Arrow Keys):</h4>
              <p>↑ - Jump | ←/→ - Move | Shift - Reverse Gravity</p>
            </div>
          </div>
          <button className="start-button" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}

      {gameState === GAME_STATES.PLAYING && (
        <div className="game-screen">
          <div className="hud">
            <div className="hud-item">
              <span>⏰ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="hud-item">
              <span>💎 {timeShards}/5</span>
            </div>
            <div className="hud-item">
              <span>🔥 Fireboy: {timeSlowed ? 'TIME SLOWED' : 'NORMAL'}</span>
            </div>
            <div className="hud-item">
              <span>💧 Watergirl: {gravityFlipped ? 'GRAVITY REVERSED' : 'NORMAL'}</span>
            </div>
            <div className="hud-item">
              <span>ESC - Pause</span>
            </div>
          </div>
          
          <div className="game-world" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
            {/* Ground */}
            <div className="ground" style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '50px',
              background: 'linear-gradient(45deg, #8B4513, #A0522D)'
            }} />
            
            {/* Fireboy */}
            <div 
              className={`character fireboy ${timeSlowed ? 'time-effect' : ''}`}
              style={{
                position: 'absolute',
                left: fireboy.x,
                top: fireboy.y,
                width: fireboy.width,
                height: fireboy.height,
                background: 'linear-gradient(45deg, #FF4500, #FF6347)',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                border: '2px solid #FF0000',
                transform: fireboy.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)',
                transition: 'transform 0.1s ease'
              }}
            >
              <div className="character-eyes">
                <div className="eye left-eye"></div>
                <div className="eye right-eye"></div>
              </div>
            </div>
            
            {/* Watergirl */}
            <div 
              className={`character watergirl ${gravityFlipped ? 'gravity-effect' : ''}`}
              style={{
                position: 'absolute',
                left: watergirl.x,
                top: watergirl.y,
                width: watergirl.width,
                height: watergirl.height,
                background: 'linear-gradient(45deg, #00BFFF, #1E90FF)',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                border: '2px solid #0000FF',
                transform: watergirl.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)',
                transition: 'transform 0.1s ease'
              }}
            >
              <div className="character-eyes">
                <div className="eye left-eye"></div>
                <div className="eye right-eye"></div>
              </div>
            </div>
            
            {/* Platforms */}
            {platforms.map(platform => (
              <div
                key={platform.id}
                className="platform"
                style={{
                  position: 'absolute',
                  left: platform.x,
                  top: platform.y,
                  width: platform.width,
                  height: platform.height,
                  background: 'linear-gradient(45deg, #8B4513, #A0522D)',
                  border: '2px solid #654321',
                  borderRadius: '5px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
                }}
              />
            ))}

            {/* Time Shards */}
            {timeShardObjects.map(shard => !shard.collected && (
              <div
                key={shard.id}
                className="time-shard"
                style={{
                  position: 'absolute',
                  left: shard.x,
                  top: shard.y,
                  width: 20,
                  height: 20,
                  background: 'radial-gradient(circle, #FFD700, #FFA500)',
                  borderRadius: '50%',
                  border: '2px solid #FF8C00',
                  boxShadow: '0 0 15px rgba(255, 215, 0, 0.8)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
            ))}

            {/* Hazards */}
            {hazards.map(hazard => (
              <div
                key={hazard.id}
                className={`hazard hazard-${hazard.type}`}
                style={{
                  position: 'absolute',
                  left: hazard.x,
                  top: hazard.y,
                  width: hazard.width,
                  height: hazard.height,
                  background: hazard.type === 'fire' 
                    ? 'linear-gradient(45deg, #FF4500, #FF6347)' 
                    : 'linear-gradient(45deg, #00BFFF, #1E90FF)',
                  borderRadius: '5px',
                  border: `2px solid ${hazard.type === 'fire' ? '#FF0000' : '#0000FF'}`,
                  boxShadow: `0 0 10px ${hazard.type === 'fire' ? 'rgba(255, 69, 0, 0.6)' : 'rgba(0, 191, 255, 0.6)'}`,
                  animation: 'glow 1.5s ease-in-out infinite alternate'
                }}
              />
            ))}

            {/* Doors */}
            {doors.map(door => (
              <div
                key={door.id}
                className={`door door-${door.type}`}
                style={{
                  position: 'absolute',
                  left: door.x,
                  top: door.y,
                  width: door.width,
                  height: door.height,
                  background: door.type === 'fire' 
                    ? 'linear-gradient(180deg, #FF4500, #FF6347, #8B0000)' 
                    : 'linear-gradient(180deg, #00BFFF, #1E90FF, #000080)',
                  border: `3px solid ${door.type === 'fire' ? '#FF0000' : '#0000FF'}`,
                  borderRadius: '10px',
                  boxShadow: `0 0 20px ${door.type === 'fire' ? 'rgba(255, 69, 0, 0.8)' : 'rgba(0, 191, 255, 0.8)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                }}
              >
                {door.type === 'fire' ? 'FIRE' : 'WATER'}
              </div>
            ))}

            {/* Clock Tower Background Elements */}
            <div className="clock-tower-bg">
              <div className="gear gear-1" />
              <div className="gear gear-2" />
              <div className="pendulum" />
            </div>
          </div>
        </div>
      )}

      {gameState === GAME_STATES.PAUSED && (
        <div className="pause-screen">
          <h1>Game Paused</h1>
          <p>Press ESC to resume or click the button below</p>
          <button className="resume-button" onClick={() => setGameState(GAME_STATES.PLAYING)}>
            Resume Game
          </button>
          <button className="restart-button" onClick={resetGame}>
            Restart Game
          </button>
        </div>
      )}

      {gameState === GAME_STATES.GAME_OVER && (
        <div className="game-over-screen">
          <h1>Game Over!</h1>
          <p>Time's up! The clock tower remains unstable.</p>
          <button className="restart-button" onClick={resetGame}>
            Try Again
          </button>
        </div>
      )}

      {gameState === GAME_STATES.VICTORY && (
        <div className="victory-screen">
          <h1>Victory!</h1>
          <p>You've restored balance to the Elemental Clock Tower!</p>
          <button className="restart-button" onClick={resetGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default App
