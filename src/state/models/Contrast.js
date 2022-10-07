
class Contrast {

	constructor() {
		this.level = 2048.0;
		this.window = 4096.0;
		this.resolution = 4096;
	}

	getMin() {
		return this.level - this.window / 2.0;
	}

	getMax() {
		return this.level + this.window / 2.0;
	}

	setMin(min) { 
		var max = this.getMax();
		this.window = (max - min);
		this.level = min + (max - min) / 2.0;
	}

	setMax(max) { 
		var min = this.getMin();
		this.window = (max - min);
		this.level = min + (max - min) / 2.0;		
	}

	setContrastLevel(level) {
		this.level = level;
	}

	setContrastWidth(width) {
		this.window = width;
	}

    setContrast(level, width) {
		this.level = level;
		this.window = width;
	}

    setContrastWithMouse(event) {
		this.level += event.y;
		this.window += event.x;
	}

    /* Constrast based off max-min values */
	autoContrastMinMax(min, max) { 
		this.window = max - min;
		this.level = min + (this.window / 2);
	}

	/* Constrast based off pixel statistitics */
	autoContrastStats(mean, std) {
		var min = 0;
		var max = mean + 2.5 * std;
		this.window = max - min;
		this.level = min + (this.window / 2);
	}

	contrastLUT(value, useFractionalScale = false) {
		var window = this.window;
		var level = this.level;
		var min = level - window / 2.0;
		var output = (this.resolution / window) * (value - min);
		output = output < 0 ? 0 : output;
		output = output > this.resolution ? this.resolution : output;
        output = useFractionalScale ? output / this.resolution : output;
		return output;
	}
}

export default Contrast;