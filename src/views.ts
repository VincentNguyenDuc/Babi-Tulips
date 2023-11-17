import { State, Block, Shape, Statistics, Viewport } from "./types";
import { createSvgElement } from "./utils";

const {
    CANVAS_HEIGHT, CANVAS_WIDTH,
    PREVIEW_HEIGHT, PREVIEW_WIDTH
} = Viewport

/**
 * Initial game set up.
 * Basically just group the original code inside a function.
 */
const canvasSetUp = (): void => {
    // Set up height and width of the canvas
    const canvas = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;
    canvas.setAttribute("height", `${CANVAS_HEIGHT}`);
    canvas.setAttribute("width", `${CANVAS_WIDTH}`);

    const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
        HTMLElement;
    preview.setAttribute("height", `${PREVIEW_HEIGHT}`);
    preview.setAttribute("width", `${PREVIEW_WIDTH}`);
}

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement): void => {
    elem.setAttribute("visibility", "visible");
    elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement): void =>
    elem.setAttribute("visibility", "hidden");

/**
 * Clear every shapes in the svg
 * @param elem an svg grapphics element
 * @param s the current state
 */
const clear = (s: State): void => {
    const canvas = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;

    const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
        HTMLElement;
    const { currentShape, nextShape, fixedShapes } = s;
    if (currentShape) canvas.querySelector(`#${currentShape.id}`)?.remove()
    preview.querySelector(`#${nextShape.id}`)?.remove()
    fixedShapes.forEach(shape =>
        canvas.querySelector(`#${shape.id}`)?.remove()
    )
}

/**
 * Render a shape to a svg using group element
 * @param svg svg to render to
 * @param uniqueShape if true then we remove the current shape before append a new shape
 * @returns null
 */
const renderShape = (svg: SVGGraphicsElement & HTMLElement) =>
    (shape: Shape): void => {
        // Only render a shape once
        if (svg.querySelector(`#${shape.id}`)) return;

        // Wrap blocks within a group element
        const g = <SVGGraphicsElement>createSvgElement(svg.namespaceURI, "g");
        g.setAttribute("id", `${shape.id}`);

        // Render svg blocks (rects) from the shape type's matrix
        // Append to the group element
        shape
            .type
            .matrix
            .forEach((row, rowIndex) => {
                row
                    .map((value, colIndex): SVGElement => {
                        const style = value === 1
                            ?
                            `fill: ${shape.type.color}`
                            :
                            "fill-opacity: 0; stroke-opacity: 0";
                        return createSvgElement(g.namespaceURI, "rect", {
                            height: `${Block.HEIGHT}`,
                            width: `${Block.WIDTH}`,
                            x: `${Block.WIDTH * colIndex}`,
                            y: `${Block.HEIGHT * rowIndex}`,
                            style: style
                        })
                    })
                    .forEach(cube => g.appendChild(cube))
            })

        const { x, y, angle, width, height } = shape;
        g.setAttribute(
            'transform',
            `rotate(${angle} ${x + width / 2} ${y + height / 2}) translate(${x}, ${y})`
        )
        // Append new shape to svg
        svg.appendChild(g);
    }

/**
 * Render stats of the game from the state
 * @param s the current state
 */
const renderStats = (s: State): void => {
    const levelText = document.querySelector("#levelText") as HTMLElement;
    const scoreText = document.querySelector("#scoreText") as HTMLElement;
    const highScoreText = document.querySelector("#highScoreText") as HTMLElement;
    const { level, score, highScore }: Statistics = s.stats;
    levelText.textContent = `${level}`;
    scoreText.textContent = `${score}`;
    highScoreText.textContent = `${highScore}`;
}

/**
 * Spawn new shape and preview shape from the state
 * @param s the current state
 */
const spawnShape = (s: State): void => {

    // Add blocks to the main grid canvas
    const canvas = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;
    if (s.currentShape) renderShape(canvas)(s.currentShape);

    // Add blocks to the preview canvas
    const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
        HTMLElement;
    preview.lastChild?.remove(); // Remove the last preview if exist
    renderShape(preview)(s.nextShape);
}

/**
 * Spawn obstacles to the grid
 * @param s current state
 */
const spawnObstacles = (s: State): void => {
    const canvas = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;
    s.obstacles.forEach(
        shape => renderShape(canvas)(shape)
    )
}

/**
 * Control the movement of the current shape
 * @param s the current state
 */
const controlShape = (s: State): void => {
    if (!s.currentShape) return;
    // Update current shape
    const { x, y, angle, id, width, height } = s.currentShape;
    const svgShape = document.querySelector(`#${id}`) as SVGGraphicsElement;

    svgShape.setAttribute(
        'transform',
        `rotate(${angle} ${x + width / 2} ${y + height / 2}) translate(${x},${y})`
    );
}

/**
 * Render the game over element when it is game over
 * @param s the current state
 */
const gameOver = (s: State): void => {
    const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
        HTMLElement;

    if (s.gameEnd) {
        show(gameover);
        clear(s);
    } else {
        hide(gameover);
    }
}

/**
 * Clear all shapes and show the level up text
 * @param s current state
 */
const levelUp = (s: State): void => {
    const levelUp = document.querySelector("#levelUp") as SVGGraphicsElement &
        HTMLElement;

    if (s.levelUp) {
        show(levelUp);
        clear(s);
    } else {
        hide(levelUp);
    }
}

/**
 * Clear full rows
 * @param s the current state
 */
const score = (s: State): void => {

    const canvas = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;

    // Clear fixed shape within the grid
    s.fixedShapes.forEach(shape =>
        canvas.querySelector(`#${shape.id}`)?.remove()
    )

    // Render them back with correct blocks updated
    s.fixedShapes
        .forEach(shape => {
            // Only render a shape once
            if (canvas.querySelector(`#${shape.id}`)) return;

            // Wrap blocks within a group element
            const g = <SVGGraphicsElement>createSvgElement(canvas.namespaceURI, "g");
            g.setAttribute("id", `${shape.id}`);

            shape.blocks.forEach(
                ({ x, y, height, width }) => {
                    const e = createSvgElement(g.namespaceURI, "rect", {
                        height: `${height}`,
                        width: `${width}`,
                        x: `${x}`,
                        y: `${y}`,
                        style: `fill: ${shape.type.color}`
                    });
                    g.appendChild(e);
                }
            )
            canvas.appendChild(g);
        })
}

/**
 * Everything is render here. 
 * @param s Current state
 */
const render = (s: State): void => {
    canvasSetUp();
    renderStats(s);
    spawnObstacles(s);
    spawnShape(s);
    controlShape(s);
    score(s);
    levelUp(s);
    gameOver(s);
};

export { render }