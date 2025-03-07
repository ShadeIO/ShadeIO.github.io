import "./styles.css";
class PolygonApp extends HTMLElement {
    constructor() {
        super();
        this.savedPoints = null;
        this.points = [];
        this.addingPoints = false;
        this.selectingFirst = false;
        this.selectingSecond = false;
        this.firstPoint = null;
        this.secondPoint = null;
        this.clockwise = true;
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
        body {
            font-family: Arial, sans-serif;
            background: #333;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        .container {
            display: flex;
            align-items: flex-start;
        }

        canvas {
            border: 2px solid black;
            background: #777;
        }

        controls {
            background: #444;
            padding: 15px;
            border-radius: 10px;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            width: 320px;
            text-align: center;
            margin-left: 30px;
        }

        p, h3 {
            font-weight: bold;
            text-align: center;
            white-space: normal;
            max-width: 200px;
        }

        .controls button {
            margin-bottom: 10px;
            width: 200px;
            max-width: 200px;
            height: 50px;
            text-align: center;
            padding: 10px;
            border-radius: 5px;
            background: #666;
            color: white;
            border: none;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            justify-content: center;
            align-items: center;
        }

            .controls button:disabled {
                background: #444;
                cursor: not-allowed;
            }

            `;
        shadow.innerHTML = `
            <div class="controls" >
                <h3>Create Polygon</h3>
                <button id="createPoints">Create Points</button>
                <p id="pointsStatus" class="status">No points created</p>
                <button id="drawPolygon" disabled>Draw Polygon</button>
                <h3>Create Path</h3>
                <button id="firstPoint" disabled>First Point</button>
                <p id="firstPointLabel">None</p>
                <button id="secondPoint" disabled>Second Point</button>
                <p id="secondPointLabel">None</p>
                <button id="toggleDirection" disabled>Clockwise</button>
                <button id="clear" disabled>Clear</button>
                <button id="clearStorage">Clear Storage</button>
                <p id="pathOutput">Path: None</p>
            </div >`
        shadow.prepend(style);
        this.setupCanvas();
    }

    setupCanvas() {
        const canvas = document.getElementById("polygonCanvas");
        const ctx = canvas.getContext("2d");
        const createBtn = this.shadowRoot.getElementById("createPoints");
        const drawBtn = this.shadowRoot.getElementById("drawPolygon");
        const firstBtn = this.shadowRoot.getElementById("firstPoint");
        const secondBtn = this.shadowRoot.getElementById("secondPoint");
        const directionBtn = this.shadowRoot.getElementById("toggleDirection");
        const clearBtn = this.shadowRoot.getElementById("clear");
        const clearStrgBtn = this.shadowRoot.getElementById("clearStorage");
        const status = this.shadowRoot.getElementById("pointsStatus");
        const firstPointText = this.shadowRoot.getElementById("firstPointLabel");
        const secondPointText = this.shadowRoot.getElementById("secondPointLabel")
        const pathDisplay = this.shadowRoot.getElementById("pathOutput");

        document.addEventListener('DOMContentLoaded', () => {
            this.loadPolygonFromLocalStorage(ctx);
        });

        canvas.addEventListener("click", (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (this.addingPoints) {
                this.points.push({ x, y });
                this.drawPoint(x, y, `p${this.points.length}`, ctx);
                this.updateStatus();
            } else if (this.selectingFirst || this.selectingSecond) {
                let clickedPoint = this.findClosestPoint(x, y);
                if (clickedPoint) {
                    if (this.selectingFirst) {
                        this.firstPoint = clickedPoint;
                        firstPointText.textContent = `p${this.points.indexOf(clickedPoint) + 1}`;
                    } else if (this.selectingSecond) {
                        this.secondPoint = clickedPoint;
                        secondPointText.textContent = `p${this.points.indexOf(clickedPoint) + 1}`;
                    }
                    this.selectingFirst = false;
                    this.selectingSecond = false;
                    if (this.firstPoint && this.secondPoint) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        this.highlightPath(ctx);
                    }
                }
            }
        });

        createBtn.addEventListener("click", () => {
            this.addingPoints = true;
            this.points = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            status.style.color = "white";
            status.textContent = "Click to add points";
            clearBtn.disabled = false;
            createBtn.disabled = true;
        });

        drawBtn.addEventListener("click", () => {
            this.drawGraph(ctx);
            firstBtn.disabled = false;
            secondBtn.disabled = false;
            directionBtn.disabled = false;
            drawBtn.disabled = true;
        });

        firstBtn.addEventListener("click", () => {
            this.selectingFirst = true;
        });

        secondBtn.addEventListener("click", () => {
            this.selectingSecond = true;
        });

        clearBtn.addEventListener("click", () => {
            this.points = [];
            this.addingPoints = false;
            this.selectingFirst = false;
            this.selectingSecond = false;
            this.firstPoint = null;
            this.secondPoint = null;
            this.clockwise = true;
            createBtn.disabled = false;
            drawBtn.disabled = true;
            firstBtn.disabled = true;
            secondBtn.disabled = true;
            clearBtn.disabled = true;
            directionBtn.disabled = true;
            firstPointText.textContent = `None`;
            secondPointText.textContent = `None`;
            directionBtn.textContent = "Clockwise";
            pathDisplay.textContent = "Path: None";
            if (this.savedPoints == null) {
                clearStrgBtn.disabled = true;
            }
            status.textContent = "No points created";
            status.style.color = "white";
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        directionBtn.addEventListener("click", () => {
            this.clockwise = !this.clockwise;
            directionBtn.textContent = this.clockwise ? "Clockwise" : "Counterclockwise";
            if (this.firstPoint && this.secondPoint) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.highlightPath(ctx);
            }
        });

        clearStrgBtn.addEventListener('click', () => {
            this.savedPoints = null;
            localStorage.removeItem('polygonPoints');
            pathDisplay.textContent = `Storage cleared!`;
            clearStrgBtn.disabled = true;
            //points = [];
            //ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    loadPolygonFromLocalStorage(ctx) {
        this.savedPoints = localStorage.getItem('polygonPoints');
        if (this.savedPoints) {
            this.points = JSON.parse(this.savedPoints);
            for (let i = 0; i < this.points.length; i++) {
                this.drawPoint(this.points[i].x, this.points[i].y, `p${i + 1}`, ctx);
            }
            this.drawGraph(ctx); // Перерисовываем загруженный полигон
            this.updateStatus();
            this.shadowRoot.getElementById("firstPoint").disabled = false;
            this.shadowRoot.getElementById("secondPoint").disabled = false;
            this.shadowRoot.getElementById("toggleDirection").disabled = false;
            this.shadowRoot.getElementById("clear").disabled = false;
            this.shadowRoot.getElementById("createPoints").disabled = true;
            this.shadowRoot.getElementById("drawPolygon").disabled = true;
            this.shadowRoot.getElementById("clearStorage").disabled = false;
        } else this.shadowRoot.getElementById("clearStorage").disabled = true;
    }

    savePolygonToLocalStorage() {
        localStorage.setItem('polygonPoints', JSON.stringify(this.points));
        this.shadowRoot.getElementById("clearStorage").disabled = false;
    }

    drawPoint(x, y, label, ctx) {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.fillText(label, x + 5, y - 5);
    }

    updateStatus() {
        const status = this.shadowRoot.getElementById("pointsStatus");
        status.textContent = `Created ${this.points.length} points`;
        status.style.color = this.points.length >= 3 && this.points.length <= 15 ? "green" : "red";
        this.shadowRoot.getElementById("drawPolygon").disabled = this.points.length < 3 || this.points.length > 15;
    }

    drawGraph(ctx) {
        if (this.points.length < 3) return;
        this.addingPoints = false;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        this.savePolygonToLocalStorage();
    }

    findClosestPoint(x, y) {
        return this.points.find(p => Math.hypot(p.x - x, p.y - y) < 10);
    }

    highlightPath(ctx) {
        if (!this.firstPoint || !this.secondPoint) return;
        this.clearPath(ctx);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.firstPoint.x, this.firstPoint.y);
        let path = [];
        let startIndex = this.points.indexOf(this.firstPoint);
        let endIndex = this.points.indexOf(this.secondPoint);
        let i = startIndex;
        while (true) {
            path.push(`p${i + 1}`);
            ctx.lineTo(this.points[i].x, this.points[i].y);
            if (i === endIndex) break;
            i = this.clockwise ? (i + 1) % this.points.length : (i - 1 + this.points.length) % this.points.length;
        }
        ctx.stroke();
        this.shadowRoot.getElementById("pathOutput").textContent = `Path: ${path.join(" - ")}`;
    }

    clearPath(ctx) {
        for (let i = 0; i < this.points.length; i++) {
            this.drawPoint(this.points[i].x, this.points[i].y, `p${i + 1}`, ctx);
        }
        this.drawGraph(ctx);
    }
}
if (!customElements.get('polygon-app')) {
    customElements.define('polygon-app', PolygonApp);
}
