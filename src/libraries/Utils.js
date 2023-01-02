let refs = {};

/** Throttle function */
export const throttle = (f, throttleTime = 100, id = '0') => {
    if (refs[id]) return;
    f()

    refs[id] = setTimeout(() => {    
        refs[id] = undefined;
    }, throttleTime);
}

/** Throttle function - with trailing edge function */
export const throttle2 = (f, throttleTime = 100, id = '0') => {
    refs[`${id}-trailing-edge`] = f;
    if (refs[id]) return;
    refs[`${id}-trailing-edge`] = undefined;

    f()

    refs[id] = setTimeout(() => {    
        refs[id] = undefined;
        if (refs[`${id}-trailing-edge`]) {
            refs[`${id}-trailing-edge`]();
            refs[`${id}-trailing-edge`] = undefined;
        }
    }, throttleTime);
}

/** Debouce function */
export const debounce = (f, debounceTime = 100, id = '0') => {
    if (!refs[id]) f();

    clearTimeout(refs[id]);
    refs[id] = setTimeout(() => {
        f();
    }, debounceTime);
};

/** 
 * Returns an array of all integers from start to end. (Python like functionality)
 * Ref: https://dev.to/ycmjason/how-to-create-range-in-javascript-539i
 * */
 export const range = (start, end) => {
    const length = Math.ceil(end - start);
    return Array.from({ length }, (_, i) => start + i);
};

/** Returns boolean for whether a value is a number */
export const isNumber = (value) => (
    (value != null) &&
    (value !== '') &&
    !isNaN(Number(value.toString())));

/** Returns boolean for whether a value is a string  */
export const isString = (x) => {
    return Object.prototype.toString.call(x) === "[object String]"
} 

/** Returns boolean for whether a value is a number or string  */
export const isNumberOrString = (value) => {
    return isNumber(value) || isString(value);
}

/**
 * Returns a number with commas. If number less than digit precision, 
 * uses scientific notation.
 * Ref: https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
 */
 export function toNumberWithCommas(x, digits = 2) {
    if(x === null) return;
    if(x === undefined) return;
    if(!isNumber(x)) return;
    if(x === 0) return 0;
    if(x > 1 * 10 ** -2) {
        return x.toFixed(digits).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    }
    else {
        return Number.parseFloat(x).toExponential(digits);
    }
}