function  CanvasDrawer()  {
    this.rowCount = null;
    this.colCount = null;
    this.scoreEl = null;
    this.canvas = null;
    this.ctx = null;
    this.isReady = null;

    this.data = null;

    this.isReadyForClick = null;
    this.lastField = null;
}

CanvasDrawer.prototype.init = function(idGameElement, rowCount, colCount, callback) {

    this.isReady = true;
    // todo check callback is a function
    if (typeof callback === "function") {
        this.callback = callback; // callback function for clickHandler
    } else {
        this.isReady = false;
    }

    this.scoreEl = document.createElement('div');

    this.canvas = document.createElement('canvas');
    this.canvas.width = colCount * this.const.size;
    this.canvas.height =  rowCount * this.const.size;

    this.rowCount = rowCount;
    this.colCount = colCount;

    this.ctx = this.canvas.getContext('2d');
    var el = document.getElementById(idGameElement);
    this.isReady = el? true : false;

    this.data = [];

    el.innerHTML = '';
    el.appendChild(this.scoreEl);
    el.appendChild(this.canvas);

    this.setScore(0);

    this.canvas.addEventListener('click', this.leftClickHandler.bind(this));
    this.canvas.addEventListener('contextmenu', function(event){ event.preventDefault(); });

    this.painters.addition = this.redrawAddition.bind(this);
    this.painters.calving = this.redrawCalving.bind(this);
    this.painters.update = this.redrawUpdate.bind(this);
    this.painters.fade = this.redrawFade.bind(this);

    this.isReadyForClick = true;
    this.animate();
};

CanvasDrawer.prototype.setScore = function(score) {
    this.scoreEl.innerHTML = 'SCORE: ' + score;
};

CanvasDrawer.prototype.leftClickHandler = function(event) {
    // оределяет строку и столбец выбранного элемента
    // вызвает this.callback({row, col}) для выполнения логики обработки клика
    var x, y; // координаты клика в canvas
    var i, j; // строка и стобец выбранного элемента

    if (!this.isReadyForClick) {
        return;
    }

    x = event.pageX - (this.canvas.clientLeft +  this.canvas.offsetLeft);
    y = event.pageY - (this.canvas.clientTop + this.canvas.offsetTop);
    i = Math.floor(y / this.const.size);
    j = Math.floor(x / this.const.size);

    if (i >= 0 && j >= 0 && i < this.rowCount && j < this.colCount) {
        console.log('leftClickHandler:', i, j);
        this.callback({i: i, j: j});
    }
};

CanvasDrawer.prototype.const = {
    size: 40,
    allocatedColour: '#222',
    allocatedLineWidth: 2,
    animation: {
        fade: 600,
        speed: 2       // скорость падения клетки = число клеток в секунду
    }
};

CanvasDrawer.prototype.colors = [
    '#333333', // нулевая позиция цвета означает пустую ячейку
    '#5c57b3',
    '#cf2435',
    '#56b4aa',
    '#f6b220',
    '#95be22',
    '#e88472',
    '#924e7d',
    '#779933',
    '#e0ceed'
];


CanvasDrawer.prototype.addAnimation = function(obj) {
//    console.log(obj.name);
//    console.log(obj);
    obj.dStart = new Date();
    this.data.push(obj);
    this.isReadyForClick = false;
    // сохраняем переданные данные для анимаций, выполняем их последовательно
    // длительность каждой анимации выбирается в зависимости от её типа(name)
    // fade огранича по времени, у других скорость движения определяет продолжительность анимации.

    // функция получает объекты содержащие название типа анимации
    // и данные для осуществления самой анимации
};

CanvasDrawer.prototype.animate = function() {
    //this.requestId = window.requestAnimationFrame(this.animate.bind(this));
    window.requestAnimationFrame(this.animate.bind(this));

    var dNow = new Date();
    if (this.data.length > 0) {
        this.interval = dNow - this.data[0].dStart;
    }

    if (this.data.length > 0) {
        // выполняем отрисовки, пока в массиве this.data остались объекты анимации
        if (this.data[0].name === 'callback') {
            // текущий объект анимации означает вызов колбека из модуля игры, для расчета
            // логики следующих анимаций, если они понадобятся
            this.data[0].callback();
            this.data.shift();
        } else {
            // в зависимости от типа анимации выбираем процедуру для отрисовки фрейма,
            // а так же условия окончания аниамции, и удаление её из очереди.
            if (this.painters[this.data[0].name](this.data[0])) {
                // процедура анимации вернет true, когда она будет окончена
                // после чего эту анимации нужно убрать из массива
                this.lastField = this.data[0].field;
                this.data.shift();
                if (this.data.length > 0) {
                    this.data[0].dStart = new Date(); // обновляем стартовое время для следующей анимации
                }
            }
        }
    }

    if (this.data.length === 0) {
        this.isReadyForClick = true;
    }
};

CanvasDrawer.prototype.painters = {
    calving: null,
    addition: null,
    update: null,
    fade: null
};


CanvasDrawer.prototype.redrawCalving = function(obj) {
//    console.log('redrawCalving');
//    console.log(obj);

    var isFinished = true;
    var i, j;
    var rowCount, colCount, color;
    var size = this.const.size;
    var field = this.lastField;     // переделать эту анимацию - в неё не нужно передавать текущий field
                                    // т.к. для отрисовки используется последний field и смещения
    var calvingField = obj.offsetField;
    var speedPX = this.const.animation.speed * this.const.size; // скорость падения в пикселах за секунду
    var dY = 0;
    var dYpx = Math.floor(speedPX * (this.interval / 1000));

    rowCount = Array.isArray(field) && field.length;
    colCount = Array.isArray(field[0]) && field[0].length;

    this.ctx.fillStyle = this.colors[0];
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.clientHeight);

    for (i = rowCount - 1; i >= 0 ; i-- ) {
        for (j = 0; j < colCount; j++) {
            dY = 0;
            if (calvingField[i][j] > 0) {
                // обрушение имеющихся клеток
                dY = dYpx; //|| (calvingField[i][j]) * part * this.const.size;
                if ( dY <= (calvingField[i][j] * this.const.size)) {
                    // в одной из ячеек не достигнут предел анимации
                    isFinished = false;
                } else {
                    field[i + calvingField[i][j]][j] = field[i][j];
                    field[i][j] = 0; // упавшая ячейка теперь не нужна (стала пустой)
                    calvingField[i][j] = 0; // смещение для текущей клетки больше не нужно
                    // тут возникает мирцание из-за ....?
                }
            }
            color = this.colors[field[i][j]];
            this.ctx.fillStyle = color;
            this.ctx.fillRect(j * size, i * size + dY, size, size);
        }
    }
    return isFinished; // эта анимация должна завершатсья по достижению конечного положения всеми клетками
};

CanvasDrawer.prototype.redrawAddition = function(obj) {
//    console.log('redrawAddition');
//    console.log(obj);

    var isFinished = true;
    var i, j;
    var rowCount, colCount, color;
    var size = this.const.size;

    var field = obj.field;
    var calvingField = obj.offsetField;

    var speedPX = this.const.animation.speed * this.const.size; // скорость падения в пикселах за секунду
    var dY = 0;
    var dYpx = Math.floor(speedPX * (this.interval / 1000));

    //field = this.lastField;  // переделать эту анимацию - в неё не нужно передавать текущий field
    rowCount = Array.isArray(field) && field.length;
    colCount = Array.isArray(field[0]) && field[0].length;

    this.ctx.fillStyle = this.colors[0];
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.clientHeight);

    for (i = rowCount - 1; i >= 0 ; i-- ) {
        for (j = 0; j < colCount; j++) {
            dY = 0;
            if (calvingField[i][j] > 0) {
                // обрушение имеющихся клеток
                dY = dYpx; //|| (calvingField[i][j]) * part * this.const.size;
                if ( dY <= (calvingField[i][j] * this.const.size)) {
                    // не достигнут предел анимации
                    isFinished = false;
                    //console.log('isFinished: ', isFinished, dY , calvingField[i][j] * this.const.size)
                } else {

                    field[i + calvingField[i][j]][j] = field[i][j];
                    field[i][j] = 0; // упавшая ячейка теперь не нужна.
                    calvingField[i][j] = 0;
                }
            } else if (calvingField[i][j] < 0) {
                 // обрушение сгенерированных сверху клеток
                 // (calvingField[i][j]) * (1 - part) this.const.size
                 dY = dYpx + (calvingField[i][j]) * this.const.size;
                 if ( dY <= 0) {
                     // не достигнут предел анимации
                     isFinished = false;
                 } else {
                     calvingField[i][j] = 0;
                 }
             }
            color = this.colors[field[i][j]];
            this.ctx.fillStyle = color;
            this.ctx.fillRect(j * size, i * size + dY, size, size);
        }
    }
    return isFinished; // эта анимация должна завершатсья по достижению конечного положения всеми клетками
};

CanvasDrawer.prototype.redrawUpdate = function(obj) {
//    console.log('redrawUpdate');
//    console.log(obj);
    var isFinished = true;
    var i, j, k, n;
    var rowCount, colCount, color;
    var size = this.const.size;
    var d = this.const.allocatedLineWidth; // толщина линии выделения
    var field = obj.field;

    rowCount = Array.isArray(field) && field.length;
    colCount = Array.isArray(field[0]) && field[0].length;

    this.ctx.fillStyle = this.colors[0];
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.clientHeight);

    for (i = rowCount - 1; i >= 0 ; i-- ) {
        for (j = 0; j < colCount; j++) {
            if (field[i][j].toString().length < 2) {
                color = this.colors[field[i][j]];
            } else {
                color = field[i][j];
            }
            this.ctx.fillStyle = color;
            this.ctx.fillRect(j * size, i * size, size, size);
        }
    }

    k = obj.allocated && obj.allocated.length || 0;
    for (n=0; n < k; n++ ) {
        i = obj.allocated[n].i;
        j = obj.allocated[n].j;
        this.ctx.beginPath();
        this.ctx.moveTo(j * size + d , i * size + d);

        // рисуем выделение ячейки - линия контуру выделенного квадрата
        // d - смещение (в 'px') внутрь квадрата
        this.ctx.lineTo(j * size + d, (i + 1) * size - d);
        this.ctx.lineTo((j + 1) * size - d, (i + 1) * size - d);
        this.ctx.lineTo((j + 1) * size - d, i * size + d);
        this.ctx.lineTo(j * size + d, i * size + d);

        this.ctx.lineWidth = this.const.allocatedLineWidth;
        this.ctx.strokeStyle = this.const.allocatedColour;
        this.ctx.lineCap = 'square';
        this.ctx.stroke()
    }
    return isFinished;
};

CanvasDrawer.prototype.redrawFade = function(obj) {

    var i, j;
    var rowCount, colCount, colour;
    var colourInitial, colourFinal;

    var size = this.const.size;
    var field = obj.field;
    var part = this.interval / this.const.animation.fade;


    rowCount = Array.isArray(field) && field.length;
    colCount = Array.isArray(field[0]) && field[0].length;

    this.ctx.fillStyle = this.colors[0];
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.clientHeight);

    for (i = rowCount - 1; i >= 0 ; i-- ) {
        for (j = 0; j < colCount; j++) {

            colour = this.colors[field[i][j]];
            if (this.lastField[i][j] !== field[i][j]){
                colourInitial = this.colors[this.lastField[i][j]];
                colourFinal = this.colors[field[i][j]];
                // расчитываем цвет изменяемого квадрата для текущего фрейма
                colour = this.frameColour( colourInitial, colourFinal, part);
            }
            this.ctx.fillStyle = colour;
            this.ctx.fillRect(j * size, i * size, size, size);
        }
    }
    return (this.interval >= this.const.animation.fade);
};

// ===== функции для расчета изменения цвета ====
CanvasDrawer.prototype.frameColour =  function(initialColourHEX, finalColourHEX, part) {
    var k;
    var initialColourRGB = this._getRGBColour(initialColourHEX);
    var finalColourRGB = this._getRGBColour(finalColourHEX);
    var deltaColour = [];
    for (k = 0; k < 3 ; k++) {
        deltaColour[k] = initialColourRGB[k] + Math.floor((finalColourRGB[k]  - initialColourRGB[k]) * part);

    }
    return this._getHEXColour(deltaColour);
};

CanvasDrawer.prototype._getRGBColour = function(colourHEX) {
    var colourRGB, n, expr;
    n = colourHEX.length < 6 ? 1 : 2;
    expr = new RegExp('\\w{' + n +  '}', 'g');
    colourRGB = colourHEX.match(expr);
    if (n === 1) {
        colourRGB = colourRGB.map(function(e){return '' + e + e});
    }
    colourRGB = colourRGB.map(function(e){return parseInt(e, 16)});
    return colourRGB;
};

CanvasDrawer.prototype._getHEXColour = function(colourRGB) {
    return '#' + colourRGB[0].toString(16) + colourRGB[1].toString(16) + colourRGB[2].toString(16);
};

CanvasDrawer.prototype._getHEXColour = function(colourRGB) {
    return '#' + colourRGB[0].toString(16) + colourRGB[1].toString(16) + colourRGB[2].toString(16);
};