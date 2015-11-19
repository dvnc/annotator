var Annotation = (function Annotation() {

    var Annotation = {
        annotator: null,
        range: {
            startContainerXPath: null,
            endContainerXPath: null,
            parentContainerXPath: null,
            startOffset: null,
            endOffset: null
        },
        id: null,
        selectedText: null,
        color: null,
        note: null,
        tags: [],

        init: function(obj) {
            if(!obj) return;

            if(obj.annotator) {
                this.annotator = obj.annotator;
            }
            if(obj.selectedRange) {
                this.saveSelection(obj.selectedRange);
            } else if(obj.savedAnnotation) {
                var savedAnnotation = obj.savedAnnotation;

                this.range          = savedAnnotation.range;
                this.id             = savedAnnotation.id;
                this.selectedText   = savedAnnotation.selectedText;
                this.color          = savedAnnotation.color;
                this.note           = savedAnnotation.note;
                this.tags           = savedAnnotation.tags;
            }

            this.setRangeElements();

        },

        setRangeElements: function() {
            this.$parentContainer = $(this.annotator.findElementByXPath(this.range.parentContainerXPath));
            this.$startContainer = $(this.annotator.findElementByXPath(this.range.startContainerXPath));
            this.$endContainer = $(this.annotator.findElementByXPath(this.range.endContainerXPath));

        },

        render: function(opts) {
            if(opts && opts.temporary) {
                this.wrapNodes(true);
            } else if(opts && opts.convert) {
                this.convertFromTemporary();
            } else if(opts && opts.update) {
                this.updateAnnotation();
            } else {
                this.wrapNodes();
            }

            // remove existing selection
            // we don't need it anymore
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            } else if (document.selection) {
                document.selection.empty();
            }
        },

        updateAnnotation: function() {
            var $parentContainer = this.$parentContainer;
 
            var renderedAnnotation = $parentContainer
                                        .find(".annotation[data-id='" + this.id + "']");

            renderedAnnotation.removeClass("annotation");

            renderedAnnotation
                .removeAttr("class")
                .addClass("annotation")
                .addClass(this.color)
                .removeAttr("style");
        },

        saveSelection: function(range) {
            var parentContainer = range.commonAncestorContainer;
            var startContainer = range.startContainer;
            var endContainer = range.endContainer;

            var startOffset = range.startOffset;
            var endOffset = range.endOffset;

            var parentNode = this.getParentNodeFor(parentContainer);
            var startNode = this.getParentNodeFor(startContainer);
            var endNode = this.getParentNodeFor(endContainer);

            var nodesBetweenStart = this.getNodesToWrap(parentNode, startNode.firstChild, startContainer);
            var nodesBetweenEnd = this.getNodesToWrap(parentNode, endNode.firstChild, endContainer);

            if(nodesBetweenStart.length) {
                for(var i = 0; i < nodesBetweenStart.length; i++) {
                    var characterLength = nodesBetweenStart[i].nodeValue.length;
                    startOffset += characterLength;
                }
            }

            if(nodesBetweenEnd.length) {
                for(var i = 0; i < nodesBetweenEnd.length; i++) {
                    endOffset += nodesBetweenEnd[i].nodeValue.length;
                }
            }

            var selectedContent = this.getSelectionContent(range);

            this.range = {
                startContainerXPath: this.annotator.createXPathFromElement(startNode),
                endContainerXPath: this.annotator.createXPathFromElement(endNode),
                parentContainerXPath: this.annotator.createXPathFromElement(parentNode),
                startOffset: startOffset,
                endOffset: endOffset,
            };

            this.id = this.generateRandomID();
            this.selectedText = selectedContent;
        },

        getSelectionContent: function(range) {
            var container = document.createElement("div");
            container.appendChild(range.cloneContents());
            var text = container.textContent;
            return text;
        },

        getParentNodeFor: function(node) {

            while(node.nodeType != 1 || (node.nodeType == 1 && node.classList.contains("js-no-select")) ) {
                node = node.parentNode;
            }

            return node;
        },

        generateRandomID: function() {
            return 'annotation-' + new Date().getTime();
        },

        save: function(obj) {
            if(!obj) return;

            this.color = obj.color;

            if(obj.note)
                this.note = obj.note;

            if(obj.tags && obj.tags.length) {
                this.tags = obj.tags
            }

            var data = this.serialize();

            if(obj && obj.debug) {
                console.log(JSON.stringify(data));
            } else {
                this.postToRemote();
            }

            if(obj && obj.cbk) obj.cbk(this);

        },

        // TODO
        destroy: function(cbk) {
            if(cbk) cbk();
        },

        // TODO
        postToRemote: function() {
            console.log("AJAX");
        },

        serialize: function() {
            var range = this.range;
            return {
                 range: {
                    startOffset: range.startOffset,
                    endOffset: range.endOffset,
                    startContainerXPath: range.startContainerXPath,
                    endContainerXPath: range.endContainerXPath,
                    parentContainerXPath: range.parentContainerXPath
                },
                id:  this.id,
                selectedText: this.selectedText,
                color: this.color,
                note: this.note,
                tags: this.tags
            }
        },

        getContainedNodes: function() {
            var range, startContainer, endContainer, parentContainer;
            var nodes = [];

            range = this.range;
            
            parentContainer = this.$parentContainer.get(0);
            startContainer = this.$startContainer.get(0);
            endContainer = this.$endContainer.get(0);

            var startTextNodeParams = this.getTextNodeAtOffset(startContainer, range.startOffset);
                endTextNodeParams = this.getTextNodeAtOffset(endContainer, range.endOffset);

            var startTextNode = startTextNodeParams[0],
                startOffset = startTextNodeParams[1],
                endTextNode = endTextNodeParams[0],
                endOffset = endTextNodeParams[1];

            console.log(startTextNode, endTextNode)


            if(startTextNode == endTextNode) {
                var startTextNodeSplit = startTextNode.splitText(startOffset);
                var endTextNodeSplit = startTextNodeSplit.splitText(endOffset - startOffset);    
            } else {
                var startTextNodeSplit = startTextNode.splitText(startOffset);
                var endTextNodeSplit = endTextNode.splitText(endOffset);    
            }


            var innerNodes = this.getNodesToWrap(parentContainer, startTextNodeSplit, endTextNodeSplit);


            for(var i = 0; i < innerNodes.length; i++) {
                nodes.push(innerNodes[i]);
            }

            return nodes;
        },


        getTextNodeAtOffset: function(rootNode, offset) {
            var textNode,
            count = 0,
            found = false;

            function getTextNodes(node) {
                if (node.nodeType == Node.TEXT_NODE && !/^\s*$/.test(node.nodeValue)) {
                    if ( found != true) {
                        if(count+node.nodeValue.length >= offset) {
                            textNode = node;
                            found = true;    
                        } else {
                            count += node.nodeValue.length
                        }
                    }
                } else if (node.nodeType == Node.ELEMENT_NODE ) {
                    for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                        getTextNodes(node.childNodes[i]);
                    }
                }
            }

            getTextNodes(rootNode);
            return [textNode, (count == 0 ? offset : offset - count)];

        },

        getNodesToWrap: function(rootNode, startNode, endNode) {
            var pastStartNode = false, reachedEndNode = false, textNodes = [];

            function getTextNodes(node) {

                if (node == startNode) {
                    pastStartNode = true;
                } 
                if (node == endNode) {
                    reachedEndNode = true;
                } else if (node.nodeType == Node.TEXT_NODE) {
                    if (pastStartNode && !reachedEndNode && !/^\s*$/.test(node.nodeValue)) {
                        textNodes.push(node);
                    }
                } else if (node.nodeType == Node.ELEMENT_NODE ) {
                    
                    for (var i = 0, len = node.childNodes.length; !reachedEndNode && i < len; ++i) {
                        getTextNodes(node.childNodes[i]);
                    }
                }
            }

            getTextNodes(rootNode);
            return textNodes;
        },


        wrapNodes: function(temporary) {
            var nodes = this.getContainedNodes();
            var newNode = this.createWrapperElement(temporary)
            for(var i = 0; i < nodes.length; i++) {
                $(nodes[i]).wrap(newNode);
            }
        },

        createWrapperElement: function(temporary) {
            var annotationID = this.id;

            var span = document.createElement("span");

            if(!temporary) {
                span.classList.add("annotation");
                span.classList.add(this.color);
            } else {
                span.classList.add("temporary");
            }

            span.setAttribute("data-id", annotationID);

            return span;
        },

        removeTemporary: function() {
            var temporary = this.$parentContainer.find(".temporary");

            for(var i = 0; i < temporary.length; i++) {
                var elem = temporary[i];
                $(elem.childNodes[0]).unwrap();
            }
        },

        convertFromTemporary: function() {
            var temporary = this.$parentContainer.find(".temporary");

            temporary
            .removeClass("temporary")
            .addClass("annotation")
            .addClass(this.color);

        }


    };

    return Annotation;
})();