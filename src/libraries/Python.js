
const runtime = { isInit: false, pyodide: undefined }

const getFile = async (filepath) => {
    const file = await fetch(filepath)
    return file.text()
  }

export const runTest = async () => {

    if(!runtime.isInit) {
        // eslint-disable-next-line no-undef
        runtime.pyodide = await loadPyodide();
    }

    const pyodideRuntime = runtime.pyodide;
    await pyodideRuntime.loadPackage("numpy");

    const code = await getFile('test.py');
    pyodideRuntime.runPython(code); 
    
    // Access and call it in JavaScript
    let mult = pyodideRuntime.globals.get('multiplyTwoNumbers');
    console.log("Multiplying 2 and 3 in Python: " + mult(2,3));
    console.log("You're welcome, " + pyodideRuntime.globals.get('name'))

    var test = pyodideRuntime.globals.get('createData');
    var value = test().toJs()
    console.log("Test: " + value)
    return value;
}

export const run = async () => {

    const filepath = 'phantom.py'

    if(!runtime.isInit) {
        // eslint-disable-next-line no-undef
        runtime.pyodide = await loadPyodide();

        await runtime.pyodide.loadPackage("numpy");

        const code = await getFile(filepath);
        runtime.pyodide.runPython(code); 
    }
    
    return runtime.pyodide
}

export const run2 = async () => {

    const filepath = 'phantom.py'

    if(!runtime.isInit) {
        // eslint-disable-next-line no-undef
        runtime.pyodide = await loadPyodide();

        await runtime.pyodide.loadPackage("numpy");
        await runtime.pyodide.loadPackage("micropip");
        const micropip = runtime.pyodide.pyimport("micropip");
        await micropip.install('h5py');

        const code = await getFile(filepath);
        runtime.pyodide.runPython(code); 
    }
    
    return runtime.pyodide
}

export const phantom_generator = async (size, sizeY, coil) => {
    const pyodideRuntime = await run();
    //const  fn = pyodideRuntime.globals.get('phantom_generator');
    //const data = fn().toJs()
    //return data

    var fn = pyodideRuntime.globals.get('createData');
    var value = fn(size, sizeY, coil).toJs();
    return value;
    //console.log("Test: " + value)
}