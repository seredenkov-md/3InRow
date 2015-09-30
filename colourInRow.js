// todo smooth animation? !!!
function ColourInRow3() {
    this.field = [];
    this.calvingField = [];
    this.rowCount = null;
    this.colCount = null;
    this.colourCount = null;
    this.drawer = null;
    this.allocated = [];
    this.lines = [];
    this.score = 0;
    this.possibleStep = [];
    this.idGameElement = null;
}

ColourInRow3.prototype.init = function(idGameElement, rowCount, colCount, colourCount){
    var i, j;

    this.score = 0;
    this.rowCount = this.rowCount || rowCount || this.defaults.colCount;
    this.colCount = this.colCount || colCount || this.defaults.rowCount;
    this.idGameElement = this.idGameElement || idGameElement || this.defaults.idGameElement;

    if (colourCount >= 3 ) {
        this.colourCount = colourCount;
    } else {
        this.colourCount = this.defaults.colourCount;
    }

    // todo check drawer is ready? +/-
    this.drawer = new CanvasDrawer();
    this.drawer.init(this.idGameElement, this.rowCount, this.colCount, this.choiceElement.bind(this));
    if (!this.drawer.isReady) {
        return false;
    }

    for (i = 0; i < this.rowCount; i++) {
        this.field[i] = [];
        for (j = 0; j < this.colCount; j++) {
            this.field[i][j] = this.getRandomColour(this.colourCount);
        }
    }

    // если есть линии в полученном поле, тогда очищаем линии и заполняем
    while(this.findLine()) {
        this.clearLine();
        this.randomFill();
    }
    console.log('init game');
    this.drawer.addAnimation({
            name: 'update',
            field: this.field
    }); //todo
};

ColourInRow3.prototype.restartGame = function(){
    this.init();
};

ColourInRow3.prototype.defaults = {
    rowCount: 15,
    colCount: 15,
    colourCount: 2, // default and minimum value of colours
    idGameElement: 'game'
};

ColourInRow3.prototype.const = {
    lineSize: 3
};

ColourInRow3.prototype.choiceElement = function(el) { // todo
    console.log('choiceElement: ', el.i, el.j);
    // функция (callback для объекта this.drawer) должна получать позицию (строку, столбец) выбранного элмента,
    // и производить логику связанную с этим кликом.
    // после чего результат работы логики отрисовываем в this.drawer.updateDraw(this.field);

    if (!this.allocated.length) {
        // небыло выделенных элементов, выделяем текущий
        this.allocated[0] = el;
        console.log('1) выделен: ', el.i, el.j);
    } else {
        // имеется выбранный элемент
        if (this.allocated[0].i === el.i && this.allocated[0].j === el.j) {
            // клик был на уже выделенном элеменьте
            //снимаем выделение
            this.allocated = [];
            console.log('2) снято выделение: ', el.i, el.j);
        } else {
            // проверяем, является ли выбранный элемент соседним по отношению к выделенному ранее
            if (this.isNeighbors(el)) {
                // если выбран сосед, тогда производим перестановку и поиск 3х цветов в ряд
                console.log('3) выбран сосед: ', el.i, el.j);
                this.allocated[1] = el;
                // запоминаем айди цветов.
                this.allocated[0].id =  this.field[this.allocated[0].i][this.allocated[0].j] ;
                this.allocated[1].id =  this.field[this.allocated[1].i][this.allocated[1].j] ;
                console.log(el);
                // меняем цвета местами
                this.field[this.allocated[0].i][this.allocated[0].j] = this.allocated[1].id;
                this.field[this.allocated[1].i][this.allocated[1].j] = this.allocated[0].id;

                this.findLine(); // поиск цветов в ряд

                //  todo до этого момента хорошо бы добавить отрисовку выделений (и перестановок)

                if (this.lines.length) {
                    this.setAnimations();
                } else {
                    // если не найдено линий, тогда возвращаем цвета обратно
                    // todo добавить прорисовку перестановки, туда и обратно...
                    this.field[this.allocated[0].i][this.allocated[0].j] = this.allocated[0].id;
                    this.field[this.allocated[1].i][this.allocated[1].j] = this.allocated[1].id;
                    this.allocated = [];
                }
                this.allocated = []; // убираем выделение с ячеек
            } else {
                // выбранный элемент не соседний к выделенному
                // выбранный делаем делаем единственным выделенным
                this.allocated = [];
                this.allocated[0] = el;
                console.log('4) выделен: ', el.i, el.j);
            }
        }
    }
    //todo тут надо обновить только рамку на выделенных элементах, если такие имеются
    this.drawer.addAnimation({
        name: 'update',
        field: this._copyField(),
        allocated: this.allocated
    });

    //this.drawer.updateDraw('', this._copyField(), this.allocated, this.score);

};

ColourInRow3.prototype.setAnimations = function(){

    // эту функцию нужно будет передавать
    // в колбеке модулю анимации, для того, чтобы расчет анимации проходил поэтапно,

    if (this.findLine()) {
        // найдены линии, которые нужно сбосить.
        // тут нужно поэтапно изменять поле, и отрисовывать каждый этап.

        // 1) считаем очки
        this.addScore();
        this.drawer.setScore(this.score);   // обновление отображения счета, теоретически, можно переделать
                                            // в анимацию, происходящую в другой момент...
        // 2) сбрасываем линии,
        this.clearLine();
        this.drawer.addAnimation({
            name: 'fade',
            field: this._copyField()
        });
        // 3) обрушение клеток на освободившиеся позиции
        this.caving();
        this.drawer.addAnimation({
            name: 'calving',
            field: this._copyField(),
            offsetField: this._copyField(this.calvingField)
        });
        // 4) генерация случайных клеток в освободившейся верхней части
        this.randomFill();
        this.drawer.addAnimation({
            name: 'addition',
            field: this._copyField(),
            offsetField: this._copyField(this.calvingField)
        });
        this.drawer.addAnimation({
            name: 'callback',
            callback: this.setAnimations.bind(this)
        });
    }

    if (!this.findPossibleStep()) {
        // нет возможности продолжать игру!
        alert(this._strings.noSteps);
    }
};

ColourInRow3.prototype.clearLine = function() {
    // Убираем линии
    var i, j, n, k;
    for (n = 0; n < this.lines.length; n++) {
        for (k = 0; k < this.lines[n].length; k++) {
            i = this.lines[n][k].i;
            j = this.lines[n][k].j;
            this.field[i][j] = 0; // 0 - ячейка пустая, не имеет цвета
        }
    }
};

ColourInRow3.prototype.addScore = function() {
    var n;
    for (n = 0; n < this.lines.length; n++) {
        // для увеличения счета просто суммируем сброшенные ячейки... пока без усложнения.
        this.score += this.lines[n].length;
    }
    console.log(this.score);
};

ColourInRow3.prototype.caving = function(){
    // Опускаем клетки сверху на место освободившихся
    this.calvingField = [];  // поле содержащее число клеток, на которое должна обрушиться ячейка за время анимации
    var colCalving = [];    // массив хранящий сичло сдвигов для клеток в каждом из столбцов

    var i, j, row, n;

    for (i = 0; i < this.colCount; i++) colCalving[i] = 0;

    // заполнение массива с "шагом" обрушения для каждой клетки
    for (i = this.rowCount - 1; i >= 0; i--) {
        this.calvingField[i] = [];
        for(j = 0; j < this.colCount; j++) {
            this.calvingField[i][j] = 0;
            if (this.field[i][j] === 0) {
                colCalving[j]++;
            } else {
                // еслсли ячейка не пустая, то указуем число сдвигов для неё
                this.calvingField[i][j] = colCalving[j];
            }
        }
    }
    //console.log(calvingField);

    console.log('Caving');
    // в этом цикле происходит непосредственное изменение игрового поля - какое будет после обрушения
    for (i = this.rowCount - 1; i > 0; i--) {  // строка 0 не нужна, т.к. на неё нечего опускать
        for (j = 0; j < this.colCount; j++) {
            n = 0;  // число сдвигов одного столбца (не должно быть больше текущей строки)
                    // т.е. если весь столбцец пустой, то после i сдвигов перейдем к след. столбуц
            while (this.field[i][j] === 0 && n < i) {
                for (row = i; row > 0; row--) {
                    this.field[row][j] = this.field[row - 1][j];    // сдвиг столбца вниз
                }
                n++;
                this.field[0][j] = 0;
            }
        }
    }

};

ColourInRow3.prototype.findPossibleStep = function() {
    // если есть ход, позволяющий "сбросить линию", тога функцию вернет true
    // и в this.possibleStep будет массив содержащий
    // объекты с координатами ячеек для перестановок, а так же id цветов
    //

    // console.time('findPossibleStep');
    var i, j;
    var isExist = false;
    var neighbors = [];
    for (i = 0; i < this.rowCount && !isExist; i ++) {
        for (j = 0; j < this.colCount && !isExist; j++) {
            //  выполнение перестановок и проверка наличия хода
            if ((i + 1) < this.rowCount) {
                // если следующая строка в пределах поля, то выполняем перестановку по вертикали
                // перестановка
                neighbors[0] = this.field[i][j];
                neighbors[1] = this.field[i + 1][j];
                this.field[i][j] = neighbors[1];
                this.field[i + 1][j] = neighbors[0];
                if (this.findLine()) {
                    isExist = true;
                    this.possibleStep[0] = {i: i, j: j, id: neighbors[0]};
                    this.possibleStep[1] = {i: i + 1, j: j, id: neighbors[1]};
                }
                // обратная перестановка
                this.field[i][j] = neighbors[0];
                this.field[i + 1][j] = neighbors[1];
            }
            if (( j + 1) < this.colCount) {
                // если следуюий столбец в пределах поля, то выполняем перестановку по горизонтали
                // перестановка
                neighbors[0] = this.field[i][j];
                neighbors[1] = this.field[i][j + 1];
                this.field[i][j] = neighbors[1];
                this.field[i][j + 1] = neighbors[0];
                if (this.findLine()) {
                    isExist = true;
                    this.possibleStep[0] = {i: i, j: j, id: neighbors[0]};
                    this.possibleStep[1] = {i: i, j: j + 1, id: neighbors[1]};
                }
                // обратная перестановка
                this.field[i][j] = neighbors[0];
                this.field[i][j + 1] = neighbors[1];
            }
        }
    }
    //console.timeEnd('findPossibleStep');
    if (isExist) {
        console.log('possibleStep:');
        console.log(this.possibleStep);
        this.allocated = this.possibleStep;
        return true;
    } else {
        this.possibleStep = [];
        return false;
    }
};

ColourInRow3.prototype.randomFill = function(){
    // генерация случайных клеток в освободившейся верхней части
    var i, j;
    this.calvingField = [];
    var colCalving = [];    // массив хранящий сичло сдвигов для клеток в каждом из столбцов
    for (i = 0; i < this.colCount; i++) colCalving[i] = 0;
    for (i = this.rowCount - 1; i >= 0; i--) {
        this.calvingField[i] = [];
        for (j = 0; j < this.colCount; j++) {
            if (this.field[i][j] === 0) {
                this.field[i][j] = this.getRandomColour(this.colourCount);
                colCalving[j]--;
                this.calvingField[i][j] = colCalving[j];
            } else {
                this.calvingField[i][j] = 0
            }
        }
    }
    // в кажой ячейке указываем смещение за пределы начала оси
    for (i = 0; i < this.rowCount; i++) {
        for (j = 0; j < this.colCount; j++) {
            if (this.calvingField[i][j] !== 0) {
                this.calvingField[i][j] = colCalving[j];
            }
        }
    }
};

ColourInRow3.prototype.findLine = function() {
    // todo may be need refactor...
    this.lines = [];
    var row = [];
    var col = [];
    var nRow = 0, nCol = 0; // счетчики элементов для массивов
    var i, j;

    // производим поиск ряда цветов на поле
    for (i = 0; i < this.rowCount; i++) {
        for (j = 0; j < this.colCount; j++) {
            if (j === 0) {
                // (можно вынести перед циклом, и начинать цикл с 1 а не 0.. тогда на одно вложение if станет меньше..)
                // но тогда нельзя будет объеденить row и col (пока ещё объединение возможно...?)
                row = [];
                nRow = 0;
                row[nRow] = { i: i, j: j, id: this.field[i][j]};
            } else {
                // поиск ряда по строкам
                if (row[nRow].id === this.field[i][j]) {
                    nRow++;
                    row[nRow] = { i: i, j: j, id: this.field[i][j]};
                } else {
                    if (nRow >= this.const.lineSize - 1) {
                        // в массиве row линия одного цвета. Нужно сохранить копию массива.
                        // в режиме игры может быть до 2х линий, которые нужно будет "сбросить"
                        // потому их сохраняем для дальнейшей работы
                        //console.log('row:');
                        //console.log(row);
                        this.lines.push(row);
                    }
                    row = [];
                    nRow = 0;
                    row[nRow] = { i: i, j: j, id: this.field[i][j]};
                }
            }
        }
        // если строка закончилась линией из одного цвета
        if (nRow >= this.const.lineSize - 1) {
            //console.log('row:');
            //console.log(row);
            this.lines.push(row);
        }
    }

    // поиск ряда по столбцам
    // можно было бы произвести этот поиск в тех же 2х циклах, где искали строки, но тогда пришлось бы
    // создавать массив из массивов аналогичным col, для отслеживания цветов в столбцах.
    // потому, пока(?) вынесем определение столбцов цвета в отдельный блок кода
    for (j = 0; j < this.colCount; j++) {
        for (i = 0; i < this.rowCount; i++) {
            if (i === 0) {
                col = [];
                nCol = 0;
                col[nCol] = { i: i, j: j, id: this.field[i][j]};
            } else {
                // поиск ряда по столбцам
                if (col[nCol].id === this.field[i][j]) {
                    nCol++;
                    col[nCol] = { i: i, j: j, id: this.field[i][j]};
                } else {
                    if (nCol >= this.const.lineSize - 1) {
                        // в массиве col линия одного цвета. Нужно сохранить копию массива.
                        // в режиме игры может быть до 2х линий, которые нужно будет "сбросить"
                        // потому их сохраняем для дальнейшей работы
                        //console.log('col:');
                        //console.log(col);
                        this.lines.push(col);
                    }
                    col = [];
                    nCol = 0;
                    col[nCol] = { i: i, j: j, id: this.field[i][j]};
                }
            }
        }
        // если столбец закончился линией из одного цвета
        if (nCol >= this.const.lineSize - 1) {
            console.log('col:');
            console.log(col);
            this.lines.push(col);
        }
    }
    return this.lines.length > 0;
};

ColourInRow3.prototype.isNeighbors = function(el) {
    // определяем, является ли el соседним по отношению к this.allocated[0]
    return Math.abs(this.allocated[0].i - el.i) + Math.abs(this.allocated[0].j - el.j) === 1;
};

ColourInRow3.prototype.getRandomColour = function (max) {
    return Math.floor(Math.random() * (max)) + 1 ;
};

ColourInRow3.prototype._strings = {
    noSteps: 'There is no steps to continue the game'
};

ColourInRow3.prototype._copyField = function(samplefield) {
    var i, j, field = [];

    samplefield = samplefield || this.field;

    for (i = 0; i < this.rowCount; i++) {
        field[i] = [];
        for (j = 0; j < this.colCount; j++) {
            field[i][j] = samplefield[i][j];
            if (samplefield[i][j] === undefined) {
                console.log(i, j, samplefield[i][j]);
            }
        }
    }
    return field;
};


// fade: изменение цвета
// calving: обрушение ячеек сверху
// adding: падение сверху случайных клеток, для заполнения пустот.