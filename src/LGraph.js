///////////////////////////////////////////////////////////////////////////////
// LGraphCategory

function LGraphCategory(nodeLabels, edgeLabels) {
  var _nodeLabels = nodeLabels;
  var _edgeLabels = edgeLabels;

  this.object = function(nodeLabels, edgeLabels) {
    if (isUndefined(nodeLabels)) {
      nodeLabels = _nodeLabels;
    }
    if (isUndefined(edgeLabels)) {
      edgeLabels = _edgeLabels;
    }
    return new LGraph(nodeLabels, edgeLabels);
  };

  this.morphism = function(objA, objB) {
    return new LGraphMorphism(objA, objB);
  };

  this.pushout = function(f, g) {
    return new LGraphPushout(this).calculate(f, g);
  };

  this.pushoutComplement = function(f, p) {
    return new LGraphPushout(this).complement(f, p);
  };
}

// extend(LGraphCategory, GraphCategory); // ???

///////////////////////////////////////////////////////////////////////////////
// LGraph

function LGraph(nodeLabels, edgeLabels) {
  assert(!isUndefined(nodeLabels), 'Node labels must be specified for LGraph');
  assert(!isUndefined(edgeLabels), 'Edge labels must be specified for LGraph');
  LGraph.base.constructor.apply(this, arguments);
  var setCat = new SetCategory();
  this.nodeLabel = setCat.morphism(this.nodes, nodeLabels);
  this.edgeLabel = setCat.morphism(this.edges, edgeLabels);
}

extend(LGraph, Graph);

LGraph.prototype.toString = function () {
  return '(nodes: ' + this.nodes + ', edges: ' + this.edges +
         ', source: ' + this.source + ', target: ' + this.target +
         ', nodeLabel: ' + this.nodeLabel + ', edgeLabel: ' + this.edgeLabel + ')';
};

///////////////////////////////////////////////////////////////////////////////
// LGraphMorphism

function LGraphMorphism(graphA, graphB) {
  LGraphMorphism.base.constructor.apply(this, arguments);
  var setCat = new SetCategory();
}

extend(LGraphMorphism, GraphMorphism);

LGraphMorphism.prototype.check = function () {
  LGraphMorphism.base.check.apply(this);
  //console.log('>>> check LGraphMorphism');
  //console.log(this.dom().nodeLabel.toString(), ' == ', this.nodeMap.compose(this.codom().nodeLabel).toString());
  //console.log('>>> ' + this.nodeMap + ' >>> ' + this.codom().nodeLabel);
  assertCommutes(this.dom().nodeLabel, this.codom().nodeLabel.compose(this.nodeMap));
  assertCommutes(this.dom().edgeLabel, this.codom().edgeLabel.compose(this.edgeMap));
}

///////////////////////////////////////////////////////////////////////////////
// LGraphPushout

function LGraphPushout(cat, f, g) {
  LGraphPushout.base.constructor.apply(this, arguments);
}

extend(LGraphPushout, GraphPushout);

LGraphPushout.prototype.check = function () {
  LGraphPushout.base.check.apply(this);
  this.g.check();
  this.p.check();
  this.q.check();
  return this;
};

LGraphPushout.prototype.calculateWOCheck = function (f, g) {
  LGraphPushout.base.calculateWOCheck.apply(this, arguments);
  this.D().nodeLabel = this._npo.univ(this.B().nodeLabel, this.C().nodeLabel);
  this.D().edgeLabel = this._epo.univ(this.B().edgeLabel, this.C().edgeLabel);
  return this;
};

LGraphPushout.prototype.complementWOCheck = function (f, p) {
  LGraphPushout.base.complementWOCheck.apply(this, arguments);
  this.C().nodeLabel = this.D().nodeLabel.compose(this.q.nodeMap);
  this.C().edgeLabel = this.D().edgeLabel.compose(this.q.edgeMap);
  return this;
};
