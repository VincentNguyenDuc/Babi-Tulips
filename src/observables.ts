import { fromEvent, interval, merge, zip } from "rxjs";
import { map, filter, scan } from "rxjs/operators";
import { Key, Constants, Block } from "./types";
import { MoveAction, GameCycleAction, RotateAction, TickAction } from "./states"
import { RNG } from "./utils";

const { TICK_RATE_MS } = Constants

/** User input */

const key$ = fromEvent<KeyboardEvent>(document, "keypress");

/**
 * Filter the key code, and map to the equivalent type
 * @param keyCode a keyboard key
 * @param result a function to mapa
 * @returns the equivalent type
 */
const fromKey = <T>(keyCode: Key, result: () => T) =>
    key$.pipe(
        filter(({ code }) => code === keyCode),
        map(result)
    );

/** Create a stream of random numbers from a given seed */
const rng$ = (seed: number) =>
    interval(TICK_RATE_MS * 30).pipe(
        scan(RNG.hash, seed),
        map(RNG.scale)
    )

/**
 * An observable that emit the Game Cycle Action every 30 * TICK_RATE_MS 
 */
const gameCycle$ = zip(rng$(16012004), rng$(19082004)).pipe(
    map(pair => new GameCycleAction(pair))
)

/**
 * Movement of the shape from keyboard
 * - Press A to move left
 * - Press D to move right
 * - Press S to move down
 * - Press Space to rotate
 */
const left$ = fromKey("KeyA", () => new MoveAction({ deltaX: -Block.WIDTH, deltaY: 0 }));
const right$ = fromKey("KeyD", () => new MoveAction({ deltaX: Block.WIDTH, deltaY: 0 }));
const down$ = fromKey("KeyS", () => new MoveAction({ deltaX: 0, deltaY: Block.HEIGHT }));
const rotate$ = fromKey("Space", () => new RotateAction());

/**
 * Merge every movement into a single observable
 */
const movement$ = merge(left$, right$, down$, rotate$);

/** Determines the rate of time steps */
const tick$ = interval(TICK_RATE_MS).pipe(
    map(_ => new TickAction())
);

/**
 * Observable that control the whole game
 */
const action$ = merge(movement$, tick$, gameCycle$)

export { action$ }