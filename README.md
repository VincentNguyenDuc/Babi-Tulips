# FRP Telips

## Usage

Setup (requires node.js):
```
> npm install
```

Start tests:
```
> npm test
```

Serve up the App (and ctrl-click the URL that appears in the console)
```
> npm run dev
```

## Game Instructions and Rules

1. Blocks Movement:
- Left, right, down: "KeyA", "KeyD", "KeyS"
- Rotate: "Space"
- Wall-kicks included

2. Score calculation:
- Earn score = (number of rows clear) * (current level).

3. Level Up:
- Level up when reaching the score of (current level * 10).
- When level up, the canvas will be completely clear, and obstacles will be randomly added. The game will continue after some wait time.

4. End Game:
- The game will end when the next shape cannot be spawned. 
- The game will be restart (after some wait time) with highest score updated.

5. Spawn:
- Spawn at the top of the canvas (the shape will not be out of the canvas).
- Shapes will be spawn with random types (7 types) and random angles (0 | 90 | 180 | 270).

6. Obstacles:
- 1x1 blocks with "grey" color.
- The number of obstacles equal to (current level - 1), so this slightly increases the difficuly of the game after level up. 
- Level 1 does have any obstacle.
- When clear rows under obstacles, the obstacles will also be moved down. This is just for easier gameplay.
- Obstacles can be normally clear.


## FIles Structure

```
src/
  main.ts        -- game loop
  types.ts       -- common types and type aliases
  util.ts        -- utility functions
  state.ts       -- state processing and transformation
  shapes.ts      -- shapes update and calculations
  view.ts        -- rendering
  observable.ts  -- capture and unify observables streams
```
