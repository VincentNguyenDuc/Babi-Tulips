import "./style.css";

import { scan } from "rxjs/operators";
import { State } from "./types";
import { action$ } from "./observables";
import { INITIAL_STATE, reduceState } from "./states";
import { render } from "./views"

/**
 * This is the function called on page load. 
 * The main game loop is called here 
 */
export function main() {
	action$
		.pipe(
			scan(reduceState, INITIAL_STATE)
		)
		.subscribe((s: State) => {
			render(s);
		});
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
	window.onload = () => {
		main();
	};
}