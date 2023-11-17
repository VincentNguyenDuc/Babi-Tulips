// Utility functions and definitions.
// Nothing here is specific to asteroids.

import { GridPosition, NumbersMatrix } from "./types";

// Everything is designed to be as reusable as possible in many different contexts.
export {
    RNG, createSvgElement,
    rotateMatrix, rotateMatrixNTimes, replace,
    constructGrid, findFullRowsOfGrid
}

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
    namespace: string | null,
    name: string,
    props: Record<string, string> = {}
) => {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
};

/**
 * A random number generator which provides two pure functions
 * `hash` and `scaleToRange`.  Call `hash` repeatedly to generate the
 * sequence of hashes.
 */
abstract class RNG {
    // LCG using GCC's constants
    private static m = 0x80000000; // 2**31
    private static a = 1103515245;
    private static c = 12345;

    /**
     * Call `hash` repeatedly to generate the sequence of hashes.
     * @param seed 
     * @returns a hash of the seed
     */
    public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

    /**
     * Takes hash value and scales it to the range [-1, 1]
     */
    public static scale = (hash: number) => (2 * hash) / (RNG.m - 1) - 1;

    /**
     * Scale random number in range [-1, 1] to range [from, to] with a step of 1
     * @param hash a hash value
     * @param from min (included)
     * @param to max (included)
     * @returns an int in range [from, to]
     */
    public static scaleToRange = (
        hash: number,
        from: number, to: number
    ) => Math.floor((hash + 1) / 2 * (to - from + 1) + from)
}

/**
 * Rotate a numeric 2D array 90 degrees to the right
 * E.g:
 * [[1, 2, 3],
 *  [4, 5, 6],
 *  [7, 8, 9]]
 * becomes
 * [[7, 4, 1],
 *  [8, 5, 2],
 *  [9, 6, 3]]
 * 
 * @param matrix 
 * @returns a new rotated matrix
 */
const rotateMatrix =
    (matrix: NumbersMatrix): NumbersMatrix => {
        const n = matrix.length;

        const rotatedMatrix: NumbersMatrix = matrix.map((row, i) =>
            row.map((_, j) => matrix[n - j - 1][i])
        );

        return rotatedMatrix;
    }

/**
 * Rotate a numeric 2D array N times to the right
 * @param times the number of times to rotate
 * @returns a new rotated matrix
 */
const rotateMatrixNTimes =
    (times: number) =>
        (matrix: NumbersMatrix): NumbersMatrix =>
            Array
                .from({ length: times % 4 })
                .reduce(
                    (acc: NumbersMatrix, _) => rotateMatrix(acc),
                    matrix
                );


/**
 * Purely replace an item at a given index by a new item
 * @param array a given index
 * @param newItem the item to replace
 * @param index the index to replace
 * @returns a new array
 */
function replace<T>(array: ReadonlyArray<T>, newItem: T, index: number): ReadonlyArray<T> {
    return Array
        .prototype
        .concat(
            array.slice(0, index),
            [newItem],
            array.slice(index + 1)
        )
}

/**
 * Construct a width * height 2D array and fill with 0
 * @param width the width of the grid
 * @param height the height of the grid
 * @returns a grid
 */
const constructGrid = (
    width: number,
    height: number,
    positions: ReadonlyArray<GridPosition> | null = null
): NumbersMatrix => {
    const emptyGrid = Array.from(
        { length: height },
        () => Array(width).fill(0)
    );

    return positions === null ? emptyGrid : updateGrid(emptyGrid, positions)
}

/**
 * Update the position within the grid using an array of positions
 * @param oldGrid the old grid
 * @param positions positions array
 * @returns updated grid
 */
const updateGrid = (oldGrid: NumbersMatrix, positions: ReadonlyArray<GridPosition>) => {
    return positions.reduce(
        (accGrid, { x, y }) => {
            const rowToUpdate = accGrid[y];
            const updatedRow = replace(rowToUpdate, 1, x);
            const updatedGrid = replace(accGrid, updatedRow, y);

            return updatedGrid;
        },
        oldGrid
    )
}

/**
 * Find and return an array of indexes of rows that are full in the grid
 * @param grid a given grid
 * @returns an array of index
 */
const findFullRowsOfGrid = (grid: NumbersMatrix): ReadonlyArray<number> => {
    return grid.reduce((accArray, row, rowIndex) => {
        const isFull = row.every(cell => cell === 1);
        return isFull ? accArray.concat(rowIndex) : accArray;
    }, [] as const);
}