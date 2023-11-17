import { State, Shape, SingleBlock, Viewport, Block, ShapeType } from "./types";
import { RNG, rotateMatrixNTimes } from "./utils";

const { CANVAS_HEIGHT, CANVAS_WIDTH } = Viewport

const ALL_SHAPE_TYPES: ReadonlyArray<ShapeType> = [
    {
        name: "O",
        matrix: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        color: "green"
    },
    {
        name: "L",
        matrix: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]],
        color: "blue"
    },
    {
        name: "J",
        matrix: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: "pink"
    },
    {
        name: "S",
        matrix: [
            [0, 0, 0],
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: "red"
    },
    {
        name: "Z",
        matrix: [
            [0, 0, 0],
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: "purple"
    },
    {
        name: "I",
        matrix: [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        color: "orange"
    },
    {
        name: "T",
        matrix: [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0]
        ],
        color: "yellow"
    }
] as const;

const ALL_SHAPE_ANGLES: ReadonlyArray<number> = [0, 90, 180, 270] as const;

/**
 * Create a matrix with correct coordinates and angle from a given shape
 * @param shape a given shape
 * @returns An array of single blocks
 */
const renderBlocksFromShape = (shape: Shape): ReadonlyArray<SingleBlock> => {
    // Calculate the rotated matrix based on angle
    const matrix = shape.type.matrix;
    const rotateCount = (shape.angle / 90) % 4;
    const rotatedMatrix = rotateMatrixNTimes(rotateCount)(matrix);

    // Create an array of blocks with the rotated matrix and the position of the shape
    const blocks = rotatedMatrix.flatMap((row, rowIndex) => row
        .map((value, colIndex) => (
            value === 1 ?
                {
                    x: shape.x + colIndex * Block.WIDTH,
                    y: shape.y + rowIndex * Block.HEIGHT,
                    width: Block.WIDTH,
                    height: Block.HEIGHT
                } : null
        ))
    ).filter((block): block is SingleBlock => block !== null);
    return blocks;
}

/**
 * Create a shape with random type
 * @param id the id number of the shape (if undefined then using 0 as the index of the shape)
 * @returns a new shape
 */
const createShape = (randomPair: ReadonlyArray<number>, id: number = 0): Shape => {

    const randomType: ShapeType = ALL_SHAPE_TYPES[
        RNG.scaleToRange(randomPair[0], 0, ALL_SHAPE_TYPES.length - 1)
    ];

    const randomAngle: number = ALL_SHAPE_ANGLES[
        RNG.scaleToRange(randomPair[1], 0, ALL_SHAPE_ANGLES.length - 1)
    ];
    const shape: Shape = {
        id: `shape${id}`,
        x: 0,
        y: 0,
        angle: randomAngle,
        type: randomType,
        blocks: [],
        width: Block.WIDTH * randomType.matrix[0].length,
        height: Block.HEIGHT * randomType.matrix.length,
        fix: false
    };

    return shape;
};

/**
 * Create a random obstacle.
 * Reuse the type Shape to make the obstacles easily align with other checkings and calculations. 
 * The id of obstacles will be shape_-1, shape_-2,... so that they will not share the same id as actual shapes.
 * @param id the id of the obstacle (must be < 0)
 * @param x the x coordinates
 * @param y the y coordinates
 * @returns the obstacle
 */
const createObstacle = (id: number, x: number, y: number): Shape => {
    // obstacles will be randomly spawned 
    // (keep them under the lower half of the grid for better game play)
    return {
        id: `shape${id}`,
        x: x,
        y: y,
        angle: 0,
        type: {
            name: "Obstacle",
            matrix: [[1]],
            color: "grey"
        },
        blocks: [],
        width: Block.WIDTH,
        height: Block.HEIGHT,
        fix: true
    }
}

/**
 * Check and Update a shape's conditions
 * - If update is not allow, then just return the old shape.
 * - Else, update the blocks array within the newShape (based on conditions: angle, x, y,...) 
 * and return the newShape.
 * 
 * @param newShape a new shape with conditions updated (except the blocks array)
 * @param s the current state
 */
const updateShape = (
    s: State,
    newShape: Shape,
): Shape | null => {
    if (newShape.fix) return s.currentShape;

    // Get all the blocks within the fixed shapes of current state
    const allBlocks: ReadonlyArray<SingleBlock> = s.fixedShapes
        .flatMap(shape => shape.blocks)

    // the new blocks array from the new shape
    const newBlocks = renderBlocksFromShape(newShape);

    /**
     * Check if we can perform action such as: Move, Rotate,... to the newShape 
     * @returns true if can perform, false otherwise
     */
    const canUpdate = (): boolean => {
        // Check if each block is within the canvas or not
        const insideGrid: boolean = newBlocks.every(({ x, y }) =>
            x >= 0 && x < CANVAS_WIDTH && y < CANVAS_HEIGHT
        )

        // Check if there is any overlap with other blocks
        const noOverlapBlocks = !newBlocks.some(block1 =>
            allBlocks.some(block2 =>
                block1.x === block2.x && block1.y === block2.y
            )
        );
        return noOverlapBlocks && insideGrid;
    }

    /**
     * Check if after perform the action, the newShape will be fixed or not
     * @returns true if fix, false otherwise
     */
    const isFix = (): boolean => {
        // Check if the new shape hits other shapes (but with its bottom)
        // If true, then the shape is fixed
        const hasCollisions = newBlocks.some(block1 =>
            allBlocks.some(block2 =>
                block1.x === block2.x && block1.y === block2.y - Block.HEIGHT
            )
        );

        // Check if the new shape hits the ground
        // If true, then the shape is fixed
        const hitGround = newBlocks.some(
            block => block.y === CANVAS_HEIGHT - Block.HEIGHT
        )

        // check if the shape will be fix or not
        return hasCollisions || hitGround;
    }

    return canUpdate() ? {
        ...newShape,
        blocks: newBlocks,
        fix: isFix()
    } : s.currentShape
}

/**
 * Update a given state with a new shape
 * @param s a given state
 * @param newShape a new shape
 * @returns updated state
 */
const updateStateWithNewShape = (s: State, newShape: Shape): State => {
    const updatedShape = updateShape(s, newShape);

    if (s.gameEnd || !updatedShape) return s;

    if (updatedShape.fix) return {
        ...s,
        currentShape: null,
        fixedShapes: s.fixedShapes.concat(updatedShape)
    }

    return {
        ...s,
        currentShape: updatedShape
    };
}

/**
 * Perform kicking on the shape if it hits the left wall
 * @param shape a given shape
 * @returns kicked shape
 */
const kickShapeLeftWall = (shape: Shape): Shape => {
    const { x, blocks } = shape;

    const leftMostBlockX = blocks.reduce(
        (smallestX, { x }) => Math.min(smallestX, x), Infinity
    );

    const offset = -x;

    return leftMostBlockX <= Block.WIDTH ? {
        ...shape,
        x: x + offset
    } : shape
}

/**
 * Perform kicking on the shape if it hits the right wall
 * @param shape a given shape
 * @returns kicked shape
 */
const kickShapeRightWall = (shape: Shape): Shape => {
    const { x, blocks, width } = shape;

    const rightMostBlockX = blocks.reduce(
        (largestX, { x }) => Math.max(largestX, x), -Infinity
    );

    const offset = CANVAS_WIDTH - (x + width);

    return rightMostBlockX >= CANVAS_WIDTH - 2 * Block.WIDTH ? {
        ...shape,
        x: x + offset
    } : shape
}

/**
 * Handle the kicking when rotate of shape
 * @param shape a given shape
 * @returns kicked shape
 */
const rotateKickShape = (shape: Shape): Shape => {
    return [
        kickShapeLeftWall,
        kickShapeRightWall
    ].reduce(
        (accShape, func) => func(accShape),
        shape
    )
}

export {
    updateStateWithNewShape,
    createShape,
    createObstacle,
    rotateKickShape,
    renderBlocksFromShape
}