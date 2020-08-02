function VectorScope(audio) {
	this.buffersize = 512;
	this.xp = null;
	this.yp = null;
	this.theme = {
		dotSize: 0,
		dotStrokeWidth: 0,
		dotStrokeColor: null,
		dotFillColor: null,
		lineThickness: 1,
		lineCap: 'round',
		lineColor: '#FFF'
	};
}

VectorScope.prototype.clear = function () {
	var width = this.canvas.width;
	var height = this.canvas.height;
	this.context.clearRect(0, 0, width, height);
};

VectorScope.prototype.processChannels = function (left, right, canvas) {
	if (!left || !right) return;
	
	this.context = canvas.getContext('2d');
	var me = this;
	
	var inL = left;
	var inR = right;
	
	var width = canvas.width;
	var height = canvas.height;
	
	this.context.clearRect(0, 0, width, height);
	
	for (var iBuffer = 0; iBuffer < me.buffersize; iBuffer++) {
		if (this.xp !== null && this.yp !== null) {
			
			var x = (inL[iBuffer] + 1.0) * 0.5 * width;
			var y = (1.0 - inR[iBuffer]) * 0.5 * height;
			
			if (this.theme.dotSize) {
				this.context.globalAlpha = this.theme.dotAlpha;
				this.context.lineCap = this.theme.lineCap;
				if (this.theme.dotFillColor) this.context.fillStyle = this.theme.dotFillColor;
				if (this.theme.dotStrokeWidth) this.context.lineWidth = this.theme.dotStrokeWidth;
				if (this.theme.dotStrokeColor) this.context.strokeStyle = this.theme.dotStrokeColor;
				this.context.beginPath();
				if (this.theme.dotStrokeWidth) {
					this.context.arc(x, y, (this.theme.dotSize + this.theme.dotStrokeWidth) * 0.5, 0.0, 2.0 * Math.PI, false);
					// this.context.stroke();
					this.context.fill();
				}
				this.context.arc(x, y, this.theme.dotSize * 0.5, 0.0, 2.0 * Math.PI, false);
				if (this.theme.dotFillColor) {
					this.context.fill();
				}
			}
			
			if (this.theme.lineThickness) {
				if ('lineAlpha' in this.theme) this.context.globalAlpha = this.theme.lineAlpha;
				this.context.strokeStyle = this.theme.lineColor;
				this.context.lineCap = this.theme.lineCap;
				this.context.lineWidth = this.theme.lineThickness;
				this.context.beginPath();
				this.context.moveTo(x, y);
				this.context.lineTo(me.xp, me.yp);
				this.context.stroke();
			}
		}
		
		this.xp = x;
		this.yp = y;
	}
	
};

module.exports = VectorScope;
