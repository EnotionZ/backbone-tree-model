(function() {
	var ArrMethods = {
		findById: function(id) {
			var nodes = [];
			_.each(this, function(model) {
				nodes = nodes.concat(model.findById(id));
			});
			return wrapArray(nodes);
		}
	};
	var wrapArray = function(array) { return _.extend(array, ArrMethods); };

	var TreeModel = Backbone.TreeModel = Backbone.Model.extend({
		constructor: function tree(node) {
			Backbone.Model.prototype.constructor.apply(this, arguments);
			this._nodes = new TreeCollection();
			this._nodes.parent = this;
			this.add(node.nodes);
		},

		// returns all descendants matching :id
		findById: function(id) {
			var nodes = [];
			if(this.id === id) nodes.push(this);
			if(this._nodes) nodes = nodes.concat(this._nodes.findById(id));
			return wrapArray(nodes);
		},

		// returns the root for any node
		root: function() { return this.parent() && this.parent().root() || this; },

		// returns the parent node
		parent: function() { return this.collection && this.collection.parent || null; },

		// returns the children Backbone Collection if children nodes exist
		nodes: function() { return this._nodes.length && this._nodes || null; },

		// add child/children nodes to Backbone Collection
		add: function(nodes) { this._nodes.add(nodes); }
	});
	var TreeCollection = Backbone.TreeCollection = Backbone.Collection.extend({
		model: TreeModel,
		findById: function(id) {
			var nodes = [];
			this.each(function(model) {
				nodes = nodes.concat(model.findById(id));
			});
			return wrapArray(nodes);
		}
	});
}).call(this);
