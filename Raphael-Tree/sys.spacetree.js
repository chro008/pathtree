(function (global) {

    var Util = {

    };

    Util.extend = function (original, extended) {
        for (var key in (extended || {})) {
            original[key] = extended[key];
        }
        return original;
    };

    Util.indexOf = function (arr, item) {
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

    Util.fadeIn = function (el, time) {
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

    /**
     * 节点对象
     * @type {{}}
     */
    function Node(properties) {
        var thisobj = this;
        thisobj.properties = Util.extend(Util.extend({}, thisobj.defaulProperties), properties || {});
        thisobj.pos = {x: 0, y: 0};
        thisobj.data = {};
    }

    Node.prototype = {
        defaulProperties: {
            width: 175,
            height: 56,
            type: "rectangles",
            fill: "#D7E8F8",         //默认颜色  未被选中 且 有子节点
            selectFill: "#9FCCFF",   //节点被选择的颜色
            exitFill: "#F1F1F1"     //离开节点的颜色（没有子节点）
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
        getFill: function () {
            return this.fill || this.properties.fill;
        },
        getSelectFil: function () {
            return this.selectFill || this.properties.selectFill;
        },
        getExitFill: function () {
            return this.exitFill || this.properties.exitFill;
        },
        setData: function (data) {
            this.data = Util.extend({}, data || {});
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
     * 连线对象
     * @param properties
     * @constructor
     */
    function Edge(properties) {
        var thisobj = this;
        thisobj.properties = Util.extend(Util.extend({}, thisobj.defaulProperties), properties || {});
    }

    Edge.prototype = {
        defaulProperties: {
            selectFill: "#BDD8F3",
            unSelecttFill: "#F1F1F1"
        },

        getSelectFil: function () {
            return this.selectFill || this.properties.selectFill;
        },
        getUnSelectFill: function () {
            return this.unSelecttFill || this.properties.unSelecttFill;
        }
    };

    /**
     * 颜色管理对象
     * @param properties
     * @constructor
     */
    function ColorManager(properties) {
        this.baseNode = new Node(properties.node || {});
        this.baseEdge = new Edge(properties.edge || {});
    }

    ColorManager.prototype = {
        getNodeFill: function () {
            return this.nodefill || this.baseNode.getFill();
        },
        setNodeFill: function (fill) {
            this.nodeFill = fill;
        },
        getNodeSelectFill: function () {
            return this.nodeSelectFill || this.baseNode.getSelectFil();
        },
        setNodeSelectFill: function (fill) {
            this.nodeSelectFill = fill;
        },
        getNodeExitFill: function () {
            return this.nodeExitFill || this.baseNode.getExitFill();
        },
        setNodeExitFil: function (fill) {
            this.nodeExitFill = fill;
        },
        getEdgeSelectFill: function () {
            return this.edgeSelectFill || this.baseEdge.getSelectFil();
        },
        setEdgeSelectFill: function (fill) {
            this.edgeSelectFill = fill;
        },
        getEdgeUnSelectFill: function () {
            return this.edgeUnSelectFill || this.baseEdge.getUnSelectFill();
        },
        setEdgeUnSelectFill: function (fill) {
            this.edgeUnSelectFill = fill;
        },

        getNodeColor: function (select, hasChildren) {
            if (hasChildren) {
                if (select) {
                    return this.getNodeSelectFill();
                } else {
                    return this.getNodeFill();
                }
            } else {
                return this.getNodeExitFill();
            }
        },

        getEdgeColor: function (select) {
            if (select) {
                return this.getEdgeSelectFill();
            } else {
                return this.getEdgeUnSelectFill();
            }
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
        addItemToShowMap: function (depth, obj, nodeid, type) {
            if (!this.showMap[depth]) {
                this.showMap[depth] = [];
            }

            var item = {obj:obj,type:type,nodeid:nodeid};

            this.showMap[depth].push(item);
        },


        /**
         * 通过depth 得到raphael对象数组
         * @param depth
         * @returns {Array}
         */
        getShowItemsFromShowMap: function (depth) {
            var thisobj = this,
                items = thisobj.showMap[depth],
                retItems = [];

            for (var i = 0; i < items.length; i++) {
                if (items[i].type !== "label") {
                    retItems.push(items[i]);
                }
            }
            return retItems;
        },

        /**
         * 删掉某层以后的展现数据
         * @param depth
         * @returns {Array} 返回这些展现的对象  包含svg对象和dom对象  均有 remove() 方法
         */
        removeAndReturnBebindShowData: function (depth) {
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

        },

        /**
         * 返回根节点的id
         */
        getRootId: function () {
            return this.root.id;
        }
    };


    /**
     options:       对外提供的 可以配置的属性 或 callback
     paper:{
		width,      //画布的宽度
		height,     //画布的高度         //如果不穿 默认是容器的宽高
	},
     node:{ //节点的属性        详见 Node类
		width,
		height,
		...
	},
     edge:{  //连线的属性  详见Edge类
        selectFill,
        unSelectFill
     }
     animate:false,     //是否增加动画，默认无
     duration:500,      //动画时间  单位 ms       建议不要高于500
     distance:num,   //父级节点和子节点之间的距离 默认110
     spacing:num,   //同级别节点之间的距离   默认10
     getNodeXXX:function(node),           // 可以根据node  获取到node对象的属性，也可以设置其属性，如设置node的颜色等 可以设置节点的 rate，影响连线入口小方块的高度 以及 入口管子的高度；以及连线的颜色等
     getNodeHeight、getNodeRate、getNodeExitProperties、getNodeEntraceProperties
     setNodeXXX:
     setNodeLabelHtml、setNodeLabelStyle、addNodeLabelEventListener
     **/

    /**
     * 树对象
     * @type {window.SpaceTree}
     * @returns {SpaceTree}
     */
    var SpaceTree = global.SpaceTree = function (container_id, options) {
        var thisobj = this,
            document = global.document || document;

        //树的容器
        thisobj.container = document.getElementById(container_id);

        thisobj.freshProperties(options);

        thisobj.paper = Raphael(thisobj.container, thisobj.viewBox.w, thisobj.viewBox.h);
        //盛放节点自定义文本的容器
        thisobj.labelContainer = document.createElement("div");
        thisobj.labelContainer.className = "st_label_container";
        thisobj.labelContainer.style.position = "absolute";
        thisobj.labelContainer.style.left = "0";
        thisobj.labelContainer.style.top = "0";

        thisobj.container.appendChild(thisobj.labelContainer);
        //树的数据加载对象
        thisobj.dataLoader = new DataLoader();

        //树的所有节点
        thisobj.nodes = [];
        //树的点击节点
        thisobj.clickNode = null;
        //增加一些事件监听
        thisobj.addEventListener();
        return thisobj;
    };

    /**
     * 树相关的 默认的全局属性
     * @type {{paper: {}, node: {width: number, height: number, type: string, strokeWidth: number, fill: string}, direct: string, distance: number, spacing: number, leval: number}}
     */
    SpaceTree.prototype.globalData = {
        paper: {    //画布默认属性

        },
        node: {     //节点的属性

        },
        edge: {},
        animate: false,     //是否增加动画，默认无
        duration: 200,      //动画时间  单位 ms       建议不要高于500
        direct: "left",         //树方向 默认从左到右
        distance: 110,          //上一级和下一级之间的距离
        spacing: 10,            //同级之间的距离
        leval: 1                //展现当前点击节点的下N层

        /**
         * direct、leval 以及 node的 strokeWidth、type 都是写死的，暂时不支持扩展，如果灵活点可以继续扩展，提供更多的功能和效果
         */
    };

    /**
     * 刷新树的属性
     * @param properties
     * @returns {boolean}
     */
    SpaceTree.prototype.freshProperties = function (properties) {
        var thisobj = this;
        //树的配置信息
        thisobj.options = Util.extend(Util.extend({}, thisobj.globalData), properties);
        //树的画布对象
        var paperOps = thisobj.options.paper;
        thisobj.viewBox = {
            x: 0,
            y: 0,
            w: paperOps.width || thisobj.container.clientWidth,
            h: paperOps.height || thisobj.container.clientHeight
        };
        thisobj.colorManager = new ColorManager(thisobj.options);
        return thisobj;
    };

    /**
     * 检查传入的id是否在树中的节点里已经存在
     * @param id
     * @returns {boolean}
     */
    SpaceTree.prototype.checkExist = function (id) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].getId() === id) {
                return true;
            }
        }
        return false;
    };

    /**
     * 初始化树的dataLoader对象 并且生成节点，加到树对象的节点集合中
     * @param jsonData 加载的数据
     * @returns {SpaceTree}
     */
    SpaceTree.prototype.loadData = function (jsonData) {
        var thisobj = this;
        return thisobj.freshData(jsonData);
    };

    SpaceTree.prototype.freshData = function (jsonData) {
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
     * @returns {*} 根节点的id
     */
    SpaceTree.prototype.getRootId = function () {
        return this.dataLoader.getRootId();
    };

    SpaceTree.prototype.isRoot = function (nodeid) {
        return (nodeid === this.getRootId());
    };

    /**
     * 点击某个节点默认的触发函数
     * @param id
     * @returns {SpaceTree}
     */
    SpaceTree.prototype.onclick = function (id) {
        this.clickNodeId = id;
        this.reDraw(this.clickNodeId);
        return this;
    };

    /**
     * 页面初次加载使用这个函数 或者 整体刷新树
     * @param jsonData
     * @returns {SpaceTree}
     */
    SpaceTree.prototype.draw = function (jsonData) {
        var thisobj = this;
        if (jsonData) {
            thisobj.loadData(jsonData);
        }
        /*清空画布*/
        thisobj.paper.clear();
        /*清空自定义节点文本的容器*/
        thisobj.labelContainer.innerHTML = "";
        /*画所有的节点-》包含所有需要展现的节点 以及 需要的连线*/
        thisobj.drawAllShowNodes();
        /*将画布和labelcontainer居中当前container*/
        thisobj.justifyTheContainer();
        return thisobj;
    };

    /**
     * 所有需要展现的点都重画，一般用于页面第一次加载或者重新加载树图
     * @returns {SpaceTree}
     */
    SpaceTree.prototype.drawAllShowNodes = function () {
        var thisobj = this,
            showNodeIds = thisobj.dataLoader.getShowNodeIds(thisobj.clickNodeId),
            drawNodes = thisobj.getDrawNodes(showNodeIds);

        for (var i = 0, ch = drawNodes.length; i < ch; i++) {
            thisobj.drawEachNode(drawNodes[i]);
            thisobj.drawEachEdge(drawNodes[i]);
        }
        return thisobj;
    };

    /**
     * 通过当前需要画的节点的id 得到节点对象的集合
     * @param ids
     * @returns {Array}
     */
    SpaceTree.prototype.getDrawNodes = function (ids) {
        var thisobj = this,
            allNodes = thisobj.nodes,
            drawNodes = [],
            node;

        for (var i = 0, ch = allNodes.length; i < ch; i++) {
            if (Util.indexOf(ids, allNodes[i].getId()) >= 0) {
                node = allNodes[i];
                drawNodes.push(node);
            }
        }
        return drawNodes;
    };

    /**
     * 在原有的树上再增加节点数据，用于树节点数据从服务器获取的情况
     * @param data
     * @returns {SpaceTree}
     */
    SpaceTree.prototype.addLoadData = function (data) {
        var thisobj = this,
            node;
        thisobj.dataLoader.addData(data);

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
     * 点击该节点之后，重画-》包含重画改点的子级别节点 以及该层节点 以及 该层节点和上层节点之间的连线
     * @param clickId
     * @returns {SpaceTree}
     */
    SpaceTree.prototype.reDraw = function (clickId) {
        var thisobj = this;
        thisobj.freshFrontShowNodes(clickId);
        thisobj.clickNodeId = clickId;
        /*画所有的节点-》包含所有需要展现的节点 以及 需要的连线*/
        thisobj.drawBebindShowNodes(clickId);
        /*将画布和labelcontainer居中当前container*/
        thisobj.justifyTheContainer();
        return thisobj;
    };

    /**
     * 点击节点之后 如果有设置 点击节点的颜色、点击路径连线颜色等 需要走这里
     * @param clickid
     * @returns {SpaceTree}
     */
    SpaceTree.prototype.freshFrontShowNodes = function (clickid) {
        //如果点击的不是根节点 需要更新
        if (clickid && !this.isRoot(clickid)) {
            var thisobj = this,
                dataLoader = thisobj.dataLoader,
                colorManager = thisobj.colorManager,
                depth = dataLoader.getNodeDepth(clickid),
                relateItems = thisobj.dataLoader.getShowItemsFromShowMap(depth),
                animate = thisobj.options.animate,
                duration = thisobj.options.duration,
                nodeid, item, select, hasChildren;

            for (var i = 0, ch = relateItems.length; i < ch; i++) {
                item = relateItems[i];
                nodeid = item.nodeid;
                select = (nodeid === clickid);
                if (item.type === "edge") {
                    if (animate) {
                        item.obj.animate({"fill": colorManager.getEdgeColor(select)}, duration);
                    } else {
                        item.obj.attr("fill", colorManager.getEdgeColor(select));
                    }
                } else if (item.type === "node") {
                    hasChildren = (dataLoader.getChildrenNodeIds(nodeid).length > 0);
                    if (animate) {
                        item.obj.animate({"fill": colorManager.getNodeColor(select, hasChildren)}, duration);
                    } else {
                        item.obj.attr("fill", colorManager.getNodeColor(select, hasChildren));
                    }
                }
            }
        }
        return thisobj;
    };

    /**
     * 只刷新这个节点之后的展现，一般用于点击某节点的情况
     * @param clickId
     * @returns {SpaceTree}
     */
    SpaceTree.prototype.drawBebindShowNodes = function (clickId) {
        var thisobj = this,
            clicked = clickId || thisobj.clickNodeId;

        if (clicked) {
            thisobj.clickNodeId = clicked;
        } else {
            return thisobj;
        }

        var dataLoader = thisobj.dataLoader,
            depth = dataLoader.getNodeDepth(clickId);

        /*去掉该点击节点之后的展现*/
        thisobj.removeBehindShow(depth);

        if (depth !== 0) {
            var childrenIds = dataLoader.getChildrenNodeIds(clicked),
                drawNodes = thisobj.getDrawNodes(childrenIds);

            for (var i = 0; i < drawNodes.length; i++) {
                thisobj.drawEachNode(drawNodes[i]);
                thisobj.drawEachEdge(drawNodes[i]);
            }
        }

        return thisobj;
    };

    /**
     * 删掉depth之后的展现
     * @param depth
     * @returns {SpaceTree}
     */
    SpaceTree.prototype.removeBehindShow = function (depth) {
        var thisobj = this,
            dataLoader = thisobj.dataLoader,
            delObjArr = [];

        if (depth === 0) {
            delObjArr = dataLoader.removeAndReturnBebindShowData(1);
        } else {
            delObjArr = dataLoader.removeAndReturnBebindShowData(depth);
        }

        for (var i = 0; i < delObjArr.length; i++) {
            if (delObjArr[i].obj.remove) {
                delObjArr[i].obj.remove();
            } else {
                if (delObjArr[i].obj.parentNode) {
                    delObjArr[i].obj.parentNode.removeChild(delObjArr[i].obj);
                }
            }
        }
        return thisobj;
    };

    SpaceTree.prototype.drawEachNode = function (node) {
        var thisobj = this,
            paper = thisobj.paper;

        var dataLoader = thisobj.dataLoader,
            colorManager = thisobj.colorManager,
            nodeid = node.getId(),
            clickFlowNodeIds = dataLoader.getClickFlowNodeIds(thisobj.clickNodeId),
            selected = Util.indexOf(clickFlowNodeIds, nodeid) >= 0,
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
            "fill": colorManager.getNodeColor(selected, hasChild),
            "stroke-width": 0
        }).data("nodeid", nodeid).data("type", "node");

        if (animate) {
            rect.animate({width: node.getWidth(), height: node.getHeight(), x: pos.x, y: pos.y}, duration);
        }

        dataLoader.addItemToShowMap(depth, rect, nodeid, "node");
        thisobj.drawEachNodeLabel(node, selected, hasChild, depth, pos);
    };

    /**
     * 画每个节点的内容  可以自定义样式 内容  和事件 具体参考 setNodeLabelHtml setNodeLabelStyle addNodeLabelEventListener
     * @param node
     * @param selected
     * @param hasChild
     * @param depth
     * @param pos
     */
    SpaceTree.prototype.drawEachNodeLabel = function (node, selected, hasChild, depth, pos) {
        var thisobj = this,
            dataLoader = thisobj.dataLoader,
            animate = thisobj.options.animate,
            duration = thisobj.options.duration || 200;
        var labelContainer = thisobj.labelContainer;

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

        dataLoader.addItemToShowMap(depth, nodeLable, node.getId(), "label");

        labelContainer.appendChild(nodeLable);

        if (animate) {
            setTimeout(function () {
                Util.fadeIn(nodeLable, parseInt(duration / 2));
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
            index = Util.indexOf(peerids, node_id),
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

    //节点之间的连线 如果是根节点不需要，方向：子节点开始连向父节点
    SpaceTree.prototype.drawEachEdge = function (node) {
        var thisobj = this,
            dataLoader = thisobj.dataLoader,
            colorManager = thisobj.colorManager,
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
                index = Util.indexOf(peerNodeIds, nodeid),
                depth = dataLoader.getNodeDepth(nodeid),
                clickFlowNodeIds = dataLoader.getClickFlowNodeIds(thisobj.clickNodeId),
                clickNodeChildren = dataLoader.getChildrenNodeIds(thisobj.clickNodeId),
                paper = thisobj.paper;

            function setNodeData(thisNode, parentNode) {
                /**
                 * 设置node的流入比率  可能影响连线终点的粗细等
                 */
                if (thisobj.options.getNodeRate) {
                    thisNode.setRate(thisobj.options.getNodeRate(thisNode, parentNode));
                }
            }

            setNodeData(thisNode, parentNode);
            //设置节点 出入口 小方块的属性  颜色 高 宽等


            //默认的出口属性，包括出口的宽，高，颜色 以及管道出口的高度  （出口 指 从一个节点流出到子节点  的 流出位置  ）
            var default_exit = {width: 10, height: 18.5, color: "#89B7E8", pipe_height: 4},
                default_entranceH = 0.2 * thisNodeHeight + (0.6 * thisNodeHeight / 100 ) * thisNode.getRate(),
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
                    thisNode.entrance = Util.extend(default_entrance, props);
                }
            }

            setNodePortProperties();

            var entrance = Util.extend(default_entrace, thisNode.entrance),                //入口小方块
                exit = Util.extend(default_exit, parentNode.exit),                         //出口小方块
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

            var selectState = (Util.indexOf(clickFlowNodeIds, nodeid) >= 0 || Util.indexOf(clickNodeChildren, nodeid) >= 0),
                connectFill = colorManager.getEdgeColor(selectState);

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
            }).data("nodeids", parentid + "-" + nodeid).data("nodeid", nodeid).data("type", "edge");

            if (animate) {
                rect_edge.animate({path: connectPathStr}, duration);
            }

            dataLoader.addItemToShowMap(depth, rect_edge, nodeid, "edge");


            //画入口小方块
            var rect_entracnce = paper.path(drawEntrancePathStr).attr({
                fill: entrance.color,
                "stroke-width": 0
            }).data("nodeid", nodeid).data("type", "entrance");

            if (animate) {
                rect_entracnce.animate({path: entrancePathStr}, duration);
            }

            dataLoader.addItemToShowMap(depth, rect_entracnce, nodeid, "entrance");

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
                }).data("nodeid", parentid).data("type", "exit");

                if (animate) {
                    rect_exit.animate({path: exitPathStr}, duration);
                }

                dataLoader.addItemToShowMap(depth, rect_exit, nodeid, "exit");
            }
        }
    };

    /**
     * 将tree的展现 居中放到container中
     */
    SpaceTree.prototype.justifyTheContainer = function () {
        var thisobj = this,
            dataLoader = thisobj.dataLoader,
            clickNodeId = thisobj.clickNodeId || thisobj.getRootId(),
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

        this.labelContainer.style.left = (0 - viewBox.x) + "px";
        this.labelContainer.style.top = (0 - viewBox.y) + "px";

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