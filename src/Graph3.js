'use strict';

/*
NaturalTransformation.prototype.calculate = function (A) {
  this.eta = this.F.codom().morphism(F.objectImage(A), G.objectImage(A));
  this.univ = function (f) {
    assert(f.dom().equals(A));
    var eta = this.F.codom().morphism(F.objectImage(f.codom()), G.objectImage(f.codom()));
    assert(this.F.morphismImage(f).compose(eta).commutes(this.eta.compose(this.G.morphismImage(f))));
    return eta;
  };
};
*/
/*
function Category() {
}
*/

function InitialCategory() {
}

function TerminalCategory() {
}

// 0 -> 1
function IntervalCategory() {
  IntervalCategory.base.constructor.call(this);
}

extend(IntervalCategory, Category);

IntervalCategory.prototype.object = function (x) {
  assert(x === 0 || x === 1);
  return x;
};

IntervalCategory.prototype.initial = function () {
  return 1;
};

IntervalCategory.prototype.terminal = function () {
  return 0;
};

IntervalCategory.prototype.morphism = function (A, B) {
  assert(A === 1 && B === 0);
  return 0;
};

// Diagram (Functor)
function Span() {
  this.A = cat.object();
  this.B = cat.object();
  this.AB = cat.object();
  this.f = cat.morphism(this.AB, this.A);
  this.g = cat.morphism(this.AB, this.B);
}

/////////////////////////////////////////////////////////////////////////////
// FreeQuiver

function FreeQuiver() {
  FreeQuiver.base.constructor.call(this, ['V','E'], [['s','E','V'],['t','E','V']]);
}

extend(FreeQuiver, IndexCategory);

/////////////////////////////////////////////////////////////////////////////
// Quiver

function Quiver(vertices, edges, source, target) {
  var V = new Set(vertices);
  var E = new Set(edges);
  var s = new TotalFunction(E, V, source);
  var t = new TotalFunction(E, V, target);
  var mapObject = [['V',V],['E',E]];
  var mapMorphism = [['s','E','V',s],['t','E','V',t]];
  Quiver.base.constructor.call(this, new FreeQuiver(), new SetCategory(), mapObject, mapMorphism);
}

extend(Quiver, Diagram);

//var q = new Quiver([1,2,3], ['a','b'], [['a',1],['b',2]], [['a',2],['b',3]]);

/////////////////////////////////////////////////////////////////////////////
// FunctorCategory

function FunctorCategory(C, D) {
  FunctorCategory.base.constructor.call(this);

  this._source = function () { return C; }
  this._target = function () { return D; }
}

extend(FunctorCategory, Category);

/////////////////////////////////////////////////////////////////////////////
// Quiv

// Functor category of Quiver(cat)
function Quiv() {
  var freeQuiver = new FreeQuiver();
  var setCat = new SetCategory();
  Quiv.base.constructor.call(this, freeQuiver, setCat);
}

extend(Quiv, FunctorCategory);
/*
Quiv.prototype.object = function () {
  return new Quiver(this._target);
};

Quiv.prototype.morphism = function (A, B) {
  return new NaturalTransformation(A, B);
};
*/
var intervalCat = new IntervalCategory();

var setCat = new SetCategory();
var graphCat = new Quiv(setCat);

var graphA = new Quiver([1,2], [1], [[1,1]], [[1,2]]);
console.log(graphA);

var graphB = new Quiver([1,2,3,4], [1,2,3,4,5], [[1,1],[2,2],[3,3],[4,1],[5,3]], [[1,2],[2,4],[3,4],[4,3],[5,1]]);
console.log(graphB);

var fNodeMap = setCat.morphism(graphA.mapObject('V'), graphB.mapObject('V'), {1: 1, 2: 2});
var fEdgeMap = setCat.morphism(graphA.mapObject('E'), graphB.mapObject('E'), {1: 1});
var f = new NaturalTransformation(graphA, graphB, [['V',fNodeMap],['E',fEdgeMap]]);

//var f = graphCat.morphism(graphA, graphB);
//f.mapObject(0, fEdgeMap);
//f.mapObject(1, fNodeMap);

console.log(f);
