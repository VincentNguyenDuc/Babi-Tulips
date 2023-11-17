/** Constants */
const Seed = {
    RNG_SEED_1: 16012004,
    RNG_SEED_2: 19082004
} as const;

const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    PREVIEW_WIDTH: 160,
    PREVIEW_HEIGHT: 80
} as const;

const Constants = {
    TICK_RATE_MS: 200,
    GRID_WIDTH: 10,
    GRID_HEIGHT: 20
} as const;

const Block = {
    WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
    HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
} as const;

const Spawn = {
    SPAWN_CANVAS_X: Viewport.CANVAS_WIDTH / 2 - 2 * Block.WIDTH,
    SPAWN_CANVAS_Y: 0,
    SPAWN_PREVIEW_X: Viewport.PREVIEW_WIDTH / 2 - 2 * Block.WIDTH,
    SPAWN_PREVIEW_Y: 0
} as const;


/**
 * Readonly 2D array of numbers
 */
type NumbersMatrix = ReadonlyArray<ReadonlyArray<number>>;

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD" | "Space" | "Enter" | "KeyW";

type Event = "keydown" | "keyup" | "keypress";


/** 
 * State propreties 
 * - fixedShapes: an array of all shapes that are fix
 * - obstacles: an array of all obstacles
 * - levelUp: if true, then signal to perform level up actions
 * - gameEnd: if true, then signal to perform game restart actions
 */

type State = Readonly<{
    gameEnd: boolean,
    currentShape: Shape | null,
    nextShape: Shape,
    fixedShapes: ReadonlyArray<Shape>,
    stats: Statistics,
    dropRate: number,
    obstacles: ReadonlyArray<Shape>,
    levelUp: boolean,
    tulips: number
}>;

/**
 * Statistics of the game
 */
type Statistics = Readonly<{
    level: number,
    highScore: number,
    score: number
}>

/**
 * Movement of a shape
 */
type Movement = Readonly<{
    deltaX: number,
    deltaY: number
}>

/**
 * Position within the grid.
 * - x must in the range [0, Constants.GRID_WIDTH]
 * - y must in the range [0, Constants.GRID_HEIGHT]
 */
type GridPosition = Readonly<{
    x: number,
    y: number
}>

/**
 * Action interface, similar to FRP Asteroids
 */
interface Action {
    apply(s: State): State;
}

/** An object that represent a single block */
type SingleBlock = Readonly<{
    x: number,
    y: number,
    width: number,
    height: number
}>

/** Shape Properties */

/**
 * A type of shape
 * - name: name of the type
 * - matrix: 2D array representing the shape of a tetris shape
 * Sorry for the wording :)
 */
type ShapeType = Readonly<{
    name: "L" | "O" | "J" | "Z" | "S" | "I" | "T" | "Obstacle",
    matrix: NumbersMatrix,
    color: "green" | "red" | "blue" | "yellow" | "pink" | "purple" | "orange" | "grey"
}>

/**
 * A shape:
 * - id: `shape${id}` => id of the svg group element
 * - x, y: coordinates within the canvas
 * - fix: if true then the shape is at a fix position
 * - blocks: contains all the blocks of this shape,
 * must be keep up-to-date
 */
type Shape = Readonly<{
    id: string,
    x: number,
    y: number,
    angle: number,
    type: ShapeType,
    blocks: ReadonlyArray<SingleBlock>,
    width: number,
    height: number,
    fix: boolean
}>

export type {
    NumbersMatrix,
    Key, Event, GridPosition, Movement,
    State, Statistics,
    Shape, ShapeType, SingleBlock,
    Action
}
export { Viewport, Constants, Block, Spawn, Seed };