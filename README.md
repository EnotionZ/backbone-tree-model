# Backbone.TreeModel

## Usage

###1. Initialize
```javascript
var tree = new Backbone.TreeModel({
	tagname: 'body',
	nodes: [
		{
			id: 'sidebar',
			tagname: 'div',
			width: 300,
			nodes: [
				{ tagname: 'p' },
				{ tagname: 'span' }
			]
		},
		{
			id: 'content',
			tagname: 'div',
			width: 600,
			nodes: [
        { tagname: 'div' },
				{
					tagname: 'p',
					nodes: [
						{
							tagname: 'anchor',
							nodes: [
								{ tagname: 'span' }
							]
						}
					]
				}
			]
		}
	]
});
```

###2. Traversing Tree
```javascript
tree.get('tagname');                                       // returns "body", `tree` is a backbone model
var nodes = tree.nodes();                                  // `nodes` is a backbone collection
var sidebar = nodes.first();                               // `sidebar` is a backbone model
sidebar.get('width');                                      // 300
(sidebar.parent() === tree)                                // true
(sidebar.root() === tree)                                  // true
tree.isRoot();                                             // true
```

###3. Special Search
```javascript
var content = tree.findById('content');                    // `findById` returns unique node
var paragraphNode = tree.findWhere({tagname: 'p'});        // `findWhere` returns first match
var paragraphNodes = tree.where({tagname: 'p'});           // `where` returns all matches

// TreeModel nodes inherit from Backbone Models
content.get('tagname');                                    // "div"
content.where({ tagname: 'p'}).length;                     // 1
tree.where({ tagname: 'p' }).length;                       // 2

// Recursive-where for TreeCollection
var nodes = tree.nodes();
nodes.where({tagname: 'div'}).length;                      // 2
nodes.rwhere({tagname: 'div'}).length;                     // 3

// Special mixed TreeModel node Array
var specialArray = tree.where({tagname: 'div'});           // Array with standard methods (push/pop/splice/etc.)
specialArray.length;                                       // 3
var array2 = specialArray.rwhere({tagname: 'span'});       // has recursive-where method and returns special array
array2.length;                                             // 2
```

###4. Node Operations
```javascript
var sidebar = tree.findById('sidebar');

// add single node
sidebar.where({tagname: 'p'}).length;                      // 1
sidebar.add({tagname: 'p'});                               // adds object to sidebar node
sidebar.where({tagname: 'p'}).length;                      // 2

// add array of objects
sidebar.where({tagname: 'span'}).length;                   // 1
sidebar.add([                                              
  { tagname: 'span'},
  { tagname: 'span'}
]);
sidebar.where({tagname: 'span'}).length;                   // 3
```
