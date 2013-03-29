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

		// returns descendant matching :id
		// TODO: make this faster by returning the first matched node
		findById: function(id) { return this.where({id: id})[0]; },

		// return all matched descendants
		where: function(obj, excludeCurrentNode) {
			var nodes = [];
			if(!excludeCurrentNode) {
				nodes = nodes.concat(_.where([this.toJSON()], obj));
			}
			nodes = nodes.concat(this._nodes.where(obj));
			this._nodes.each(function(node) {
				nodes = nodes.concat(node.where(obj, true));
			});
			return wrapArray(nodes);
		},

		// returns true if current node is root node
		isRoot: function() { return this === this.root(); },

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
