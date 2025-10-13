/* Scrollmap: a scrollable map */

define([
	"dojo", "dojo/_base/declare"
],
	function(dojo, declare) {
		return declare("bgagame.extscrollmap", null, {
			constructor: function() {
				this.container_div = null;
				this.scrollable_div = null;
				this.surface_div = null;
				this.onsurface_div = null;
				this.isdragging = false;
				this.dragging_offset_x = 0;     // Dragging offset
				this.dragging_offset_y = 0;
				this.dragging_handler = null;
				this.dragging_handler_touch = null;
				this.board_x = 0;
				this.board_y = 0;
				this.bEnableScrolling = true;
				this.only_x = false;
				this.only_y = false;
			},
			create: function(container_div, scrollable_div, surface_div, onsurface_div) {
				this.container_div = container_div;
				this.scrollable_div = scrollable_div;
				this.surface_div = surface_div;
				this.onsurface_div = onsurface_div;

				dojo.connect(this.surface_div, "onmousedown", this, "onMouseDown");
				dojo.connect(this.surface_div, "ontouchstart", this, "onMouseDown");
				dojo.connect($('ebd-body'), "onmouseup", this, "onMouseUp");
				dojo.connect($('ebd-body'), "ontouchend", this, "onMouseUp");
				
				document.addEventListener("blur", (e) => {
					// Cancel my drag and drop when mouse is out of window
					this.onMouseUp(e);
				});

				this.scrollto( 0, 0 );
			},
			onMouseDown: function(event) {
				if (!this.bEnableScrolling) { return; }

				//console.log(event);
				if (event.button != undefined && event.button != 0)
					return;

				this.isdragging = true;
				//console.log("start dragging");

				var scrollable_coords = dojo.position(this.scrollable_div);
				var container_coords = dojo.position(this.container_div);
				if (event.pageX === undefined && event.touches && event.touches.length > 0) {
					event.pageX = event.touches[0].pageX;
					event.pageY = event.touches[0].pageY;
				}

				this.dragging_offset_x = event.pageX - (scrollable_coords.x - container_coords.x);
				this.dragging_offset_y = event.pageY - (scrollable_coords.y - container_coords.y);

				this.dragging_handler = dojo.connect($('ebd-body'), "onmousemove", this, "onMouseMove");
				this.dragging_handler_touch = dojo.connect($('ebd-body'), "ontouchmove", this, "onMouseMove");

			},
			onMouseUp: function(event) {
				if (this.isdragging === true) {
					this.isdragging = false;
					dojo.disconnect(this.dragging_handler);
					dojo.disconnect(this.dragging_handler_touch);
//					console.log("stop dragging",this.off_x);
					this.realign();

				}
			},

			onMouseMove: function(event) {
				if (this.isdragging === true) {
					if (event.pageX === undefined && event.touches && event.touches.length > 0) {
						event.pageX = event.touches[0].pageX;
						event.pageY = event.touches[0].pageY;
					}
					var x = event.pageX - this.dragging_offset_x;
					var y = event.pageY - this.dragging_offset_y;

					this.setPos(x, y);
					//dojo.stopEvent(event);
				}
			},
			realign: function() {
				var rect = this.getRect("#" + this.onsurface_div.id + ">*");
				var cont = this.container_div.getBoundingClientRect();
				var max = rect.x + rect.width - cont.width + 100;
				//console.log(rect);
				if (this.off_x > 100)
					this.setPos(0, undefined);
				else if (this.off_x < -max)
					this.setPos(-max, undefined);
			},
			scroll: function(dx, dy) {
				this.setPos(toint(this.off_x) + dx, toint(this.off_y) + dy);
			},

			// Scroll the board to make it centered on given position
			scrollto: function(x, y) {
				var rect = this.container_div.getBoundingClientRect();

				var off_x = x + rect.width / 2;
				var off_y = y + rect.height / 2;

				this.setPos(off_x,off_y);
			},
			// Scroll the board to make its left/top corner on given position
			setPos: function(x, y) {
				var rect = this.container_div.getBoundingClientRect();

				if (x !== undefined && x !== null && !this.only_y) {
					var width = rect.width;
					dojo.style(this.scrollable_div, "left", x + "px");
					dojo.style(this.onsurface_div, "left", x + "px");
					this.board_x = x - width / 2;
					this.off_x = x;
				}
				if (y !== undefined && y !== null && !this.only_x) {
					var height = rect.height;
					dojo.style(this.scrollable_div, "left", y + "px");
					dojo.style(this.onsurface_div, "left", y + "px");
					this.board_y = y - height / 2;
					this.off_y = y;
				}
			},

			// Scroll map in order to center everything
			// By default, take all elements in movable_scrollmap
			//  you can also specify (optional) a custom CSS query to get all concerned DOM elements
			scrollToCenter: function(custom_css_query) {
				var coors=this.getMapCenter(custom_css_query);
				this.scrollto(-coors.x, -coors.y);
			},
			
			getRect: function(custom_css_query) {
				// Get all elements inside and get their max x/y/w/h
				var rect  = {x:0,y:0,width:0,height:0};
				var max_x = 0;
				var max_y = 0;
				var min_x = Number.MAX_SAFE_INTEGER;
				var min_y = Number.MAX_SAFE_INTEGER;

				var css_query = '#' + this.scrollable_div.id + " > *";
				if (typeof custom_css_query != 'undefined') {
					css_query = custom_css_query;
				}
				var nodes = document.querySelectorAll(css_query);
				nodes.forEach((node)=>{
					//console.log(node.id,node.getBoundingClientRect());
					max_x = Math.max(max_x, dojo.style(node, 'left') + dojo.style(node, 'width'));
					min_x = Math.min(min_x, dojo.style(node, 'left'));

					max_y = Math.max(max_y, dojo.style(node, 'top') + dojo.style(node, 'height'));
					min_y = Math.min(min_y, dojo.style(node, 'top'));
				});

				rect.x = min_x;
				rect.y = min_y;
				rect.width = max_x - min_x;
				rect.height = max_y - min_y;

				return rect;
			},

			getMapCenter: function(custom_css_query) {
				// Get all elements inside and get their max x/y/w/h
				var max_x = 0;
				var max_y = 0;
				var min_x = 0;
				var min_y = 0;

				var css_query = '#' + this.scrollable_div.id + " > *";
				if (typeof custom_css_query != 'undefined') {
					css_query = custom_css_query;
				}

				dojo.query(css_query).forEach(dojo.hitch(this, function(node) {
					max_x = Math.max(max_x, dojo.style(node, 'left') + dojo.style(node, 'width'));
					min_x = Math.min(min_x, dojo.style(node, 'left'));

					max_y = Math.max(max_y, dojo.style(node, 'top') + dojo.style(node, 'height'));
					min_y = Math.min(min_y, dojo.style(node, 'top'));

					//                alert( node.id );
					//                alert( min_x+','+min_y+' => '+max_x+','+max_y );
				}));

				return {
					x: (min_x + max_x) / 2,
					y: (min_y + max_y) / 2
				};
			},

			// Optional: setup on screen arrows to scroll the board
			setupOnScreenArrows: function(scrollDelta) {
				this.scrollDelta = scrollDelta;
				// New controls
				dojo.query('#' + this.container_div.id + ' .movetop').connect('onclick', this, 'onMoveTop').style('cursor', 'pointer');
				dojo.query('#' + this.container_div.id + ' .movedown').connect('onclick', this, 'onMouseDown').style('cursor', 'pointer');
				dojo.query('#' + this.container_div.id + ' .moveleft').connect('onclick', this, 'onMoveLeft').style('cursor', 'pointer');
				dojo.query('#' + this.container_div.id + ' .moveright').connect('onclick', this, 'onMoveRight').style('cursor', 'pointer');

			},

			//////////////////////////////////////////////////
			//// Scroll with buttons

			onMoveTop: function(event) {
				console.log("onMoveTop");
				event.preventDefault();
				this.scroll(0, this.scrollDelta);
				this.realign();
			},
			onMoveLeft: function(event) {
				console.log("onMoveLeft");
				event.preventDefault();
				this.scroll(this.scrollDelta, 0);
				this.realign();
			},
			onMoveRight: function(event) {
				console.log("onMoveRight");
				event.preventDefault();
				this.scroll(-this.scrollDelta, 0);
				this.realign();
			},
			onMoveDown: function(event) {
				console.log("onMoveDown");
				event.preventDefault();
				this.scroll(0, -this.scrollDelta);
				this.realign();
			},

			isVisible: function(x, y) {
				var width = dojo.style(this.container_div, "width");
				var height = dojo.style(this.container_div, "height");

				if (x >= 0 && x < width) {
					if (y >= 0 && y < height) {
						return true;
					}
				}

				return false;
			},

			///////////////////////////////////////////////////
			///// Enable / disable scrolling
			enableScrolling: function() {
				if (!this.bEnableScrolling) {
					this.bEnableScrolling = true;
					dojo.query('#' + this.container_div.id + ' .movetop').style('visibility', 'visible');
					dojo.query('#' + this.container_div.id + ' .moveleft').style('visibility', 'visible');
					dojo.query('#' + this.container_div.id + ' .moveright').style('visibility', 'visible');
					dojo.query('#' + this.container_div.id + ' .movedown').style('visibility', 'visible');

				}
			},
			disableScrolling: function() {
				if (this.bEnableScrolling) {
					this.bEnableScrolling = false;
					// hide arrows
					dojo.query('#' + this.container_div.id + ' .movetop').style('visibility', 'hidden');
					dojo.query('#' + this.container_div.id + ' .moveleft').style('visibility', 'hidden');
					dojo.query('#' + this.container_div.id + ' .moveright').style('visibility', 'hidden');
					dojo.query('#' + this.container_div.id + ' .movedown').style('visibility', 'hidden');
				}
			},
		});
	});
