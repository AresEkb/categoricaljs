'use strict';

/////////////////////////////////////////////////////////////////////////////
// IndexCategory
/*
function IndexCategory(objects, morphisms) {
  _objects = new Set(objects);
  _morphisms = morphisms;
}

extend(IndexCategory, Category);

IndexCategory.prototype.object = function (name) {
  return _objects.contains(name) ? name : throw 'Index Category doesn\'t contain object ' + name;
};

IndexCategory.prototype.morphism = function (A, B, mapping) {
  return new TotalFunction(A, B, mapping);
};

IndexCategory.prototype.id = function (A) {
  return this.morphism(A, A).initId();
};

IndexCategory.prototype.compose = function (g, f) {
  return g.compose(f);
};

new IndexCategory(['A','B','C'],{'m': ['A','B'], 'f': ['C','A'], 'g': ['C','A']});
*/

/////////////////////////////////////////////////////////////////////////////
// CommaCategoryLeftProjectionFunctor

function CommaCategoryLeftProjectionFunctor(C, D) {
  CommaCategoryLeftProjectionFunctor.base.constructor.call(this, C, D);
}

extend(CommaCategoryLeftProjectionFunctor, Functor);

CommaCategoryLeftProjectionFunctor.prototype.mapObject = function (A) {
  return this.dom().leftObj(A);
};

CommaCategoryLeftProjectionFunctor.prototype.mapMorphism = function (f) {
  return this.dom().leftArr(f);
};

/////////////////////////////////////////////////////////////////////////////
// CommaCategoryRightProjectionFunctor

function CommaCategoryRightProjectionFunctor(C, D) {
  CommaCategoryRightProjectionFunctor.base.constructor.call(this, C, D);
}

extend(CommaCategoryRightProjectionFunctor, Functor);

CommaCategoryRightProjectionFunctor.prototype.mapObject = function (A) {
  return this.dom().rightObj(A);
};

CommaCategoryRightProjectionFunctor.prototype.mapMorphism = function (f) {
  return this.dom().rightArr(f);
};

/////////////////////////////////////////////////////////////////////////////
// CommaCategory

function CommaCategory(S, T, leftObjName, rightObjName, mappingName, leftArrName, rightArrName) {
  this.leftFunctor = function () { return S; };
  this.rightFunctor = function () { return T; };

  // assert(S.codom().equals(T.codom()));
  if (isUndefined(leftObjName)) leftObjName = 'left';
  if (isUndefined(rightObjName)) rightObjName = 'right';
  if (isUndefined(mappingName)) mappingName = 'morphism';

  this.object = function (A, B, f) {
    return new CommaCategoryObject(this, A, B, f, leftObjName, rightObjName, mappingName);
    // obj[leftObjName] = A;
    // obj[rightObjName] = B;
    // obj[mappingName] = S.codom().morphism(S.mapObject(A), T.mapObject(B));
    // return obj;
  };

  this.leftProjectionFunctor = new CommaCategoryLeftProjectionFunctor(this, S.dom());
  this.rightProjectionFunctor = new CommaCategoryRightProjectionFunctor(this, S.dom());

  this.leftObj = function (A) {
    return A[leftObjName];
  };

  this.rightObj = function (A) {
    return A[rightObjName];
  };

  this.mapping = function (A) {
    return A[mappingName];
  };

  this.morphism = function (A, B, f, g) {
    assertCommutes(this.mapping(B).compose(S.mapMorphism(f)), T.mapMorphism(g).compose(this.mapping(A)));
    var morphism = {};
    morphism[leftArrName] = f;
    morphism[rightArrName] = g;
    morphism.toString = function () { return '(f: ' + f + ', g: ' + g + ')' };
    return morphism;
  };

  this.leftArr = function (f) {
    return f[leftArrName];
  };

  this.rightArr = function (f) {
    return f[rightArrName];
  };

  //this.leftProjection
}

function CommaCategoryObject(cat, A, B, f, leftObjName, rightObjName, mappingName) {
  assertEqualObjects(f.dom(), cat.leftFunctor().mapObject(A));
  assertEqualObjects(f.codom(), cat.rightFunctor().mapObject(B));

  this._leftObjName = !isUndefined(leftObjName) ? leftObjName : 'left';
  this._rightObjName = !isUndefined(rightObjName) ? rightObjName : 'right';
  this._mappingName = !isUndefined(mappingName) ? mappingName : 'morphism';

  this[this._leftObjName] = A;
  this[this._rightObjName] = B;
  this[this._mappingName] = f;
}

CommaCategoryObject.prototype.left = function () {
  return this[this._leftObjName];
}

CommaCategoryObject.prototype.right = function () {
  return this[this._rightObjName];
}

CommaCategoryObject.prototype.mapping = function () {
  return this[this._mappingName];
}

CommaCategoryObject.prototype.toString = function () {
  return '(' + this._leftObjName + ': ' + this.left() +
         ', ' + this._rightObjName + ': ' + this.right() +
         ', ' + this._mappingName + ': ' + this.mapping() + ')';
};

function GetLeftObj(C, D) {
  GetLeftObj.base.constructor.call(this, C, D);
}

GetLeftObj.prototype.mapObject = function (A) {
  return this.dom().leftObj(A);
};

GetLeftObj.prototype.mapMorphism = function (f) {
  return this.dom().leftArr(f);
};

function OneCategory() {

}

function LabelingFunctor(alphabet) {
  LabelingFunctor.base.constructor.call(this, new OneCategory(), new SetCategory());
  this.alphabet = this.codom().object(this.alphabet);
}

extend(LabelingFunctor, Functor);

LabelingFunctor.prototype.mapObject = function (A) {
  return this.alphabet;
};

LabelingFunctor.prototype.mapMorphism = function (f) {
  return this.codom().morphism(this.alphabet, this.alphabet).initId();
};

console.log('-----------------------------------------------------');

var setCat = new SetCategory();
var setIdFunc = new IdFunctor(setCat);
var setCrossProductFunc = new CrossProductFunctor(setCat);
var catGraph = new CommaCategory(setIdFunc, setCrossProductFunc, 'edges', 'nodes', 'map', 'edgeMap', 'nodeMap');
var nodesA = setCat.object([1,2]);
var edgesA = setCat.object([1]);
var sourceA = setCat.morphism(edgesA, nodesA, {1: 1});
var targetA = setCat.morphism(edgesA, nodesA, {1: 2});
var mapA = setCat.product(nodesA, nodesA).univ(sourceA, targetA);
var graphA = catGraph.object(edgesA, nodesA, mapA);
//console.log(graphA);

//var catLGraph = new CommaCategory(new GetLeftObj(catGraph, setCat), );

var nodesB = setCat.object([1,2,3,4]);
var edgesB = setCat.object([1,2,3,4,5]);
var sourceB = setCat.morphism(edgesB, nodesB, {1: 1, 2: 2, 3: 3, 4: 1, 5: 3});
var targetB = setCat.morphism(edgesB, nodesB, {1: 2, 2: 4, 3: 4, 4: 3, 5: 1});
var mapB = setCat.product(nodesB, nodesB).univ(sourceB, targetB);
var graphB = catGraph.object(edgesB, nodesB, mapB);
//var graphB = catGraph.object(edgesB, nodesB, objToPairMapping({1: [1,2], 2: [2,4], 3: [3,4], 4: [1,3], 5: [3,1]}));

var nodesC = setCat.object([1,2,5,6]);
var edgesC = setCat.object([1,2,3,4]);
var sourceC = setCat.morphism(edgesC, nodesC, {1: 5, 2: 6, 3: 1, 4: 5});
var targetC = setCat.morphism(edgesC, nodesC, {1: 6, 2: 2, 3: 2, 4: 1});
var mapC = setCat.product(nodesC, nodesC).univ(sourceC, targetC);
var graphC = catGraph.object(edgesC, nodesC, mapC);
//var graphC = catGraph.object(edgesC, nodesC, objToPairMapping({1: [5,6], 2: [6,2], 3: [1,2], 4: [5,1]}));

console.log('graphA = ' + graphA);
console.log('graphB = ' + graphB);
console.log('graphC = ' + graphC);

var fEdgeMap = setCat.morphism(edgesA, edgesB, {1: 1});
var fNodeMap = setCat.morphism(nodesA, nodesB, {1: 1, 2: 2});
var f = catGraph.morphism(graphA, graphB, fEdgeMap, fNodeMap);
console.log(f);

var gEdgeMap = setCat.morphism(edgesA, edgesC, {1: 3});
var gNodeMap = setCat.morphism(nodesA, nodesC, {1: 1, 2: 2});
var g = catGraph.morphism(graphA, graphC, gEdgeMap, gNodeMap);

console.log('f = ' + f);
console.log('g = ' + g);

