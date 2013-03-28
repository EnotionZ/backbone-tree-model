describe('Backbone Tree', function() {
	var tree;
	beforeEach(function() {
		tree = new Backbone.TreeModel({
			id: 'body',
			nodes: [
				{
					id: 'wrapper',
					nodes: [
						{
							id: 'sidebar',
							width: 300,
							nodes: [
								{ id: 'paragraph' },
								{ id: 'list' },
								{ id: 'span' }
							]
						},
						{
							id: 'content',
							width: 600,
							nodes: [
								{
									id: 'paragraph',
									nodes: [
										{
											id: 'span',
											nodes: [
												{ id: 'span' }
											]
										}
									]
								},
								{ id: 'title' }
							]
						}
					]
				}
			]
		});
	});

	describe('#findById', function() {
		it('Should return all matched descendants', function() {
			expect(tree.findById('span').length).to.be(3);

			var sidebar = tree.findById('sidebar')[0];
			expect(sidebar.get('width')).to.be(300);
			expect(sidebar.findById('span').length).to.be(1);
		});
		it('Should support #findById chaining', function() {
			expect(tree.findById('paragraph').findById('span').length).to.be(2);
		});
	});

	describe('#root', function() {
		it('Should return the root node', function() {
			var sidebar = tree.findById('sidebar')[0];
			var content = tree.findById('content')[0];

			expect(sidebar.root().get('id')).to.be('body');
			expect(content.root().get('id')).to.be('body');
		});
	});

	describe('#parent', function() {
		it('Should return the parent node', function() {
			var sidebar = tree.findById('sidebar')[0];
			var content = tree.findById('content')[0];

			expect(sidebar.parent().get('id')).to.be('wrapper');
			expect(content.parent().get('id')).to.be('wrapper');
		});
	});

	describe('#nodes', function() {
		it('Should return backbone collection consisting of children nodes if children exist', function() {
			var titleNodes = tree.findById('title')[0].nodes();
			expect(titleNodes).to.not.be.ok();

			var sidebarNodes = tree.findById('sidebar')[0].nodes();
			expect(sidebarNodes).to.be.ok();
			expect(sidebarNodes.length).to.be(3);
			expect(sidebarNodes instanceof Backbone.Collection).to.be.ok();
		});
	});

	describe('#add', function() {
		it('Should support adding nodes to children', function() {
			var sidebar = tree.findById('sidebar')[0];

			// add single object
			sidebar.add({id: 'title'});
			expect(sidebar.nodes().length).to.be(4);
			expect(sidebar.findById('title').length).to.be(1);

			// add array
			sidebar.add([
				{
					id: 'h1',
					nodes: [
						{
							id: 'anchor',
							nodes: [
								{ id: 'span' }
							]
						}
					]
				},
				{ id: 'h2' }
			]);
			expect(sidebar.nodes().length).to.be(6);
			expect(sidebar.findById('h1').length).to.be(1);
			expect(sidebar.findById('h2').length).to.be(1);
			expect(sidebar.findById('anchor').length).to.be(1);
			expect(sidebar.findById('span').length).to.be(2);
		});
	});

});
