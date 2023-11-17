import {
    createObstacle,
    createShape, renderBlocksFromShape,
    rotateKickShape, updateStateWithNewShape
} from "./shapes";

import {
    State, Shape, Movement,
    Action, Spawn, Block,
    Constants, GridPosition
} from "./types";

import { RNG, constructGrid, findFullRowsOfGrid } from "./utils";

const
    { GRID_HEIGHT, GRID_WIDTH } = Constants,
    {
        SPAWN_CANVAS_X, SPAWN_CANVAS_Y,
        SPAWN_PREVIEW_X, SPAWN_PREVIEW_Y
    } = Spawn

/**
 * A function to apply Action to state
 * @param s the current state
 * @param action action to apply to the state
 * @returns the updated state
 */
const reduceState = (s: State, action: Action) => action.apply(s);

/**
 * Get all grid position of fixed blocks within the current state
 * @param s current state
 * @returns an array of GridPosition
 */
const getGridPositionsFromState = (s: State): ReadonlyArray<GridPosition> => {
    // Scale down x and y of each block to fit into the
    // correct position of the grid
    return s.fixedShapes
        .flatMap(
            shape => shape.blocks
        )
        .map(({ x, y }) => ({
            x: x / Block.WIDTH,
            y: y / Block.HEIGHT
        }))
}

/**
 * Update the current state by:
 * - Replace the shape in currentShape by nextShape,
 * - Create a new shape and add to the nextShape
 */
class AddShapeAction implements Action {

    constructor(public readonly randomPair: ReadonlyArray<number>) { }

    apply(s: State): State {
        const newShape: Shape = createShape(
            // already have the first one
            // and we don't want to account for the obstacles' id
            this.randomPair, s.fixedShapes.length - s.obstacles.length + 2
        );

        return {
            ...s,
            currentShape: {
                ...s.nextShape,
                x: SPAWN_CANVAS_X,
                y: SPAWN_CANVAS_Y
            },
            nextShape: {
                ...newShape,
                x: SPAWN_PREVIEW_X,
                y: SPAWN_PREVIEW_Y
            }
        }
    }
}

/**
 * Update the current state by:
 * - update the x, y coordinates of the currentShape
 */
class MoveAction implements Action {
    constructor(public readonly movement: Movement) { }
    /**
     * Move the current shape by updating the state
     * @param state the state to update
     * @param movement the movement of the shape
     * @returns the updated state
     */
    apply(s: State): State {
        if (!s.currentShape) return s;
        const oldShape: Shape = s.currentShape;
        const { deltaX, deltaY } = this.movement;
        const newShape: Shape = {
            ...oldShape,
            x: oldShape.x + deltaX,
            y: oldShape.y + deltaY
        }
        return updateStateWithNewShape(s, newShape);
    }
}

/**
 * Update the current state by:
 * - update the angle of the currentShape
 */
class RotateAction implements Action {
    /**
     * Rotate the current shape by creating a new updated state
     * @param state the state to update
     * @param movement the movement of the shape
     * @returns the updated state
     */
    apply(s: State): State {
        if (!s.currentShape) return s;
        const newShape: Shape = rotateKickShape({
            ...s.currentShape,
            angle: (s.currentShape.angle + 90) % 360,
        })
        return updateStateWithNewShape(s, newShape);
    }
}

/**
 * Control the score mechanism
 */
class ScoreAction implements Action {

    /**
     * Update the score and remove clear blocks
     * @param s the current state
     * @returns updated state
     */
    apply(s: State): State {

        // Construct a scale down grid from current state
        const currentGrid = constructGrid(
            GRID_WIDTH,
            GRID_HEIGHT,
            getGridPositionsFromState(s)
        )

        // Get all full rows' index and map to the correct y-axis coordinates
        const fullRowsYCoordinates = findFullRowsOfGrid(currentGrid).map(
            index => index * Block.HEIGHT
        );

        // remove blocks that are on full rows and update all blocks (drop down)
        const newFixedShapes = s.fixedShapes.map(shape => {

            const adjustedBlocks = shape.blocks
                .filter(
                    ({ y }) => !fullRowsYCoordinates.includes(y) // filter blocks that will be removed
                )
                .map(block => {

                    const countClearRowsBelowBlock: number = fullRowsYCoordinates
                        .filter(
                            clearRow => clearRow > block.y
                        ).length;

                    // block's height * number of removed rows (under this block) 

                    return { ...block, y: block.y + block.height * countClearRowsBelowBlock };
                });

            return { ...shape, blocks: adjustedBlocks };
        })

        // For simplicity, earned score will equal to: 
        // the number of clear rows * the current level
        const newScore = s.stats.score + fullRowsYCoordinates.length * s.stats.level
        return {
            ...s,
            stats: {
                ...s.stats,
                score: newScore
            },
            fixedShapes: newFixedShapes
        }
    }

}

/**
 * Check if the end game condition is met
 */
class EndGameAction implements Action {

    /**
     * Update the gameEnd condition
     * @param s the current state
     * @returns the updated state
     */
    apply(s: State): State {
        if (!s.currentShape) return s;
        const gameEnd: boolean = s.currentShape.blocks.every(
            block => block.y - block.height < 0
        )
        return {
            ...s,
            gameEnd: gameEnd
        };
    }
}

/**
 * Restart the game when the game is over (keeping the highest score)
 */
class RestartGameAction implements Action {
    /**
     * If the game is end, 
     * then we restart everything to initial_state, 
     * and update the highest score.
     * @param s the current state
     * @returns updated state if the game is end, the input state otherwise
     */
    apply(s: State): State {
        const { score, highScore } = s.stats;
        return s.gameEnd ? {
            ...INITIAL_STATE,
            stats: {
                score: 0,
                level: 1,
                highScore: highScore > score ? highScore : score
            },
            gameEnd: false
        } : s
    }
}

/**
 * Check if the player has enough points to get to 
 * the next level and signal the view to level up
 */
class CheckLevelUpAction implements Action {
    /**
     * If the current score is larger than current level * 10,
     * we signal that we can level up
     */
    apply(s: State): State {
        const { level, score } = s.stats;
        const isLevelUp: boolean = score >= (level * 10)
        return {
            ...s,
            levelUp: isLevelUp
        }
    }
}

/**
 * Perform the level up action:
 * - Add obstacles to the grid
 * - Restart to initial state but keeping score and high score
 * - Increment the level by 1
 */
class NextLevelAction implements Action {
    constructor(public readonly randomPair: ReadonlyArray<number>) { }

    apply(s: State): State {
        return s.levelUp ? this.addObstacle(s) : s;
    }

    /**
     * Clear and add obstacles
     * @param s the current state
     * @returns the updated state
     */
    addObstacle(s: State): State {
        const { level } = s.stats

        // Scale [-1, 1] number to the grid sizes 10x20
        // [0, 9]
        const scaleX = RNG.scaleToRange(
            this.randomPair[0],
            0,
            GRID_WIDTH - 1
        );

        // keep it under the lower half of the grid for better game play
        // [10, 19]
        const scaleY = RNG.scaleToRange(
            this.randomPair[1],
            GRID_HEIGHT / 2,
            GRID_HEIGHT - 1
        )

        // Actual positions in the canvas
        const actualX = scaleX * Block.WIDTH;
        const actualY = scaleY * Block.HEIGHT

        const newObstacle: Shape = createObstacle(
            -(s.obstacles.length + 1),
            actualX,
            actualY
        )

        const newObstaclesArray = s.obstacles.concat(
            {
                ...newObstacle,
                blocks: renderBlocksFromShape(newObstacle)
            }
        );

        // fixedShapes array also contains obstacles so that we can check for collisions
        return {
            ...INITIAL_STATE,
            stats: {
                ...s.stats,
                level: level + 1
            },
            fixedShapes: newObstaclesArray,
            obstacles: newObstaclesArray
        }
    }
}

/**
 * Update the current state each tick:
 * - drop the shape in yaxis by a dropping rate
 */
class TickAction implements Action {
    /**
     * Drop the current shape by updating the state
     * @param state the state to update
     * @param movement the movement of the shape
     * @returns the updated state
     */
    apply(s: State): State {
        return (s.gameEnd || s.levelUp) ? s : [
            new CheckLevelUpAction(),
            new MoveAction({ deltaX: 0, deltaY: s.dropRate }),
            new ScoreAction(),
            new EndGameAction()
        ].reduce(reduceState, s);
    }
}

/**
 * A game cycle, actions that may be performed between the spawn of the current shape and the next shape 
 */
class GameCycleAction implements Action{
    constructor(public readonly randomPair: ReadonlyArray<number>) { }
    /**
     * Apply the correct action to the state
     * @param s the current state
     * @returns the updated state
     */
    apply(s:State): State {
        if (s.levelUp) return new NextLevelAction(this.randomPair).apply(s);
        if (s.gameEnd) return new RestartGameAction().apply(s);
        return new AddShapeAction(this.randomPair).apply(s);
    }
} 

// Initial shape
const initialShape = {
    ...createShape([0, 0], 1),
    x: SPAWN_PREVIEW_X,
    y: SPAWN_PREVIEW_Y
};

// Initial state of the game
const INITIAL_STATE: State = {
    gameEnd: false,
    currentShape: null,
    nextShape: initialShape,
    fixedShapes: [],
    stats: {
        level: 1,
        highScore: 0,
        score: 0
    },
    dropRate: Block.HEIGHT,
    obstacles: [],
    levelUp: false
} as const;

export {
    MoveAction, RotateAction,
    TickAction, GameCycleAction, RestartGameAction,
    reduceState, INITIAL_STATE
}