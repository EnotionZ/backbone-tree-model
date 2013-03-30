var tree;
describe('Backbone Tree', function() {
	beforeEach(function() {
		tree = new Backbone.TreeModel({
			tagname: 'body',
			nodes: [
				{
					id: 'wrapper',
					tagname: 'div',
					nodes: [
						{
							id: 'sidebar',
							tagname: 'div',
							width: 300,
							nodes: [
								{ tagname: 'p' },
								{
									tagname: 'ul',
									nodes: [
										{ tagname: 'li' },
										{ tagname: 'li' },
										{ tagname: 'li' }
									]
								},
								{ tagname: 'span' }
							]
						},
						{
							id: 'content',
							tagname: 'div',
							width: 600,
							nodes: [
								{
									id: 'title',
									tagname: 'h2'
								},
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
				}
			]
		});
	});

	describe('#findById', function() {
		it('Should return matched node', function() {
			var sidebar = tree.findById('sidebar');
			expect(sidebar).to.be.ok();
			expect(sidebar.get('width')).to.be(300);
			expect(sidebar.get('tagname')).to.be('div');

			expect(tree.findById('title').get('tagname')).to.be('h2');
		});
	});

	describe('#where', function() {
		it('Should return all matched descendants', function() {
			expect(tree.where({tagname: 'body'}).length).to.be(1);

			expect(tree.where({tagname: 'div'}).length).to.be(3);
		});
		it('Should support #findById/#where context chaining', function() {
			expect(tree.findById('sidebar').where({tagname: 'div'}).length).to.be(1);
		});
	});

	describe('#isRoot', function() {
		it('Should return true when current node is root node', function() {
			expect(tree.isRoot()).to.be.ok();
			expect(tree.findById('title').root().isRoot()).to.be.ok();
			expect(tree.findById('title').isRoot()).to.not.be.ok();
			expect(tree.findById('sidebar').isRoot()).to.not.be.ok();
		});
	});

	describe('#root', function() {
		it('Should return the root node', function() {
			var sidebar = tree.findById('sidebar');
			var content = tree.findById('content');

			expect(sidebar.root().get('tagname')).to.be('body');
			expect(content.root().get('tagname')).to.be('body');
		});
	});

	describe('#parent', function() {
		it('Should return the parent node', function() {
			var sidebar = tree.findById('sidebar');
			var content = tree.findById('content');

			expect(sidebar.parent().get('id')).to.be('wrapper');
			expect(content.parent().get('id')).to.be('wrapper');
		});
	});

	describe('#nodes', function() {
		it('Should return backbone collection consisting of children nodes if children exist', function() {
			var titleNodes = tree.findById('title').nodes();
			expect(titleNodes).to.not.be.ok();

			var sidebarNodes = tree.findById('sidebar').nodes();
			expect(sidebarNodes).to.be.ok();
			expect(sidebarNodes.length).to.be(3);
			expect(sidebarNodes instanceof Backbone.Collection).to.be.ok();
		});
	});

	describe('#add', function() {
		it('Should support adding single node', function() {
			var sidebar = tree.findById('sidebar');
			sidebar.add({id: 'title_1'});
			expect(sidebar.nodes().length).to.be(4);
			expect(sidebar.findById('title_1')).to.be.ok();
		});

		it('Should support adding array of nodes', function() {
			var sidebar = tree.findById('sidebar');
			sidebar.add([
				{
					id: 'title_2',
					tagname: 'h1',
					nodes: [
						{
							id: 'anchor',
							tagname: 'a',
							nodes: [
								{ tagname: 'span' }
							]
						}
					]
				},
				{
					id: 'title_3',
					tagname: 'h2'
				}
			]);
			expect(sidebar.nodes().length).to.be(5);
			expect(sidebar.findById('title_2')).to.be.ok();
			expect(sidebar.findById('title_3')).to.be.ok();
			expect(sidebar.findById('anchor')).to.be.ok();
			expect(sidebar.findById('anchor').nodes().length).to.be(1);
		});
	});

	describe('#insertBefore', function() {
		it('Should support adding objects to the left of a node', function() {
			tree.findById('wrapper').insertBefore({id: 'left_wrapper'});
			expect(tree.nodes().length).to.be(2);
			expect(tree.nodes().first().id).to.be('left_wrapper');
		});
	});

	describe('#insertAfter', function() {
		it('Should support adding objects to the right of a node', function() {
			tree.findById('wrapper').insertAfter({id: 'right_wrapper'});
			expect(tree.nodes().length).to.be(2);
			expect(tree.nodes().last().id).to.be('right_wrapper');
		});
	});

	describe('#next', function() {
		it('Should return the node on the right', function() {
			expect(tree.findById('sidebar').next().id).to.be('content');
		});
	});

	describe('#prev', function() {
		it('Should return the node on the left', function() {
			expect(tree.findById('content').prev().id).to.be('sidebar');
		});
	});

	describe('#rwhere', function() {
		it('Should be supported for node children collection', function() {
			expect(tree.nodes().rwhere({tagname: 'p'}).length).to.be(2);
			expect(tree.findById('sidebar').nodes().rwhere({tagname: 'p'}).length).to.be(1);
		});

		it('Should be supported from a chained #where call', function() {
			expect(tree.where({tagname: 'div'}).rwhere({tagname: 'span'}).length).to.be(2);
			expect(tree.where({tagname: 'anchor'}).rwhere({tagname: 'span'}).length).to.be(1);
		});
	});

});
