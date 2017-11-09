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

    $.fadeIn = function (el, time) {
        if (el.style.opacity === "") {
            el.style.opacity = 0;
        }
        if (el.style.display === "" || el.style.display === 'none') {
            el.style.display = 'block';
        }

        var t = setInterval(function () {
            if (el.style.opacity < 1) {
                el.style.opacity = parseFloat(el.style.opacity) + 0.1;
            }
            else {
                clearInterval(t);
            }
        }, time / 10);
    };

    $.fadeOut = function (el, time) {
        if (el.style.opacity === "") {
            el.style.opacity = 1;
        }
        if (el.style.display === "" || el.style.display === 'none') {
            el.style.display = 'block';
        }

        var t = setInterval(function () {
            if (el.style.opacity > 0) {
                el.style.opacity = parseFloat(el.style.opacity) - 0.1;
            }
            else {
                clearInterval(t);
                el.style.display = 'none'
            }
        }, time / 10);
    };


    /**
     * 节点对象
     * @type {{}}
     */
    function Node(properties) {
        var thisobj = this;
        thisobj.properties = $.extend($.extend({}, thisobj.defaulProperties), properties || {});
        thisobj.pos = {x: 0, y: 0};
        thisobj.data = {};
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

    /**
     * 数据加载对象 存储着树上所有节点的数据
     * @param data
     */
    function DataLoader(data) {
        this.data = [];
        this.root;
        this.showMap = {};
        this.groups = {};
        if (data) {
            this.init(data);
        }
    }

    DataLoader.prototype = {
        /**
         * 初始化对象
         * @param data
         */
        init: function (data) {
            this.restoreData();
            this.addData(data);
        },

        /**
         * 清空对象
         */
        restoreData: function () {
            this.data = [];
            this.root;
            this.showMap = {};
            this.groups = {};
        },

        addData: function (data) {
            var datas = this.data,
                groups = this.groups,
                pid;

            for (var i = 0, ch = data.length; i < ch; i++) {
                if (!this.checkExist(data[i].id)) {
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
            }
        },

        /**
         * 检验是否存在
         * @param id   检验的id
         * @returns {boolean} true 存在  false 不存在
         */
        checkExist: function (id) {
            for (var i = 0, ch = this.data.length; i < ch; i++) {
                if (this.data[i].id === id) {
                    return true;
                }
            }
            return false;
        },

        /**
         * showMap 中存储的是 当前页面展现的数据  目的是为了可以清楚某深度后面的展现，比如点了第二级别的子节点，三层以后都去掉
         * @param depth 深度  0-N
         * @param obj   该深度下展现的对象  包含 svg对象和dom对象  详情可见调用此方法的地方
         */
        addItemToShowMap: function (depth, obj) {
            if (!this.showMap[depth]) {
                this.showMap[depth] = [];
            }
            this.showMap[depth].push(obj);
        },

        /**
         * 删掉某层以后的展现数据
         * @param depth
         * @returns {Array} 返回这些展现的对象  包含svg对象和dom对象  均有 remove() 方法
         */
        removeBebindData: function (depth) {
            var objArr = [], tempArr;
            for (var key in this.showMap) {
                if (parseInt(key) > depth) {
                    tempArr = this.showMap[key];

                    for (var i = 0, ch = tempArr.length; i < ch; i++) {
                        objArr.push(tempArr[i]);
                    }

                    delete this.showMap[key];
                }
            }
            return objArr;
        },

        /**
         * 获取根节点的子节点
         * @returns {*}
         */
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

        /**
         * 根据点击的nodeid 得到这个点击的node、root 以及两者之间的nodeid，
         * @param clickNodeId
         * @returns {Array}  点击流线上的nodeid 集合 从点击点开始 一直到 root
         */
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
        },

        /**
         * @param nodeId  要获取深度的node 的id
         * @returns {number}    该node对应的深度  root对应0
         */
        getNodeDepth: function (nodeId) {
            var depth = 0,
                parentId = this.getParentNodeId(nodeId);

            while (parentId) {
                depth += 1;
                parentId = this.getParentNodeId(parentId)
            }
            return depth;

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
     animate:false,     //是否增加动画，默认无
     duration:500,      //动画时间  单位 ms       建议不要高于500
     distance:num,   //父级节点和子节点之间的距离 默认110
     spacing:num,   //同级别节点之间的距离   默认10
     getNodeXXX:function(node),           // 可以根据node  获取到node对象的属性，也可以设置其属性，如设置node的颜色等 可以设置节点的 rate，影响连线入口小方块的高度 以及 入口管子的高度；以及连线的颜色等
     getNodeHeight、getNodeColor、getNodeRate、getNodeExitProperties、getNodeEntraceProperties、getEdgeFillColor
     setNodeXXX:
     setNodeLabelHtml、setNodeLabelStyle、addNodeLabelEventListener
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

    SpaceTree.prototype.checkExist = function (id) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].getId() === id) {
                return true;
            }
        }
        return false;
    };

    //加载数据，初始化dataLoader对象 并且生成对应的node对象
    SpaceTree.prototype.loadData = function (jsonData) {
        var thisobj = this,
            data = jsonData || [],
            node;

        thisobj.nodes = [];

        thisobj.dataLoader.init(jsonData);

        for (var i = 0, ch = data.length; i < ch; i++) {
            if (!thisobj.checkExist(data[i].id)) {
                node = new Node(thisobj.options.node);
                node.setData(data[i]);
                thisobj.nodes.push(node);
            }
        }
        return thisobj;
    };

    /**
     * 通过nodeid 得到 node对象
     * @param id
     * @returns {*}
     */

    SpaceTree.prototype.getNodeById = function (id) {
        for (var i = 0, ch = this.nodes.length; i < ch; i++) {
            if (this.nodes[i].getId() === id) {
                return this.nodes[i];
            }
        }
        return null;
    };

    /**
     * 点击某个节点默认的触发函数
     * @param id
     */
    SpaceTree.prototype.onclick = function (id) {
        this.clickNodeId = id;
        this.reDraw(this.clickNodeId);
    };

    /**
     * 页面初次加载使用这个函数
     * @param jsonData
     */
    SpaceTree.prototype.draw = function (jsonData) {
        if (jsonData) {
            this.loadData(jsonData);
        }

        var thisobj = this;

        thisobj.paper.clear();
        thisobj.selefContainer.innerHTML = "";

        thisobj.drawAllShowNodes();

        thisobj.justifyTheContainer();
    };


    SpaceTree.prototype.drawAllShowNodes = function () {
        var thisobj = this,
            allNodes = thisobj.nodes,
            showNodeIds = thisobj.dataLoader.getShowNodeIds(thisobj.clickNodeId),
            node;

        for (var i = 0, ch = allNodes.length; i < ch; i++) {
            if ($.indexOf(showNodeIds, allNodes[i].getId()) >= 0) {
                node = allNodes[i];
                thisobj.drawEachNode(node);
                thisobj.drawEachEdge(node);
            }
        }
    };

    SpaceTree.prototype.addLoadData = function (data) {
        var thisobj = this;
        thisobj.dataLoader.addData(data);

        for (var i = 0, ch = data.length; i < ch; i++) {
            if (!thisobj.checkExist(data[i].id)) {
                node = new Node(thisobj.options.node);
                node.setData(data[i]);
                thisobj.nodes.push(node);
            }
        }

        return this;
    };

    /**
     * 只刷新这个节点之后的展现
     * @param clickId
     */
    SpaceTree.prototype.reDraw = function (clickId) {
        var clicked = clickId || this.clickNodeId,
            dataLoader = this.dataLoader,
            depth = dataLoader.getNodeDepth(clickId),
            delObjArr = [],
            node, i;

        if (clicked) {
            this.clickNodeId = clicked;
        } else {
            return;
        }

        if (depth === 0) {
            delObjArr = dataLoader.removeBebindData(1);
        } else {
            delObjArr = dataLoader.removeBebindData(depth);
        }

        for (i = 0; i < delObjArr.length; i++) {
            if (delObjArr[i].remove) {
                delObjArr[i].remove();
            } else {
                if (delObjArr[i].parentNode) {
                    delObjArr[i].parentNode.removeChild(delObjArr[i]);
                }
            }
        }

        if (depth !== 0) {
            console.log(this.getNodeById(clicked));
            var childrenIds = dataLoader.getChildrenNodeIds(clicked),
                allNodes = this.nodes;

            for (i = 0; i < allNodes.length; i++) {
                if ($.indexOf(childrenIds, allNodes[i].getId()) >= 0) {
                    node = allNodes[i];
                    this.drawEachNode(node);
                    this.drawEachEdge(node);
                }
            }
        }

        this.justifyTheContainer();
    };

    SpaceTree.prototype.drawEachNode = function (node) {
        var thisobj = this,
            paper = thisobj.paper;

        var dataLoader = thisobj.dataLoader,
            nodeid = node.getId(),
            clickFlowNodeIds = dataLoader.getClickFlowNodeIds(thisobj.clickNodeId),
            selected = $.indexOf(clickFlowNodeIds, nodeid) >= 0,
            childrenNodeIds = dataLoader.getChildrenNodeIds(nodeid),
            depth = dataLoader.getNodeDepth(nodeid),
            hasChild = childrenNodeIds.length > 0;

        function setNodeProperties(node) {

            /**
             * 设置node的高度
             */
            if (thisobj.options.getNodeHeight) {
                node.setHeight(thisobj.options.getNodeHeight(node));
            }

            /**
             * example
             * 设置node背景色
             getNodeColor: function (node, selected, hasChild) {
                if(selected) {
                    console.log("node["+node.getId()+"] is selected,color is:E4393C");
                    return "#E4393C";
                } else if(hasChild){
                    console.log("node["+node.getId()+"] not selected but has children,color is:9AC3FF");
                    return "#9AC3FF";
                } else {
                    console.log("node["+node.getId()+"] not selected nor has children,color is:C2CDF8");
                    return "#C2CDF8";
                }
            }
             */
            if (thisobj.options.getNodeColor) {
                var color = thisobj.options.getNodeColor(node, selected, hasChild);
                node.setFill(color);
                //node.setFill("90-#fff:0-" + color);
            }

            //.....这里可以继续扩展 ，设置 node的属性
        }

        setNodeProperties(node);

        var pos = thisobj.getNodePosition(node);

        var drawWith = node.getWidth(),
            drawHeight = node.getHeight(),
            posX = pos.x,
            posY = pos.y,
            animate = thisobj.options.animate,
            duration = thisobj.options.duration || 200;

        if (animate) {
            drawWith = drawHeight = posX = posY = 0;
            var parentid = dataLoader.getParentNodeId(nodeid);
            if (parentid) {
                var parentNode = thisobj.getNodeById(parentid);
                posX = parentNode.getPosition().x;
                posY = parentNode.getPosition().y;
            }
        }

        var rect = paper.rect(posX, posY, drawWith, drawHeight).attr({
            "fill": node.getFill(),
            "stroke-width": node.getStrokeWidth()
        }).data("nodeid", nodeid);

        if (animate) {
            rect.animate({width: node.getWidth(), height: node.getHeight(), x: pos.x, y: pos.y}, duration);
        }

        dataLoader.addItemToShowMap(depth, rect);

        var selefContainer = thisobj.selefContainer;

        var nodeLable = document.createElement("div");

        nodeLable.className = "node";
        nodeLable.style.position = "absolute";
        nodeLable.style.left = pos.x + "px";
        nodeLable.style.top = pos.y + "px";
        nodeLable.setAttribute("nodeid", node.getId());


        //设置nodeLabel 可以设置其内容  即html 也可以设置其样式
        function setNodeLabel() {
            if (thisobj.options.setNodeLabelHtml) {
                thisobj.options.setNodeLabelHtml(node, nodeLable, selected, hasChild);
            } else {
                nodeLable.innerHTML = node.getId();
            }

            if (thisobj.options.setNodeLabelStyle) {
                thisobj.options.setNodeLabelStyle(node, nodeLable, selected, hasChild);
            } else {
                nodeLable.style.height = node.getHeight() + "px";
                nodeLable.style.width = node.getWidth() + "px";
                nodeLable.style.cursor = "pointer";
            }

            if (thisobj.options.addNodeLabelEventListener) {
                thisobj.options.addNodeLabelEventListener(node, nodeLable, selected, hasChild);
            } else {
                nodeLable.onclick = function () {
                    thisobj.onclick(node.getId());
                }
            }
        }

        setNodeLabel();

        if (animate) {
            nodeLable.style.display = "none";
        }

        dataLoader.addItemToShowMap(depth, nodeLable);

        selefContainer.appendChild(nodeLable);

        if (animate) {
            setTimeout(function () {
                $.fadeIn(nodeLable, parseInt(duration / 2));
            }, duration);
        }

    };


    SpaceTree.prototype.getNodePosition = function (node) {
        var thisobj = this,
            distance = thisobj.options.distance,
            space = thisobj.options.spacing,
            dataLoader = thisobj.dataLoader,
            node_id = node.getId(),
            depth = dataLoader.getNodeDepth(node_id),
            parentid = dataLoader.getParentNodeId(node_id),
            peerids = dataLoader.getPeerNodeIds(node_id),
            size = peerids.length,
            index = $.indexOf(peerids, node_id),
            node_width = node.getWidth(),
            pos = {}, i;

        if (depth === 0) {
            //根节点
            pos = {x: 0, y: 0};
        } else {
            var parentNode = thisobj.getNodeById(parentid),
                parentPos = parentNode.getPosition(),
                currentNodesHeight = 0;

            for (i = 0; i < size; i++) {
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
                    startPosition = startNode.getPosition();
                pos.y = startPosition.y;

                for (i = 0; i < index; i++) {
                    pos.y += thisobj.getNodeById(peerids[i]).getHeight() + space;
                }
            }
        }
        node.pos = pos;
        return pos;
    };

    //节点之间的连线 如果是根节点不需要，子节点开始连向父节点
    SpaceTree.prototype.drawEachEdge = function (node) {
        var thisobj = this,
            dataLoader = thisobj.dataLoader,
            nodeid = node.getId(),
            parentid = dataLoader.getParentNodeId(nodeid);

        if (!parentid) {

        } else {
            var parentNode = thisobj.getNodeById(parentid),
                thisNode = thisobj.getNodeById(nodeid),
                width = parentNode.getWidth(),
                parentHeight = parentNode.getHeight(),
                thisNodeHeight = thisNode.getHeight(),
                peerNodeIds = dataLoader.getPeerNodeIds(nodeid),
                index = $.indexOf(peerNodeIds, nodeid),
                depth = dataLoader.getNodeDepth(nodeid),
                clickFlowNodeIds = dataLoader.getClickFlowNodeIds(thisobj.clickNodeId),
                clickNodeChildren = dataLoader.getChildrenNodeIds(thisobj.clickNodeId),
                paper = thisobj.paper;

            function setNodeData(thisNode, parentNode) {
                /**
                 * 设置node的流入比率  可能影响连线重点的粗细等
                 */
                if (thisobj.options.getNodeRate) {
                    thisNode.setRate(thisobj.options.getNodeRate(thisNode, parentNode));
                }
            }

            setNodeData(thisNode, parentNode);
            //设置节点 出入口 小方块的属性  颜色 高 宽等


            //默认的出口属性，包括出口的宽，高，颜色 以及管道出口的高度  （出口 指 从一个节点流出到子节点  的 流出位置  ）
            var default_exit = {width: 10, height: 18.5, color: "#89B7E8", pipe_height: 4},
                default_entranceH = 0.2 * thisNodeHeight + (0.8 * thisNodeHeight / 100 ) * thisNode.getRate(),
                default_entrace = {
                    width: 3,
                    height: default_entranceH,
                    color: "#89B7E8",
                    pipe_height: default_entranceH - 6
                };

            function setNodePortProperties() {
                /**
                 * example
                 * 设置当前节点相连的父节点的出口的一些属性，
                 * @return 返回对象 包含属性：width->出口方块的宽度，height->出口方块的高度，color->出口方块的颜色，pipe_height->与出口方块连接的连线管道高度
                 getNodeExitProperties: function (node) {
                    var props = [
                        {width: 20, height: 20, color: "blue", pipe_height: 10},
                        {width: 10, height: 18.5, color: "#89B7E8", pipe_height: 4},
                        {width: 15, height: 10, color: "red", pipe_height: 7}];
                    var retProp = props[parseInt(Math.random() * 3)];
                    console.log(node.getId() + "出口属性：", retProp);
                    return retProp;
                }
                 */
                var props;
                //如果该节点是 该层节点的首节点， 并且有设置出口属性的callback 设置一下父节点的出口  该节点的出口  需要下级子节点同理设置
                if (thisobj.options.getNodeExitProperties && index === 0) {
                    props = thisobj.options.getNodeExitProperties(parentNode);
                    parentNode.exit = props;
                }


                /**
                 * 方法和  getNodeExitProperties 类似
                 */
                if (thisobj.options.getNodeEntranceProperties) {
                    props = thisobj.options.getNodeEntranceProperties(thisNode, parentNode, thisobj.getRate());
                    thisNode.entrance = $.extend(default_entrance, props);
                }
            }

            setNodePortProperties();

            var entrance = $.extend(default_entrace, thisNode.entrance),                //入口小方块
                exit = $.extend(default_exit, parentNode.exit),                         //出口小方块
                startHeightV = exit.pipe_height,
                endHeightV = entrance.pipe_height;

            var parentPos = parentNode.getPosition(),
                thisPos = thisNode.getPosition(),
                startPos1 = {x: parentPos.x + width + exit.width, y: parentPos.y + parentHeight / 2 - startHeightV / 2},
                startPos2 = {x: parentPos.x + width + exit.width, y: parentPos.y + parentHeight / 2 + startHeightV / 2},
                endPos1 = {x: thisPos.x - entrance.width, y: thisPos.y + thisNodeHeight / 2 - endHeightV / 2},
                endPos2 = {x: thisPos.x - entrance.width, y: thisPos.y + thisNodeHeight / 2 + endHeightV / 2};

            var endX1 = endPos1.x,
                endY1 = endPos1.y,
                x0 = endX1 - (endPos1.x - startPos1.x) / 4,
                y1 = endY1 + (startPos1.y - endPos1.y) * 0.9,
                startX1 = startPos1.x,
                startY1 = startPos1.y,
                y11 = startY1 + startHeightV - (startPos1.y - endPos1.y) * 0.1,
                y00 = endPos2.y,
                endX2 = endPos2.x,
                endY2 = endPos2.y;


            var connectPathStr = "M" + endX1 + "," + endY1 + "C" + x0 + "," + endY1 + "," + x0 + "," + y1 + "," + startX1 + "," + startY1 + "V" +
                startPos2.y + "C" + x0 + "," + y11 + "," + x0 + "," + y00 + "," + endX2 + "," + endY2,

                entrancePathStr = "M" + endPos1.x + "," + (thisPos.y + thisNodeHeight / 2 - entrance.height / 2) + "H" + thisPos.x + "V" +
                    (thisPos.y + thisNodeHeight / 2 + entrance.height / 2) + "H" + endPos1.x + "Z";


            var connectFill = ($.indexOf(clickFlowNodeIds, nodeid) >= 0 || $.indexOf(clickNodeChildren, nodeid) >= 0) ? "#daecff" : "#F1F1F1";

            function setEdgeProperties() {
                /**
                 * example:
                 * 设置连线颜色
                 getEdgeFillColor:function (thisNode,parentNode) {
                    var color = ["red","yellow","blue","gray","pink","green"];
                    var retColor = color[parseInt(Math.random()*6)];
                    console.log(parentNode.getId() + "->" + thisNode.getId(),retColor);
                    return retColor;
                }
                 */
                if (thisobj.options.getEdgeFillColor) {
                    connectFill = thisobj.options.getEdgeFillColor(thisNode, parentNode);
                }
            }

            setEdgeProperties();

            var drawConnectPathStr = connectPathStr,
                drawEntrancePathStr = entrancePathStr,
                animate = thisobj.options.animate,
                duration = thisobj.options.duration,
                startPosStr = parentPos.x + "," + parentPos.y;

            if (animate) {
                drawConnectPathStr = "M" + startPosStr + "C" + startPosStr + "," + startPosStr + "," + startPosStr +
                    "V" + parentPos.y + "C" + startPosStr + "," + startPosStr + "," + startPosStr;

                drawEntrancePathStr = "M" + startPosStr + "H" + parentPos.x + "V" + parentPos.y + "H" + parentPos.x + "Z";
            }

            //画连线
            var rect_edge = paper.path(drawConnectPathStr).attr({
                'fill': connectFill,
                "stroke-width": 0
            }).data("nodeids", parentid + "-" + nodeid);

            if (animate) {
                rect_edge.animate({path: connectPathStr}, duration);
            }

            dataLoader.addItemToShowMap(depth, rect_edge);


            //画入口小方块
            var rect_entracnce = paper.path(drawEntrancePathStr).attr({
                fill: entrance.color,
                "stroke-width": 0
            }).data("nodeid", nodeid);

            if (animate) {
                rect_entracnce.animate({path: entrancePathStr}, duration);
            }

            dataLoader.addItemToShowMap(depth, rect_entracnce);

            //画出口小方块
            if (index === 0) {
                var exitPathStr = "M" + (startPos1.x - exit.width) + "," + (parentPos.y + parentHeight / 2 - exit.height / 2) + "H" + startPos1.x + "V"
                    + (parentPos.y + parentHeight / 2 + exit.height / 2) + "H" + (startPos1.x - exit.width) + "Z",
                    drawExitPathStr = exitPathStr;

                if (animate) {
                    drawExitPathStr = "M" + startPosStr + "H" + parentPos.x + "V" + parentPos.y + "H" + parentPos.x + "Z";
                }

                var rect_exit = paper.path(drawExitPathStr).attr({
                    fill: exit.color,
                    "stroke-width": 0
                }).data("nodeid", parentid);

                if (animate) {
                    rect_exit.animate({path: exitPathStr}, duration);
                }

                dataLoader.addItemToShowMap(depth, rect_exit);
            }
        }
    };

    /**
     * 将tree的展现 居中放到container中
     */
    SpaceTree.prototype.justifyTheContainer = function () {
        var thisobj = this,
            dataLoader = thisobj.dataLoader,
            clickNodeId = thisobj.clickNodeId || dataLoader.root.id,
            clickNode = thisobj.getNodeById(clickNodeId),
            depth = dataLoader.getNodeDepth(clickNodeId),
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