
export const formatNumber = (x) => {
    if (x === undefined || x === null) return;

    if (x === 0)
        return 0;
    if (x > 10000 || x < 0.0001)
        return x.toExponential(2)
    if (x % 1 === 0)
        return x;
    else
        return x.toFixed(2)    
}