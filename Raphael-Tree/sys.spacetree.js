(function (global) {

    var $ = function (id) {
        return document.getElementById(id);
    };

    $.extend = function (original, extended) {
        for (var key in (extended || {})) {
            original[key] = extended[key];
        }
        return original;
    };

    $.indexOf = function (arr, item) {
        if (arr && typeof arr === "object" && arr instanceof Array) {
            if (arr.length === 0) {
                return -1;
            }
            for (var i = 0, ch = arr.length; i < ch; i++) {
                if (arr[i] === item) {
                    return i;
                }
            }
            return -1
        } else {
            return -1;
        }
    };


    /**
     * 节点对象
     * @type {{}}
     */
    function Node(properties) {
        var thisobj = this;
        thisobj.properties = $.extend($.extend({}, thisobj.defaulProperties), properties || {});
        thisobj.pos = {x: 0, y: 0};
        thisobj.data = {
            depth: 0,
            index: 0
        };
    }

    Node.prototype = {
        defaulProperties: {
            width: 175,
            height: 56,
            strokeWidth: 0,
            type: "rectangles",
            fill: "#BDD8F3"
        },
        getPosition: function () {
            return this.pos;
        },
        getWidth: function () {
            return this.width || this.properties.width;
        },
        getHeight: function () {
            return this.height || this.properties.height;
        },
        setHeight: function (height) {
            this.height = height;
        },
        getStrokeWidth: function () {
            return this.strokeWidth || this.properties.strokeWidth;
        },
        getFill: function () {
            return this.fill || this.properties.fill;
        },
        setFill: function (fill) {
            this.fill = fill;
        },
        setData: function (data) {
            this.data = $.extend({}, data || {});
        },
        getData: function () {
            return this.data;
        },
        getDepth: function () {
            return this.data.depth || 0;
        },
        getId: function () {
            return this.data.id;
        },
        getRate: function () {
            return this.rate || 0;
        },
        setRate: function (rate) {
            this.rate = rate;
        }
    };

    function Edge(properties) {
        var thisobj = this;
        thisobj.properties = $.extend($.extend({}, thisobj.defaulProperties), properties || {});
    }


    /**
     * 数据加载对象
     * @param data
     */
    function DataLoader(data) {
        this.data = [];
        this.root;
        this.groups = {};
        if (data) {
            this.init(data);
        }
    }

    DataLoader.prototype = {
        init: function (data) {
            var datas = this.data,
                groups = this.groups,
                pid;

            for (var i = 0, ch = data.length; i < ch; i++) {
                datas.push(data[i]);
                pid = data[i].parent;
                if (pid) {
                    if (!groups[pid]) {
                        groups[pid] = [];
                    }
                    groups[pid].push(data[i].id);
                } else {
                    //没有parent 就是根节点
                    this.root = data[i];
                }
            }
        },

        getRootChildNodeIds: function () {
            var rootid = this.root.id;
            return this.getChildrenNodeIds(rootid);
        },

        //根据点击的节点，获取当前展现的节点集合
        getShowNodeIds: function (clickNodeId) {
            var thisobj = this,
                nodes = [],
                i, ch,
                rootId = thisobj.root.id,
                flowNodeIds = thisobj.getClickFlowNodeIds(clickNodeId),
                children_node_ids, peers_node_ids;

            clickNodeId = clickNodeId || rootId;

            for (i = flowNodeIds.length - 1; i >= 0; i--) {
                peers_node_ids = thisobj.getPeerNodeIds(flowNodeIds[i]);
                for (var j = 0; j < peers_node_ids.length; j++) {
                    nodes.push(peers_node_ids[j]);
                }
            }

            children_node_ids = thisobj.getChildrenNodeIds(clickNodeId);

            for (i = 0, ch = children_node_ids.length; i < ch; i++) {
                nodes.push(children_node_ids[i]);
            }

            return nodes;
        },

        getClickFlowNodeIds: function (clickNodeId) {
            var flowNodeIds = [],
                clicked = clickNodeId || this.root.id,
                parentId = this.getParentNodeId(clicked);
            flowNodeIds.push(clicked);

            while (parentId) {
                flowNodeIds.push(parentId);
                parentId = this.getParentNodeId(parentId)
            }
            return flowNodeIds;
        },

        //获取子节点id集合
        getChildrenNodeIds: function (parentId) {
            if (parentId) {
                var groups = this.groups;
                return groups[parentId] || [];
            } else {
                return this.getRootChildNodeIds();
            }
        },

        //获取同辈节点id集合
        getPeerNodeIds: function (nodeId) {
            var thisobj = this;
            if (nodeId === thisobj.root.id) {
                var peer_node_ids = [];
                peer_node_ids.push(nodeId);
                return peer_node_ids;
            } else {
                var parent_id = thisobj.getParentNodeId(nodeId);
                return thisobj.getChildrenNodeIds(parent_id);
            }
        },

        //获取父节点id
        getParentNodeId: function (childId) {
            var groups = this.groups,
                children,
                parent;
            outterLoop:
                for (var key in groups) {
                    children = groups[key];
                    for (var i = 0, ch = children.length; i < ch; i++) {
                        if (children[i] === childId) {
                            parent = key;
                            break outterLoop;
                        }
                    }
                }
            return parent;
        }
    };


    /**
     options:       对外提供的 可以配置的属性 或 callback
     paper:{
		width,      //画布的宽度
		height,     //画布的高度         //如果不穿 默认是容器的宽高
	},
     node:{ //节点的属性        详见 Node类的options
		width,
		height,
		...
	},
     Edges:{	//连线属性

	},
     distance:num,   //父级节点和子节点之间的距离 默认110
     spacing:num,   //同级别节点之间的距离   默认10
     getNodeXXX:function(node),           // 可以根据node  获取到node对象的属性，也可以设置其属性，如设置node的颜色等 可以设置节点的 rate，影响连线入口小方块的高度 以及 入口管子的高度；以及连线的颜色等
     getNodeHeight、getNodeColor、getNodeRate、getNodeExitProperties、getNodeEntraceProperties
     **/


    /**
     * 树对象
     * @type {window.SpaceTree}
     */
    var SpaceTree = global.SpaceTree = function (container_id, options) {
        var thisobj = this,
            document = global.document || document;

        //树的容器
        thisobj.container = $(container_id);
        //树的配置信息
        thisobj.options = $.extend($.extend({}, thisobj.globalData), options);
        //树的画布对象
        var paperOps = thisobj.options.paper;
        thisobj.viewBox = {
            x: 0,
            y: 0,
            w: paperOps.width || thisobj.container.clientWidth,
            h: paperOps.height || thisobj.container.clientHeight
        };
        thisobj.paper = Raphael(thisobj.container, thisobj.viewBox.w, thisobj.viewBox.h);

        thisobj.selefContainer = document.createElement("div");
        thisobj.selefContainer.className = "label_container";
        thisobj.container.appendChild(thisobj.selefContainer);
        //树的数据加载对象
        thisobj.dataLoader = new DataLoader();
        //树的所有节点
        thisobj.nodes = [];
        //树的所有连线
        thisobj.edges = [];
        //树的点击节点
        thisobj.clickNode = null;

        thisobj.addEventListener();
    };

    SpaceTree.prototype.globalData = {
        paper: {    //画布默认属性

        },
        node: {     //节点的属性
            width: 175,
            height: 56,
            border: 0,
            type: "rectangles",
            strokeWidth: 0,
            fill: "#BDD8F3"
        },
        direct: "left",     //树方向 默认从左到右，可选从上到下
        distance: 110,       //上一级和下一级之间的距离
        spacing: 10,        //同级之间的距离
        leval: 1            //展现当前点击节点的下N层
    };

    SpaceTree.prototype.loadData = function (jsonData) {
        var thisobj = this,
            data = jsonData || [],
            node, edge;

        thisobj.nodes = [];

        thisobj.dataLoader.init(jsonData);

        for (var i = 0, ch = data.length; i < ch; i++) {
            node = new Node(thisobj.options.node);
            node.setData(data[i]);
            thisobj.nodes.push(node);
        }
    };

    SpaceTree.prototype.getNodeById = function (id) {
        for (var i = 0, ch = this.nodes.length; i < ch; i++) {
            if (this.nodes[i].getId() === id) {
                return this.nodes[i];
            }
        }
        return null;
    };

    SpaceTree.prototype.onclick = function (id) {
        this.clickNodeId = id;
        this.draw();
    };


    SpaceTree.prototype.draw = function (jsonData) {
        if (jsonData) {
            this.loadData(jsonData);
        }

        var thisobj = this;

        thisobj.paper.clear();
        thisobj.selefContainer.innerHTML = "";

        thisobj.drawNode();

        thisobj.drawEdge();

        thisobj.justifyTheContainer();
    };

    SpaceTree.prototype.reDraw = function () {

    };

    SpaceTree.prototype.drawNode = function () {
        var thisobj = this,
            allNodes = thisobj.nodes,
            showNodeIds = thisobj.dataLoader.getShowNodeIds(thisobj.clickNodeId),
            node;

        for (var i = 0, ch = allNodes.length; i < ch; i++) {
            if ($.indexOf(showNodeIds, allNodes[i].getId()) >= 0) {
                node = allNodes[i];
                thisobj.drawEachNode(node);
            }
        }
    };

    SpaceTree.prototype.drawEachNode = function (node) {
        var thisobj = this,
            paper = thisobj.paper;

        var dataLoader = thisobj.dataLoader,
            nodeid = node.getId(),
            clickFlowNodeIds = dataLoader.getClickFlowNodeIds(thisobj.clickNodeId),
            selected = $.indexOf(clickFlowNodeIds, nodeid) >= 0,
            childrenNodeIds = dataLoader.getChildrenNodeIds(nodeid),
            hasChild = childrenNodeIds.length > 0;

        function setNodeProperties(node) {

            if (thisobj.options.getNodeHeight) {
                node.setHeight(thisobj.options.getNodeHeight(node));
            }

            if (thisobj.options.getNodeColor) {

                var color = thisobj.options.getNodeColor(node, selected, hasChild);
                node.setFill(color);
                //node.setFill("90-#fff:0-" + color);
            }

            //.....这里可以继续扩展 ，设置 node的属性
        }

        setNodeProperties(node);

        var pos = thisobj.getNodePosition(node);

        var retct = paper.rect(pos.x, pos.y, node.getWidth(), node.getHeight());

        retct.attr({"fill": node.getFill(), "stroke-width": node.getStrokeWidth()});

        var selefContainer = thisobj.selefContainer;

        var nodeLable = document.createElement("div");
        nodeLable.className = "node";
        nodeLable.style.position = "absolute";
        nodeLable.style.left = pos.x + "px";
        nodeLable.style.top = pos.y + "px";

        if (thisobj.options.setNodeLabelHtml) {
            thisobj.options.setNodeLabelHtml(node,nodeLable);
        } else {
            nodeLable.innerHTML = node.getId();
        }

        if (thisobj.options.addNodeLabelStyle) {
            thisobj.options.addNodeLabelStyle(node, selected, nodeLable, hasChild);
        } else {
            nodeLable.style.height = node.getHeight() + "px";
            nodeLable.style.width = node.getWidth() + "px";
            nodeLable.style.cursor = "pointer";
        }

        if (thisobj.options.addNodeLabelEvent) {
            thisobj.options.addNodeLabelEvent(node,nodeLable);
        } else {
            nodeLable.onclick = function () {
                thisobj.onclick(node.getId());
            }
        }

        selefContainer.appendChild(nodeLable);
    };


    SpaceTree.prototype.getNodePosition = function (node) {
        var thisobj = this,
            distance = thisobj.options.distance,
            space = thisobj.options.spacing,
            paper = thisobj.paper,
            dataLoader = thisobj.dataLoader,
            depth = node.getDepth(),
            node_id = node.getId(),
            parentid = dataLoader.getParentNodeId(node_id),
            peerids = dataLoader.getPeerNodeIds(node_id),
            size = peerids.length,
            index = $.indexOf(peerids, node_id),
            node_width = node.getWidth(),
            pos = {};

        if (depth === 0) {
            //根节点
            pos = {x: 0, y: 0};
        } else {
            var parentNode = thisobj.getNodeById(parentid),
                parentPos = parentNode.getPosition(),
                currentNodesHeight = 0;

            for (var i = 0; i < size; i++) {
                currentNodesHeight += thisobj.getNodeById(peerids[i]).getHeight() + ((i === size - 1) ? 0 : space);
            }

            pos.x = depth * (node_width + distance);

            if (index === 0) {
                pos.y = -currentNodesHeight / 2 + parentNode.getHeight() / 2 + parentPos.y;

                if (depth > 1) {
                    var secondNodeIds = dataLoader.getRootChildNodeIds(),
                        secondStartNode = thisobj.getNodeById(secondNodeIds[0]),
                        secondStartPosition = secondStartNode.getPosition(),
                        secondStartY = secondStartPosition.y;

                    pos.y = Math.max(pos.y, secondStartY);
                }

            } else {
                var startNode = thisobj.getNodeById(peerids[0]),
                    startPosition = startNode.getPosition(),
                    startY = startPosition.y;

                pos.y = startY;

                for (var i = 0; i < index; i++) {
                    pos.y += thisobj.getNodeById(peerids[i]).getHeight() + space;
                }
            }
        }
        node.pos = pos;
        return pos;
    };

    SpaceTree.prototype.drawEdge = function () {
        var thisobj = this,
            allNodes = thisobj.nodes,
            showNodeIds = thisobj.dataLoader.getShowNodeIds(thisobj.clickNodeId),
            node;

        for (var i = 0, ch = allNodes.length; i < ch; i++) {
            if ($.indexOf(showNodeIds, allNodes[i].getId()) >= 0) {
                node = allNodes[i];
                thisobj.drawEachEdge(node);
            }
        }
    };

    //节点之间的连线 如果是根节点不需要，子节点开始连向父节点
    SpaceTree.prototype.drawEachEdge = function (node) {
        var thisobj = this,
            dataLoader = thisobj.dataLoader,
            nodeid = node.getId(),
            parentid = dataLoader.getParentNodeId(nodeid);

        if (parentid) {
            var parentNode = thisobj.getNodeById(parentid),
                thisNode = thisobj.getNodeById(nodeid),
                width = parentNode.getWidth(),
                parentHeight = parentNode.getHeight(),
                thisNodeHeight = thisNode.getHeight(),
                peerNodeIds = dataLoader.getPeerNodeIds(nodeid),
                index = $.indexOf(peerNodeIds, nodeid),
                clickFlowNodeIds = dataLoader.getClickFlowNodeIds(thisobj.clickNodeId),
                clickNodeChildren = dataLoader.getChildrenNodeIds(thisobj.clickNodeId),
                paper = thisobj.paper;

            function setNodeData(thisNode, parentNode) {
                if (thisobj.options.getNodeRate) {
                    thisobj.options.getNodeRate(thisNode, parentNode);
                }
            }

            setNodeData(thisNode, parentNode);
            //设置节点 出入口 小方块的属性  颜色 高 宽等



            //默认的出口属性，包括出口的宽，高，颜色 以及管道出口的高度  （出口 指 从一个节点流出到子节点  的 流出位置  ）
            var default_exit = {width: 10, height: 18.5, color: "#89B7E8", pipe_height: 4},
                default_entranceH = 0.2 * thisNodeHeight + (0.8 * thisNodeHeight / 100 ) * thisNode.getRate(),
                default_entrace = {width: 3, height: default_entranceH, color: "#89B7E8", pipe_height: default_entranceH - 6};

            function setNodePortProperties() {
                //如果该节点是 该层节点的首节点， 并且有设置出口属性的callback 设置一下父节点的出口  该节点的出口  需要下级子节点同理设置
                if (thisobj.options.getNodeExitProperties && index === 0) {
                    var props = thisobj.options.getNodeExitProperties(parentNode);
                    parentNode.exit = props;
                }

                if (thisobj.options.getNodeEntranceProperties) {
                    var props = thisobj.options.getNodeEntranceProperties(thisNode);
                    thisNode.entrance = $.extend(default_entrance, props);
                }
            }

            setNodePortProperties();

            var entrance = $.extend(default_entrace, thisNode.entrance),            //入口小方块
                exit = $.extend(default_exit, parentNode.exit),                       //出口小方块
                endVHeight = exit.pipe_height,
                startVHeight = entrance.pipe_height;

            var parentPos = parentNode.getPosition(),
                thisPos = thisNode.getPosition(),
                start1Pos = {x: thisPos.x - entrance.width, y: thisPos.y + thisNodeHeight / 2 - startVHeight / 2},
                start2Pos = {x: thisPos.x - entrance.width, y: thisPos.y + thisNodeHeight / 2 + startVHeight / 2},
                end1Pos = {x: parentPos.x + width + exit.width, y: parentPos.y + parentHeight / 2 - endVHeight / 2},
                end2Pos = {x: parentPos.x + width + exit.width, y: parentPos.y + parentHeight / 2 + endVHeight / 2};

            var start1X = start1Pos.x,
                start1Y = start1Pos.y,
                x0 = start1X - (start1Pos.x - end1Pos.x) / 4,
                y0 = start1Y,
                x1 = x0,
                y1 = start1Y + (end1Pos.y - start1Pos.y) * 0.9,
                end1X = end1Pos.x,
                end1Y = end1Pos.y,
                x11 = x0,
                y11 = end1Y + endVHeight - (end1Pos.y - start1Pos.y) * 0.1,
                x00 = x0,
                y00 = start2Pos.y,
                start2X = start2Pos.x,
                start2Y = start2Pos.y;


            var connectPathStr = "M" + start1X + "," + start1Y + "C" + x0 + "," + y0 + "," + x1 + "," + y1 + "," + end1X + "," + end1Y +
                "V" + end2Pos.y + "C" + x11 + "," + y11 + "," + x00 + "," + y00 + "," + start2X + "," + start2Y;

            var connectFill = ($.indexOf(clickFlowNodeIds, nodeid) >= 0 || $.indexOf(clickNodeChildren, nodeid) >= 0) ? "#daecff" : "#F1F1F1";
            //画连线
            paper.path(connectPathStr).attr({
                'fill': connectFill,
                "stroke-width": 0
            });

            //画入口小方块
            var entrancePathStr = "M" + start1Pos.x + "," + (thisPos.y + thisNodeHeight / 2 - entrance.height / 2) + "H" + thisPos.x + "V" + (thisPos.y + thisNodeHeight / 2 + entrance.height / 2) + "H" + start1Pos.x + "Z";
            paper.path(entrancePathStr).attr({fill: entrance.color, "stroke-width": 0});

            //画出口小方块
            if (index === 0) {
                var exitPathStr = "M" + (end1Pos.x - exit.width) + "," + (parentPos.y + parentHeight / 2 - exit.height / 2) + "H" + end1Pos.x + "V" + (parentPos.y + parentHeight / 2 + exit.height / 2) + "H" + (end1Pos.x - exit.width) + "Z";
                paper.path(exitPathStr).attr({fill: exit.color, "stroke-width": 0});
            }
        }
    };

    SpaceTree.prototype.justifyTheContainer = function () {
        var thisobj = this,
            dataLoader = thisobj.dataLoader,
            clickNodeId = thisobj.clickNodeId || dataLoader.root.id,
            clickNode = thisobj.getNodeById(clickNodeId),
            depth = clickNode.getDepth(),
            cols = depth + 1,
            childIds = dataLoader.getChildrenNodeIds(clickNodeId),
            secondNodeIds = dataLoader.getRootChildNodeIds(),
            secondStartNode = thisobj.getNodeById(secondNodeIds[0]),
            secondStartPosition = secondStartNode.getPosition(),
            secondStartY = secondStartPosition.y,

            height = clickNode.getHeight(),
            width = clickNode.getWidth(),
            distance = thisobj.options.distance,
            space = thisobj.options.spacing;

        var pic_width = childIds && childIds.length > 0 ? (cols + 1) * width + cols * distance : cols * width + (cols - 1) * distance,
            pic_height = 0;

        for (var i = 0; i < secondNodeIds.length; i++) {
            pic_height += thisobj.getNodeById(secondNodeIds[i]).getHeight() + ((i === secondNodeIds.length - 1) ? 0 : space);
        }


        pic_width = Math.max(pic_width, width);
        pic_height = Math.max(pic_height, height);

        var picSize = {w: pic_width, h: pic_height};

        var viewBox = thisobj.viewBox;

        var x = viewBox.w >= picSize.w ? (viewBox.w - picSize.w) / 2 : viewBox.w - picSize.w,
            y = (viewBox.h - picSize.h) / 2;

        y = Math.max(y, 0) - secondStartY;

        thisobj.setViewBox(0 - x, 0 - y);
    };

    SpaceTree.prototype.setViewBox = function (x, y, w, h) {
        var paper = this.paper,
            viewBox = this.viewBox;

        viewBox.x = isNaN(x) ? viewBox.x : x;
        viewBox.y = isNaN(y) ? viewBox.y : y;
        viewBox.w = isNaN(w) ? viewBox.w : w;
        viewBox.h = isNaN(h) ? viewBox.h : h;

        this.selefContainer.style.left = (0 - viewBox.x) + "px";
        this.selefContainer.style.top = (0 - viewBox.y) + "px";

        paper.setViewBox(viewBox.x, viewBox.y, viewBox.w, viewBox.h);
    };

    SpaceTree.prototype.addEventListener = function () {
        var thisobj = this,
            container = this.container,
            position, isdown;

        container.onmousedown = function (event) {
            isdown = true;
            var e = event || window.event;
            position = {
                x: e.clientX,
                y: e.clientY
            };
        };

        container.onmouseup = function () {
            isdown = false;
        };

        container.onmousemove = function (event) {
            if (isdown) {
                var e = event || window.event;
                var x = e.clientX - position.x,
                    y = e.clientY - position.y;

                position = {
                    x: e.clientX,
                    y: e.clientY
                };

                var relocateX = thisobj.viewBox.x - x,
                    relocateY = thisobj.viewBox.y - y;

                thisobj.setViewBox(relocateX, relocateY);
            }

        };
    };

    return SpaceTree;

})(window);